import { useRef, useState } from "react";

/** Entries per page in the CMS's lists. */
export const ADMIN_PAGE_SIZE = 10;

/**
 * One page of a CMS list, ten at a time. The page is clamped to the list (deleting the last
 * entry of the last page steps back a page), and turning a page brings the list's top back into
 * view when the pager below it had been scrolled to. Give the component a key per list (e.g.
 * the section) so moving to another list starts again at page 1.
 */
export function usePagedList<T>(items: readonly T[]) {
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);
  const totalPages = Math.max(1, Math.ceil(items.length / ADMIN_PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const goTo = (next: number) => {
    setPage(next);
    // html's 76px scroll-padding-top plus the list's scroll-mt-1 clear the sticky header.
    if (listRef.current && listRef.current.getBoundingClientRect().top < 80) listRef.current.scrollIntoView({ block: "start" });
  };
  return { page: current, pageEntries: items.slice((current - 1) * ADMIN_PAGE_SIZE, current * ADMIN_PAGE_SIZE), total: items.length, goTo, listRef };
}

// 1 … 4 5 6 … 12 — first, last and the current page's neighbours. A gap of exactly one
// page shows that page's number instead of an ellipsis standing in for a single item.
export function pageItems(current: number, total: number) {
  const pages = [...new Set([1, current - 1, current, current + 1, total])].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  pages.forEach((page, index) => {
    const previous = pages[index - 1];
    if (previous !== undefined && page - previous === 2) items.push(page - 1);
    else if (previous !== undefined && page - previous > 2) items.push("gap");
    items.push(page);
  });
  return items;
}
