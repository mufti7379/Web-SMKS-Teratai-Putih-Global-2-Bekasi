// /news-sitemap.xml (rewritten here by vercel.json): the Google News sitemap. As Google asks, it
// lists only articles posted in the last two days, each with the publication's name and
// language, its publication time and title — so a new article reaches Google News within
// minutes. Older articles stay in /sitemap.xml. Usually empty between posts, which Search
// Console flags as a warning but does no harm.
import { newsPath } from "./_lib/newsPath";
import { SITE_NAME, SITE_URL, escapeHtml, fetchPublishedNews, newsPublishedAt } from "./_lib/seo";

const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const news = await fetchPublishedNews(new URL(request.url).origin);
  const recent = (news ?? []).filter((item) => Date.now() - Date.parse(item.created_at) <= TWO_DAYS);
  const body = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">`,
    ...recent.map((item) => [
      `  <url><loc>${escapeHtml(`${SITE_URL}${newsPath(item, news ?? [])}`)}</loc><news:news>`,
      // The name must match the publication's name on news.google.com — the site's name.
      `<news:publication><news:name>${escapeHtml(SITE_NAME)}</news:name><news:language>id</news:language></news:publication>`,
      `<news:publication_date>${newsPublishedAt(item)}</news:publication_date><news:title>${escapeHtml(item.title)}</news:title>`,
      `</news:news></url>`,
    ].join("")),
    `</urlset>`,
  ].join("\n");
  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      // Short, so a new article shows up quickly; shorter still if the news fetch failed.
      "cache-control": news ? "public, s-maxage=300, stale-while-revalidate=3600" : "public, s-maxage=60",
    },
  });
}

export const HEAD = GET;
