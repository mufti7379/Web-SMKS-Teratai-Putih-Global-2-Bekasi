// The public site in English or Japanese, machine-translated in the browser by Google's website
// translator. The visitor's pick is kept in localStorage and in the "googtrans" cookie the
// translator reads when it starts. Indonesian, the site's own language, loads nothing extra.
import { useEffect, useState } from "react";

export type SiteLanguage = "id" | "en" | "ja";

export const siteLanguages: { code: SiteLanguage; short: string; name: string; hint: string }[] = [
  { code: "id", short: "ID", name: "Bahasa Indonesia", hint: "Bahasa asli situs" },
  { code: "en", short: "EN", name: "English", hint: "Terjemahan otomatis Google" },
  { code: "ja", short: "JA", name: "日本語", hint: "Terjemahan otomatis Google" },
];

const STORAGE_KEY = "site-language";
const isSiteLanguage = (value: unknown): value is SiteLanguage => value === "id" || value === "en" || value === "ja";

type TranslateWindow = Window & {
  googleTranslateElementInit?: () => void;
  google?: { translate: { TranslateElement: new (options: object, elementId: string) => unknown } };
};

/** The language picked on an earlier visit; the cookie stands in where storage is blocked. */
export function savedLanguage(): SiteLanguage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isSiteLanguage(stored)) return stored;
  } catch { /* storage blocked */ }
  const fromCookie = document.cookie.match(/(?:^|;\s*)googtrans=\/id\/(en|ja)/)?.[1];
  return isSiteLanguage(fromCookie) ? fromCookie : "id";
}

// The translator may also set its cookie on the parent domains, so clearing goes through every level.
function cookieDomains() {
  const parts = location.hostname.split(".");
  return [undefined, ...parts.slice(0, -1).map((_, index) => parts.slice(index).join("."))];
}

function setTranslationCookie(language: SiteLanguage) {
  for (const domain of cookieDomains()) document.cookie = `googtrans=; path=/; max-age=0${domain ? `; domain=${domain}` : ""}`;
  if (language !== "id") document.cookie = `googtrans=/id/${language}; path=/; max-age=31536000`;
}

/**
 * The translator swaps text nodes for <font> wrappers, so React later fails to remove a node, or
 * insert before one, that is no longer where it left it — and the page crashes on the next update.
 * The usual workaround (facebook/react#11538): skip those calls instead of throwing.
 */
function guardDomAgainstTranslation() {
  const removeChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child;
    return removeChild.call(this, child) as T;
  };
  const insertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, node: T, reference: Node | null): T {
    if (reference && reference.parentNode !== this) return node;
    return insertBefore.call(this, node, reference) as T;
  };
}

let widget: Promise<HTMLSelectElement | null> | null = null;

/** Google's translator, loaded once; resolves to its (hidden) language list, or null if it never came up. */
function loadTranslator() {
  widget ??= new Promise((resolve) => {
    guardDomAgainstTranslation();
    const host = document.createElement("div");
    host.id = "google_translate_element";
    document.body.appendChild(host);
    const translateWindow = window as TranslateWindow;
    translateWindow.googleTranslateElementInit = () => {
      new translateWindow.google!.translate.TranslateElement({ pageLanguage: "id", includedLanguages: "en,ja", autoDisplay: false }, host.id);
    };
    const script = document.createElement("script");
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
    const started = Date.now();
    const waitForList = () => {
      const list = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
      if (list) resolve(list);
      else if (Date.now() - started > 15000) resolve(null);
      else setTimeout(waitForList, 200);
    };
    waitForList();
  });
  return widget;
}

async function translateTo(language: "en" | "ja") {
  if (!(await loadTranslator()) || pageLanguage() === language) return;
  // The translator may rebuild its list after starting, so this takes the one on the page now.
  const list = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
  if (!list) return;
  list.value = language;
  list.dispatchEvent(new Event("change"));
  // Now and then it ignores a switch anyway. The cookie already holds the new language, so a
  // reload settles it — unless the visitor has picked yet another one meanwhile.
  setTimeout(() => {
    if (savedLanguage() === language && pageLanguage() !== language) location.reload();
  }, 6000);
}

/** The language the page is in right now: Indonesian until Google's translator has switched it (it then marks <html> and sets its lang). */
function pageLanguage(): SiteLanguage {
  const html = document.documentElement;
  if (!/\btranslated-(ltr|rtl)\b/.test(html.className)) return "id";
  const lang = html.lang.slice(0, 2);
  return lang === "en" || lang === "ja" ? lang : savedLanguage();
}

/**
 * The page's language, for text the site translates itself (marked translate="no" so Google
 * leaves it alone). It changes together with the rest of the page, once the translator is done.
 */
export function usePageLanguage() {
  const [language, setLanguage] = useState(pageLanguage);
  useEffect(() => {
    const observer = new MutationObserver(() => setLanguage(pageLanguage()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "lang"] });
    return () => observer.disconnect();
  }, []);
  return language;
}

/**
 * On a public page: carry on in the language the visitor picked before. The translator starts in
 * the cookie's language by itself; asking it again here would start a second translation, which
 * could finish after — and undo — a language the visitor picks next.
 */
export function resumeLanguage() {
  const language = savedLanguage();
  if (language === "id") return;
  setTranslationCookie(language);
  void loadTranslator();
}

export function switchLanguage(language: SiteLanguage) {
  try { localStorage.setItem(STORAGE_KEY, language); } catch { /* the cookie still carries it */ }
  setTranslationCookie(language);
  // The translator can't hand the page back cleanly, so going back to Indonesian reloads it.
  if (language === "id") {
    if (widget) location.reload();
    return;
  }
  void translateTo(language);
}
