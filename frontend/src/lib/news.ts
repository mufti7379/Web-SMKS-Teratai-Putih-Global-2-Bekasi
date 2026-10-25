import { queryOptions } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { CMSItem } from "@/lib/cms";

// One query for every page that shows news — moving between the home page, the news
// index and an article reuses a single cached fetch instead of refetching each time.
export const newsQuery = queryOptions({ queryKey: ["public-content", "news"], queryFn: () => apiGet<CMSItem[]>("/content/news"), retry: false });

export function sortNewsNewestFirst(items: CMSItem[] | undefined) {
  return [...(items ?? [])].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export function formatNewsDate(date: string | null) {
  return date ? new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "Berita";
}

// Shared with the Vercel functions that build the sitemap and article pages (see that file).
export { findNewsByPath, newsPath, newsSlug } from "../../../api/_lib/newsPath";
