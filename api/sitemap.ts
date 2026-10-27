// /sitemap.xml (rewritten here by vercel.json): the home page, the news index, every
// published article and every gallery album, so Google finds new pages without waiting to
// stumble on a link. Articles also list their photo, so it can show up in Google Images.
import { listAlbums } from "./_lib/gallery";
import { optimizeImageUrl } from "./_lib/images";
import { newsPath } from "./_lib/newsPath";
import { SITE_URL, absoluteImageUrl, escapeHtml, fetchPublishedGallery, fetchPublishedNews } from "./_lib/seo";

type Entry = { path: string; lastmod: string | null; image?: string | null };

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const [news, gallery] = await Promise.all([fetchPublishedNews(origin), fetchPublishedGallery(origin)]);
  const articles: Entry[] = (news ?? []).map((item) => ({
    path: newsPath(item, news ?? []),
    lastmod: (item.updated_at || item.created_at).slice(0, 10),
    image: absoluteImageUrl(optimizeImageUrl(item.image_url, 1200)),
  }));
  const entries: Entry[] = [
    { path: "/", lastmod: null },
    // The news index changes exactly when an article does.
    { path: "/berita", lastmod: articles.map((entry) => entry.lastmod ?? "").sort().pop() || null },
    ...articles,
    ...listAlbums(gallery ?? []).map((album) => ({ path: `/galeri/${album.slug}`, lastmod: null })),
  ];
  const body = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
    ...entries.map(({ path, lastmod, image }) =>
      `  <url><loc>${escapeHtml(`${SITE_URL}${path}`)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}${image ? `<image:image><image:loc>${escapeHtml(image)}</image:loc></image:image>` : ""}</url>`),
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
