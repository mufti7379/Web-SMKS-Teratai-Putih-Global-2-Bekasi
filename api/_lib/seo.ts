// Shared by the SEO functions: site facts, the news fetch, and the <head> tags they inject
// into the app's index.html so crawlers and link previews (WhatsApp, Facebook) see each
// page's own title, description, image and structured data without running JavaScript.
import type { AlbumRef } from "./gallery";
import type { NewsRef } from "./newsPath";

export const SITE_URL = "https://www.smk-terataiputih2.sch.id";
export const SITE_NAME = "SMK Teratai Putih Global 2 Bekasi";
export const LOGO_URL = `${SITE_URL}/logo-tp2.png`;

export type PublicNews = NewsRef & { description: string; image_url: string | null; badge: string | null; updated_at: string };

export type PublicGalleryItem = AlbumRef & { title: string; image_url: string | null; created_at: string };

/** Published CMS content through this site's own /api proxy, so the backend URL stays only in vercel.json. Null when unreachable. */
async function fetchPublicContent<T>(origin: string, resource: string): Promise<T[] | null> {
  try {
    const response = await fetch(`${origin}/api/content/${resource}`, { headers: { accept: "application/json" } });
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
    const response = await fetch(`${origin}/index.html`);
    return response.ok ? await response.text() : null;
  } catch {
    return null;
  }
}

/** A picture for crawlers, who need a full address — CMS pictures are site-relative /media links. */
export const absoluteImageUrl = (url: string | null | undefined) => (url ? new URL(url, SITE_URL).href : null);

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

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
    noindex ? `<meta name="robots" content="noindex" />` : `<link rel="canonical" href="${escapeHtml(url)}" />`,
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

export function htmlResponse(body: string, status: number, cacheControl: string) {
  return new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": cacheControl } });
}
