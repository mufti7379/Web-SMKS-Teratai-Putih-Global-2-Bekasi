import type { CMSItem } from "@/lib/cms";
import type { SiteLanguage } from "@/lib/translate";
import { compareIso } from "@/lib/utils";

type HeroLine = { id: string; en?: string | null; ja?: string | null };

// The hero's lines until the CMS has any "Teks Hero" entries (or while it can't be reached).
const defaultLines: HeroLine[] = [
  { id: "SMK Teratai Putih Global 2", en: "SMK Teratai Putih Global 2", ja: "SMK Teratai Putih Global 2" },
  { id: "Sekolah berbasis Islami dan Teknologi", en: "An Islamic and Technology-Based School", ja: "イスラムとテクノロジーを基盤とする学校" },
];

// Numbered lines first, in their order; unnumbered ones follow in the order they were added.
// Infinity - Infinity is NaN, which is falsy, so two unnumbered lines fall through to their dates.
const inOrder = (a: CMSItem, b: CMSItem) => (a.sort_order ?? Infinity) - (b.sort_order ?? Infinity) || compareIso(a.created_at, b.created_at);

/**
 * The lines the home page's hero types out, in the page's language. Translated in the CMS rather
 * than by Google, so they keep typing smoothly; a line without a translation shows in Indonesian.
 */
export function heroLines(items: CMSItem[] | undefined, language: SiteLanguage): string[] {
  const lines: HeroLine[] = items?.length ? [...items].sort(inOrder).map((item) => ({ id: item.title, en: item.title_en, ja: item.title_ja })) : defaultLines;
  return lines.map((line) => (language === "id" ? line.id : line[language] || line.id));
}
