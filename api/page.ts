// Serves the news and album pages as the normal app shell, but with that page's own <head>:
// title, description, canonical URL, share image and structured data. vercel.json rewrites
// those URLs here with a `route` query param:
//   list    — /berita (optional ?halaman=N)
//   article — /berita/<bulan>/<tahun>/<slug>
//   legacy  — /berita/<id>, the old id links, permanently redirected to the readable URL
//   album   — /galeri/<slug>, a gallery album such as /galeri/perpisahan-2025
// The React app still renders everything in the browser; this only changes what crawlers
// and link previews read before JavaScript runs — the <head>, plus a <noscript> copy of the
// page's text for crawlers that never run JavaScript.
import { albumDrivePictures } from "./_lib/drive";
import { albumDriveFolders, galleryMedia, galleryStill, isInAlbum, isSinglePhoto, listAlbums } from "./_lib/gallery";
import { optimizeImageUrl } from "./_lib/images";
import { findNewsByPath, newsPath } from "./_lib/newsPath";
import { LOGO_URL, SITE_NAME, SITE_URL, absoluteImageUrl, escapeHtml, excerpt, fetchAppShell, fetchPublishedGallery, fetchPublishedNews, htmlResponse, injectFallback, injectHead, newsPublishedAt, paragraphsHtml, renderHead, sortNewsNewestFirst } from "./_lib/seo";
import type { PublicNews } from "./_lib/seo";

// Vercel's CDN keeps each page for 5 minutes (new or edited news shows up within that), and
// serves the stale copy while refreshing for up to a day if the backend is slow.
const CACHE = "public, s-maxage=300, stale-while-revalidate=86400";
// Don't let a backend hiccup get cached for long.
const CACHE_SHORT = "public, s-maxage=30";

// Same page size as the app's /berita list.
const NEWS_PAGE_SIZE = 9;

const redirect = (path: string) => new Response(null, { status: 308, headers: { location: path, "cache-control": CACHE } });

/** The shell with this page's <head> (when given) and its <noscript> text in place of the home page's. */
const pageResponse = (shell: string, head: string | null, fallback: string, status: number, cacheControl: string) =>
  htmlResponse(injectFallback(head ? injectHead(shell, head) : shell, fallback), status, cacheControl);

const formatNewsDate = (date: string | null) => (date ? new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }) : null);

const newsLinksHtml = (items: PublicNews[], allNews: PublicNews[]) =>
  `<ul>${items.map((item) => `<li><a href="${escapeHtml(newsPath(item, allNews))}">${escapeHtml(item.title)}</a></li>`).join("")}</ul>`;

function articleStructuredData(item: PublicNews, path: string) {
  const school = { "@type": "HighSchool", "@id": `${SITE_URL}/#school`, name: SITE_NAME, url: `${SITE_URL}/`, logo: LOGO_URL };
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsArticle",
        headline: item.title.slice(0, 110),
        description: excerpt(item.description),
        image: [absoluteImageUrl(optimizeImageUrl(item.image_url, 1200)) ?? LOGO_URL],
        datePublished: newsPublishedAt(item),
        dateModified: item.updated_at || item.created_at,
        mainEntityOfPage: `${SITE_URL}${path}`,
        ...(item.badge ? { articleSection: item.badge } : {}),
        author: school,
        publisher: school,
      },
      // Shown by Google as "Beranda › Berita › …" above the result instead of the bare URL.
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Beranda", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Berita", item: `${SITE_URL}/berita` },
          { "@type": "ListItem", position: 3, name: item.title },
        ],
      },
    ],
  };
}

// The article as the app shows it: title, date and section, byline, photo, body, then the newest other news.
function articleFallback(item: PublicNews, allNews: PublicNews[]) {
  const date = formatNewsDate(item.date);
  const image = absoluteImageUrl(optimizeImageUrl(item.image_url, 1200));
  const others = allNews.filter((other) => other.id !== item.id).slice(0, 3);
  return [
    `<article>`,
    `<h1>${escapeHtml(item.title)}</h1>`,
    date || item.badge ? `<p>${[date && `<time datetime="${escapeHtml(item.date ?? "")}">${date}</time>`, item.badge && escapeHtml(item.badge)].filter(Boolean).join(" · ")}</p>` : "",
    `<p>Oleh ${escapeHtml(SITE_NAME)}</p>`,
    image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(item.title)}" />` : "",
    paragraphsHtml(item.description),
    item.link ? `<p><a href="${escapeHtml(item.link)}" rel="noreferrer">Sumber lengkap</a></p>` : "",
    `</article>`,
    others.length ? `<h2>Berita lainnya</h2>${newsLinksHtml(others, allNews)}` : "",
    `<p><a href="/berita">Semua berita ${escapeHtml(SITE_NAME)}</a></p>`,
  ].join("");
}

async function albumPage(origin: string, shell: string, requested: string) {
  const slug = requested.toLowerCase();
  const gallery = await fetchPublishedGallery(origin);
  if (!gallery) return pageResponse(shell, null, "", 200, CACHE_SHORT);
  const album = listAlbums(gallery).find((entry) => entry.slug === slug);
  if (!album) return pageResponse(shell, renderHead({ title: `Album tidak ditemukan — ${SITE_NAME}`, description: "Album yang Anda cari tidak ada.", path: "/", noindex: true }), "", 404, CACHE);
  if (requested !== slug) return redirect(`/galeri/${slug}`);
  const drivePictures = (await albumDrivePictures(albumDriveFolders(slug, gallery))) ?? [];
  // Same order as the album page: the Drive folders' pictures, then single items filed under the album.
  const media = [
    ...drivePictures.map((src) => ({ kind: "image", src }) as const),
    ...gallery.filter((item) => isSinglePhoto(item) && isInAlbum(item, slug)).sort((a, b) => a.created_at.localeCompare(b.created_at)).map((item) => galleryMedia(item.image_url ?? "")),
  ];
  // The first photo with a still (uploaded videos have none) becomes the share preview.
  const cover = media.map((entry) => galleryStill(entry, 1200)).find(Boolean) ?? null;
  const description = media.length ? `Kumpulan ${media.length} foto ${album.name} ${SITE_NAME}.` : `Galeri foto ${album.name} ${SITE_NAME}.`;
  const head = renderHead({ title: `Galeri ${album.name} — ${SITE_NAME}`, description, path: `/galeri/${slug}`, image: cover });
  const fallback = `<h1>Galeri ${escapeHtml(album.name)}</h1><p>${escapeHtml(description)}</p><p><a href="/">Beranda ${escapeHtml(SITE_NAME)}</a> · <a href="/berita">Berita sekolah</a></p>`;
  return pageResponse(shell, head, fallback, 200, CACHE);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const shell = await fetchAppShell(url.origin);
  if (!shell) return new Response("Halaman belum bisa dimuat. Silakan coba lagi.", { status: 502, headers: { "cache-control": "no-store" } });

  if (params.get("route") === "album") return albumPage(url.origin, shell, params.get("album") ?? "");

  const fetched = await fetchPublishedNews(url.origin);
  const news = fetched && sortNewsNewestFirst(fetched);

  if (params.get("route") === "list") {
    const page = Math.max(1, Math.floor(Number(params.get("halaman"))) || 1);
    const description = `Berita, pengumuman, prestasi, dan kegiatan terbaru ${SITE_NAME}, SMK swasta terakreditasi A di Bekasi Selatan.`;
    const head = renderHead({
      title: `Berita Sekolah${page > 1 ? ` · Halaman ${page}` : ""} — ${SITE_NAME}`,
      description,
      path: page > 1 ? `/berita?halaman=${page}` : "/berita",
    });
    // This page's articles as plain links, plus the next page, so crawlers can walk the whole archive.
    const pageNews = (news ?? []).slice((page - 1) * NEWS_PAGE_SIZE, page * NEWS_PAGE_SIZE);
    const hasNext = (news ?? []).length > page * NEWS_PAGE_SIZE;
    const fallback = news
      ? `<h1>Berita Sekolah ${escapeHtml(SITE_NAME)}</h1><p>${escapeHtml(description)}</p>${newsLinksHtml(pageNews, news)}${hasNext ? `<p><a href="/berita?halaman=${page + 1}">Halaman berikutnya</a></p>` : ""}`
      : "";
    return pageResponse(shell, head, fallback, 200, news ? CACHE : CACHE_SHORT);
  }

  // Backend unreachable: hand over the plain shell and let the app show its own error state.
  if (!news) return pageResponse(shell, null, "", 200, CACHE_SHORT);

  const notFound = () => pageResponse(shell, renderHead({ title: `Berita tidak ditemukan — ${SITE_NAME}`, description: "Berita ini mungkin sudah dihapus atau tidak lagi ditampilkan.", path: "/berita", noindex: true }), "", 404, CACHE);

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
  return pageResponse(shell, head, articleFallback(item, news), 200, CACHE);
}

export const HEAD = GET;
