import { useState } from "react";
import { Check, Globe } from "lucide-react";
import { NavMenu, NavMenuMobile, navMenuItemClass, navMenuMobileItemClass } from "@/components/NavMenu";
import { useNavText } from "@/lib/navText";
import { savedLanguage, siteLanguages, switchLanguage } from "@/lib/translate";
import type { SiteLanguage } from "@/lib/translate";

function useSiteLanguage() {
  const [language, setLanguage] = useState(savedLanguage);
  const pick = (next: SiteLanguage) => {
    setLanguage(next);
    switchLanguage(next);
  };
  return { language, current: siteLanguages.find((entry) => entry.code === language) ?? siteLanguages[0], pick };
}

/**
 * The language picker in the site header (from lg up). Its names stay as written; the rest is the
 * header's own English or Japanese (see navText), so the header marks it translate="no".
 */
export function LanguageMenu() {
  const { language, current, pick } = useSiteLanguage();
  const t = useNavText();
  return (
    <NavMenu label={<span className="inline-flex items-center gap-1.5"><Globe size={15} aria-hidden="true" />{current.short}</span>} ariaLabel={`${t("Bahasa")}: ${current.name}`} testId="language-menu" menuTestId="language-options">
      {(close) => siteLanguages.map((entry) => (
        <li key={entry.code}>
          <button type="button" onClick={() => { close(); pick(entry.code); }} aria-current={entry.code === language ? "true" : undefined} className={`${navMenuItemClass} flex items-center justify-between gap-3 ${entry.code === language ? "bg-slate-50" : ""}`} data-testid={`language-${entry.code}`}>
            <span><span className="block text-sm font-extrabold text-[#0a3358]">{entry.name}</span><span className="mt-0.5 block text-xs text-slate-500">{t(entry.hint)}</span></span>
            {entry.code === language && <Check size={16} className="shrink-0 text-emerald-600" aria-hidden="true" />}
          </button>
        </li>
      ))}
    </NavMenu>
  );
}

/** The same in the hamburger menu, which a picked language closes behind it. */
export function LanguageMenuMobile({ onPick }: { onPick: () => void }) {
  const { language, current, pick } = useSiteLanguage();
  const t = useNavText();
  return (
    <NavMenuMobile label={<span className="flex items-center gap-2"><Globe size={16} aria-hidden="true" />{t("Bahasa")}<span className="text-xs font-semibold text-slate-400">{current.short}</span></span>} testId="mobile-language-menu" listTestId="mobile-language-options">
      {siteLanguages.map((entry) => (
        <li key={entry.code}>
          <button type="button" onClick={() => { onPick(); pick(entry.code); }} aria-current={entry.code === language ? "true" : undefined} className={`${navMenuMobileItemClass} ${entry.code === language ? "text-[#0f4c81]" : "text-slate-500"}`} data-testid={`mobile-language-${entry.code}`}>{entry.name}</button>
        </li>
      ))}
    </NavMenuMobile>
  );
}
