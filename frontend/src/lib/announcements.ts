import type { CMSItem } from "@/lib/cms";

// Announcements are the CMS "banner" items, all shown in the home page's Pengumuman section.
// An SPMB announcement also gets the registration buttons (WhatsApp + angket). The admin picks
// that per announcement, stored in `code`; ones saved before that choice existed have no code
// and are recognised by their label and title instead.
export type AnnouncementKind = "spmb" | "umum";

export function announcementKind(item: Pick<CMSItem, "code" | "badge" | "title">): AnnouncementKind {
  if (item.code === "spmb" || item.code === "umum") return item.code;
  return /\b(spmb|ppdb)\b|pendaftaran/i.test(`${item.badge ?? ""} ${item.title}`) ? "spmb" : "umum";
}

/**
 * A Heyzine flipbook link (heyzine.com/flip-book/… or a custom <name>.heyzine.com one) — read
 * right on the page, embedded in the announcement, instead of behind a button. Null otherwise.
 */
export function flipbookUrl(link: string | null) {
  const url = link?.trim();
  return url && /^https?:\/\/([\w-]+\.)?heyzine\.com\/flip-book\//i.test(url) ? url.replace(/^http:/i, "https:") : null;
}

/** Newest first, so a freshly added announcement is the one visitors see. */
export const sortAnnouncements = (items: CMSItem[] | undefined) => [...(items ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
