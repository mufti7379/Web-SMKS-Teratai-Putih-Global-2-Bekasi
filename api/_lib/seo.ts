// Shared by the SEO functions: site facts, the news fetch, and the <head> tags they inject
// into the app's index.html so crawlers and link previews (WhatsApp, Facebook) see each
// page's own title, description, image and structured data without running JavaScript.
import type { AlbumRef } from "./gallery";
import type { NewsRef } from "./newsPath";

export const SITE_URL = "https://www.smk-terataiputih2.sch.id";
export const SITE_NAME = "SMK Teratai Putih Global 2 Bekasi";
export const LOGO_URL = `${SITE_URL}/logo-tp2.png`;

export type PublicNews = NewsRef & { description: string; image_url: string | null; badge: string | null; link: string | null; updated_at: string };

export type PublicGalleryItem = AlbumRef & { title: string; image_url: string | null; created_at: string };

/**
 * Where the functions fetch this site's own content and app shell from. The public domain sits
 * behind Cloudflare, and fetching it from inside a function fails there (every page and album
 * answered 502); the project's vercel.app alias redirects to it (vercel.json). So on that domain
 * they go to this deployment's own address (VERCEL_URL) — the same build, reached directly.
 * Other origins (previews, local) are used as they are.
 */
const DEPLOYMENT_ORIGIN = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : SITE_URL;
const fetchOrigin = (origin: string) => (origin === SITE_URL ? DEPLOYMENT_ORIGIN : origin);

// Deployment addresses sit behind Vercel's Deployment Protection; these fetches pass with the
// automation bypass secret Vercel sets once "Protection Bypass for Automation" is on. Without it
// they'd be redirected to Vercel's login page — `redirect: "error"` makes that a failure, never
// a login page served as the site.
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const internalFetch = (url: string, headers: Record<string, string> = {}) =>
  fetch(url, { redirect: "error", headers: bypassSecret ? { ...headers, "x-vercel-protection-bypass": bypassSecret } : headers });

/** Published CMS content through this site's own /api proxy, so the backend URL stays only in vercel.json. Null when unreachable. */
async function fetchPublicContent<T>(origin: string, resource: string): Promise<T[] | null> {
  try {
    const response = await internalFetch(`${fetchOrigin(origin)}/api/content/${resource}`, { accept: "application/json" });
    return response.ok ? ((await response.json()) as T[]) : null;
  } catch {
    return null;
  }
}

export const fetchPublishedNews = (origin: string) => fetchPublicContent<PublicNews>(origin, "news");
export const fetchPublishedGallery = (origin: string) => fetchPublicContent<PublicGalleryItem>(origin, "gallery");

/** The built app shell (dist/index.html), fetched from this deployment's static files. */
export async function fetchAppShell(origin: string): Promise<string | null> {
  try {
    const response = await internalFetch(`${fetchOrigin(origin)}/index.html`);
    return response.ok ? await response.text() : null;
  } catch {
    return null;
  }
}

/** A picture for crawlers, who need a full address — CMS pictures are site-relative /media links. */
export const absoluteImageUrl = (url: string | null | undefined) => (url ? new URL(url, SITE_URL).href : null);

export const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * When an article first went out, for its structured data and the Google News sitemap — the
 * two must agree. It's the date the article shows; when that's also the day it was posted
 * (Jakarta time), the posting timestamp gives Google the hour and time zone too.
 */
export function newsPublishedAt(item: PublicNews) {
  if (!item.date) return item.created_at;
  const postedDay = new Date(item.created_at).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  return item.date.slice(0, 10) === postedDay ? item.created_at : item.date.slice(0, 10);
}

/** Same order as the app's news pages: by news date, newest first. */
export const sortNewsNewestFirst = <T extends PublicNews>(news: T[]) => [...news].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

/** First sentence-ish chunk of a body text, for meta descriptions (~160 chars). */
export function excerpt(text: string, max = 160) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 80 ? cut.lastIndexOf(" ") : cut.length)}…`;
}

type HeadTags = {
  title: string;
  description: string;
  /** Path on SITE_URL, e.g. "/berita". */
  path: string;
  image?: string | null;
  type?: "website" | "article";
  noindex?: boolean;
  structuredData?: object;
};

export function renderHead({ title, description, path, image, type = "website", noindex, structuredData }: HeadTags) {
  const url = `${SITE_URL}${path}`;
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    // Large previews are what Top Stories and Discover need to show the photo, not a thumbnail.
    noindex ? `<meta name="robots" content="noindex" />` : `<meta name="robots" content="max-image-preview:large" />\n    <link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:locale" content="id_ID" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:image" content="${escapeHtml(absoluteImageUrl(image) ?? LOGO_URL)}" />`,
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
  ];
  // "<" escaped so a title containing "</script>" can't break out of the JSON-LD block.
  if (structuredData) tags.push(`<script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, "\\u003c")}</script>`);
  return tags.join("\n    ");
}

// index.html wraps its default (home page) tags in these markers; pages served through the
// functions swap that whole block for their own.
const HEAD_BLOCK = /<!-- seo:start[^>]*-->[\s\S]*?<!-- seo:end -->/;

export function injectHead(shell: string, head: string) {
  return HEAD_BLOCK.test(shell) ? shell.replace(HEAD_BLOCK, () => `<!-- seo:start -->\n    ${head}\n    <!-- seo:end -->`) : shell;
}

// index.html's <body> carries the home page's text in a <noscript> between these markers, for
// crawlers that don't run JavaScript (Bing, AI search bots). Pages served through the functions
// swap it for their own text — or drop it — so no page shows another page's content.
const FALLBACK_BLOCK = /<!-- fallback:start[^>]*-->[\s\S]*?<!-- fallback:end -->/;

export function injectFallback(shell: string, html: string) {
  return shell.replace(FALLBACK_BLOCK, () => (html ? `<noscript>${html}</noscript>` : ""));
}

/** Body text as HTML paragraphs: blank lines split paragraphs, single line breaks stay. */
export const paragraphsHtml = (text: string) =>
  text.trim().split(/\n\s*\n/).map((block) => `<p>${escapeHtml(block.trim()).replace(/\n/g, "<br />")}</p>`).join("");

export function htmlResponse(body: string, status: number, cacheControl: string) {
  return new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": cacheControl } });
}
