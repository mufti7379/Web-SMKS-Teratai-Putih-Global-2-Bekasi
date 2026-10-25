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
