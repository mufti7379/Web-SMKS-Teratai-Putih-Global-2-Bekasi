// Readable news URLs — the single source for both the React app (frontend/src/lib/news.ts
// re-exports it) and the Vercel functions next to it (sitemap, article pages), so both always
// produce identical paths. Deliberately dependency-free. It lives here rather than under
// frontend/ because Vercel compiles function code to CommonJS, which would break inside
// frontend/'s "type": "module" package.

/** The fields a URL is built from — CMSItem satisfies it. */
export type NewsRef = { id: string; title: string; date: string | null; created_at: string };

// Connective words that add length but no meaning to a URL.
const slugStopwords = new Set(["dan", "di", "ke", "dari", "yang", "untuk", "dengan", "pada", "dalam", "oleh", "atau", "serta", "bersama", "para", "the", "of", "and"]);

/** Short keyword slug from a title: "Ekstrakulikuler Coretax Bersama STIE Tri Bhakti" → "ekstrakulikuler-coretax-stie-tri-bhakti". */
export function newsSlug(title: string) {
  // NFKD splits accented letters into letter + combining mark; \p{M} then drops the marks.
  const words = title.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const keywords = words.filter((word) => !slugStopwords.has(word));
  return (keywords.length ? keywords : words).slice(0, 6).join("-") || "berita";
}

// Month/year straight from the "YYYY-MM-DD…" string (no Date parsing, so no timezone
// shifts); undated news falls back to when it was created.
function newsMonthYear(item: NewsRef) {
  const source = item.date ?? item.created_at;
  return { month: source.slice(5, 7), year: source.slice(0, 4) };
}

/**
 * Readable article URL: /berita/<bulan>/<tahun>/<tags-singkat>, e.g. /berita/10/2026/ekstrakulikuler-coretax-stie-tri-bhakti.
 * Derived from the title and date, so editing either changes the URL. Two articles in the same
 * month with the same slug both get a short id suffix to stay distinct.
 */
export function newsPath(item: NewsRef, allNews: NewsRef[]) {
  const { month, year } = newsMonthYear(item);
  const slug = newsSlug(item.title);
  const clashes = allNews.some((other) => {
    if (other.id === item.id || newsSlug(other.title) !== slug) return false;
    const otherDate = newsMonthYear(other);
    return otherDate.month === month && otherDate.year === year;
  });
  return `/berita/${month}/${year}/${clashes ? `${slug}-${item.id.slice(0, 6)}` : slug}`;
}

export function findNewsByPath<T extends NewsRef>(allNews: T[], month: string, year: string, slug: string) {
  const path = `/berita/${month.padStart(2, "0")}/${year}/${slug.toLowerCase()}`;
  return allNews.find((item) => newsPath(item, allNews) === path) ?? null;
}
