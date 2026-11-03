import { markdownTable } from "@/lib/news";

// One table and nothing else around it (Excel, Google Sheets, a table copied out of Word or a
// web page). Sheets puts its <style> inside the body, so styles don't count as surrounding text.
function htmlTableRows(html: string) {
  if (!/<table/i.test(html)) return null;
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("style, script, title").forEach((element) => element.remove());
  const tables = doc.querySelectorAll("table");
  if (tables.length !== 1) return null;
  const rows = Array.from(tables[0].rows, (row) => Array.from(row.cells, (cell) => cell.textContent ?? ""));
  tables[0].remove();
  return doc.body.textContent?.trim() ? null : rows;
}

// Spreadsheet cells as plain text: one line per row, a tab between cells.
function tabSeparatedRows(text: string) {
  const lines = text.replace(/\r\n?/g, "\n").replace(/\n+$/, "").split("\n");
  return lines.every((line) => line.includes("\t")) ? lines.map((line) => line.split("\t")) : null;
}

/**
 * A table on the clipboard as Markdown rows for an article body — or null when it holds anything
 * else (ordinary text, a single cell or column, a table inside other text), which then pastes as usual.
 */
export function tableFromClipboard(data: DataTransfer) {
  const rows = (htmlTableRows(data.getData("text/html")) ?? tabSeparatedRows(data.getData("text/plain")))?.filter((row) => row.some((cell) => cell.trim()));
  if (!rows || rows.length < 2 || Math.max(...rows.map((row) => row.length)) < 2) return null;
  return markdownTable(rows);
}
