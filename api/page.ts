// Serves the news and album pages as the normal app shell, but with that page's own <head>:
// title, description, canonical URL, share image and structured data. vercel.json rewrites
// those URLs here with a `route` query param:
//   list    — /berita (optional ?halaman=N)
//   article — /berita/<bulan>/<tahun>/<slug>
//   legacy  — /berita/<id>, the old id links, permanently redirected to the readable URL
//   album   — /galeri/<slug>, a gallery album such as /galeri/perpisahan-2025
// The React app still renders everything in the browser; this only changes what crawlers
// and link previews read before JavaScript runs.
import { albumDrivePictures } from "./_lib/drive";
import { albumDriveFolders, galleryMedia, galleryStill, isInAlbum, isSinglePhoto, listAlbums } from "./_lib/gallery";
import { optimizeImageUrl } from "./_lib/images";
import { findNewsByPath, newsPath } from "./_lib/newsPath";
import { LOGO_URL, SITE_NAME, SITE_URL, absoluteImageUrl, excerpt, fetchAppShell, fetchPublishedGallery, fetchPublishedNews, htmlResponse, injectHead, renderHead } from "./_lib/seo";
import type { PublicNews } from "./_lib/seo";

// Vercel's CDN keeps each page for 5 minutes (new or edited news shows up within that), and
// serves the stale copy while refreshing for up to a day if the backend is slow.
const CACHE = "public, s-maxage=300, stale-while-revalidate=86400";
// Don't let a backend hiccup get cached for long.
const CACHE_SHORT = "public, s-maxage=30";

const redirect = (path: string) => new Response(null, { status: 308, headers: { location: path, "cache-control": CACHE } });

function articleStructuredData(item: PublicNews, path: string) {
  const school = { "@type": "HighSchool", "@id": `${SITE_URL}/#school`, name: SITE_NAME, url: `${SITE_URL}/`, logo: LOGO_URL };
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: item.title.slice(0, 110),
    description: excerpt(item.description),
    image: [absoluteImageUrl(optimizeImageUrl(item.image_url, 1200)) ?? LOGO_URL],
    datePublished: item.date ?? item.created_at,
    dateModified: item.updated_at || item.created_at,
    mainEntityOfPage: `${SITE_URL}${path}`,
    ...(item.badge ? { articleSection: item.badge } : {}),
    author: school,
    publisher: school,
  };
}

async function albumPage(origin: string, shell: string, requested: string) {
  const slug = requested.toLowerCase();
  const gallery = await fetchPublishedGallery(origin);
  if (!gallery) return htmlResponse(shell, 200, CACHE_SHORT);
  const album = listAlbums(gallery).find((entry) => entry.slug === slug);
  if (!album) return htmlResponse(injectHead(shell, renderHead({ title: `Album tidak ditemukan — ${SITE_NAME}`, description: "Album yang Anda cari tidak ada.", path: "/", noindex: true })), 404, CACHE);
  if (requested !== slug) return redirect(`/galeri/${slug}`);
  const drivePictures = (await albumDrivePictures(albumDriveFolders(slug, gallery))) ?? [];
  // Same order as the album page: the Drive folders' pictures, then single items filed under the album.
  const media = [
    ...drivePictures.map((src) => ({ kind: "image", src }) as const),
    ...gallery.filter((item) => isSinglePhoto(item) && isInAlbum(item, slug)).sort((a, b) => a.created_at.localeCompare(b.created_at)).map((item) => galleryMedia(item.image_url ?? "")),
  ];
  // The first photo with a still (uploaded videos have none) becomes the share preview.
  const cover = media.map((entry) => galleryStill(entry, 1200)).find(Boolean) ?? null;
  const head = renderHead({
    title: `Galeri ${album.name} — ${SITE_NAME}`,
    description: media.length ? `Kumpulan ${media.length} foto ${album.name} ${SITE_NAME}.` : `Galeri foto ${album.name} ${SITE_NAME}.`,
    path: `/galeri/${slug}`,
    image: cover,
  });
  return htmlResponse(injectHead(shell, head), 200, CACHE);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const shell = await fetchAppShell(url.origin);
  if (!shell) return new Response("Halaman belum bisa dimuat. Silakan coba lagi.", { status: 502, headers: { "cache-control": "no-store" } });

  if (params.get("route") === "list") {
    const page = Math.max(1, Math.floor(Number(params.get("halaman"))) || 1);
    const head = renderHead({
      title: `Berita Sekolah${page > 1 ? ` · Halaman ${page}` : ""} — ${SITE_NAME}`,
      description: `Berita, pengumuman, prestasi, dan kegiatan terbaru ${SITE_NAME}, SMK swasta terakreditasi A di Bekasi Selatan.`,
      path: page > 1 ? `/berita?halaman=${page}` : "/berita",
    });
    return htmlResponse(injectHead(shell, head), 200, CACHE);
  }

  if (params.get("route") === "album") return albumPage(url.origin, shell, params.get("album") ?? "");

  const news = await fetchPublishedNews(url.origin);
  // Backend unreachable: hand over the plain shell and let the app show its own error state.
  if (!news) return htmlResponse(shell, 200, CACHE_SHORT);

  const notFound = () => htmlResponse(injectHead(shell, renderHead({ title: `Berita tidak ditemukan — ${SITE_NAME}`, description: "Berita ini mungkin sudah dihapus atau tidak lagi ditampilkan.", path: "/berita", noindex: true })), 404, CACHE);

  if (params.get("route") === "legacy") {
    const item = news.find((entry) => entry.id === params.get("id"));
    return item ? redirect(newsPath(item, news)) : notFound();
  }

  const [bulan, tahun, slug] = [params.get("bulan") ?? "", params.get("tahun") ?? "", params.get("slug") ?? ""];
  const item = findNewsByPath(news, bulan, tahun, slug);
  if (!item) return notFound();
  // One URL per article: "/berita/9/2026/Judul" and friends collapse onto the canonical spelling.
  const path = newsPath(item, news);
  if (path !== `/berita/${bulan}/${tahun}/${slug}`) return redirect(path);

  const head = renderHead({
    title: `${item.title} — ${SITE_NAME}`,
    description: excerpt(item.description) || `Berita dari ${SITE_NAME}.`,
    path,
    image: optimizeImageUrl(item.image_url, 1200),
    type: "article",
    structuredData: articleStructuredData(item, path),
  });
  return htmlResponse(injectHead(shell, head), 200, CACHE);
}

export const HEAD = GET;
