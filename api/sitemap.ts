// /sitemap.xml (rewritten here by vercel.json): the home page, the news index, every
// published article and every gallery album, so Google finds new pages without waiting to
// stumble on a link.
import { listAlbums } from "./_lib/gallery";
import { newsPath } from "./_lib/newsPath";
import { SITE_URL, fetchPublishedGallery, fetchPublishedNews } from "./_lib/seo";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const [news, gallery] = await Promise.all([fetchPublishedNews(origin), fetchPublishedGallery(origin)]);
  const entries = [
    { path: "/", lastmod: null as string | null },
    { path: "/berita", lastmod: null as string | null },
    ...(news ?? []).map((item) => ({ path: newsPath(item, news ?? []), lastmod: (item.updated_at || item.created_at).slice(0, 10) })),
    ...listAlbums(gallery ?? []).map((album) => ({ path: `/galeri/${album.slug}`, lastmod: null as string | null })),
  ];
  const body = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...entries.map(({ path, lastmod }) => `  <url><loc>${SITE_URL}${path}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`),
    `</urlset>`,
  ].join("\n");
  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      // An hour normally; only briefly if the news fetch failed and the list is incomplete.
      "cache-control": news && gallery ? "public, s-maxage=3600, stale-while-revalidate=86400" : "public, s-maxage=60",
    },
  });
}

export const HEAD = GET;
