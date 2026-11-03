// A news article's body as typed into the CMS: plain paragraphs, plus tables written as Markdown
// rows — "| Nama | Kelas |", a "| --- | --- |" line under the header, then one line per row. The
// admin's editor writes those rows itself when a table is pasted in from a spreadsheet. Only
// tables are read this way: everything else stays exactly as typed, so a *, # or _ in older
// articles still shows as itself. Shared by the article page (frontend/src/lib/news.ts re-exports
// it) and the functions' crawler fallback. Deliberately dependency-free, like newsPath.ts.

export type BodyBlock = { kind: "text"; text: string } | { kind: "table"; header: string[]; rows: string[][] };

const isRow = (line: string) => line.trimStart().startsWith("|");

/** "| a | b \| c |" → ["a", "b | c"]. (No regex lookbehind: older iOS Safari can't parse it.) */
function rowCells(line: string) {
  const body = line.trim().slice(1);
  const cells = [""];
  for (let i = 0; i < body.length; i++) {
    if (body[i] === "\\" && body[i + 1] === "|") { cells[cells.length - 1] += "|"; i++; }
    else if (body[i] === "|") cells.push("");
    else cells[cells.length - 1] += body[i];
  }
  // The closing "|" leaves an empty cell behind it.
  if (body.endsWith("|") && !body.endsWith("\\|")) cells.pop();
  return cells.map((cell) => cell.trim());
}

const isDivider = (line: string) => isRow(line) && rowCells(line).every((cell) => /^:?-+:?$/.test(cell));

const padRow = (cells: string[], width: number) => Array.from({ length: width }, (_, i) => cells[i] ?? "");

/** The body split into runs of text and the tables between them, in order. */
export function bodyBlocks(text: string): BodyBlock[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: BodyBlock[] = [];
  let paragraph: string[] = [];
  const flushText = () => {
    const joined = paragraph.join("\n").trim();
    if (joined) blocks.push({ kind: "text", text: joined });
    paragraph = [];
  };

  let i = 0;
  while (i < lines.length) {
    if (isRow(lines[i]) && isDivider(lines[i + 1] ?? "")) {
      flushText();
      const header = rowCells(lines[i]);
      const rows: string[][] = [];
      for (i += 2; i < lines.length && isRow(lines[i]); i++) rows.push(rowCells(lines[i]));
      // A row with more cells than the header widens the table rather than losing them.
      const width = Math.max(header.length, ...rows.map((row) => row.length));
      blocks.push({ kind: "table", header: padRow(header, width), rows: rows.map((row) => padRow(row, width)) });
    } else {
      paragraph.push(lines[i]);
      i++;
    }
  }
  flushText();
  return blocks;
}

/** The body's text with its tables left out — for excerpts, which can't show a table. */
export function bodyText(text: string) {
  return bodyBlocks(text).flatMap((block) => (block.kind === "text" ? [block.text] : [])).join("\n\n");
}

/** Rows of cells (the first one the header) as the Markdown table bodyBlocks reads back. */
export function markdownTable(rows: string[][]) {
  const width = Math.max(...rows.map((row) => row.length));
  const line = (cells: string[]) => `| ${padRow(cells, width).map((cell) => cell.replace(/\s+/g, " ").trim().replace(/\|/g, "\\|")).join(" | ")} |`;
  const [header, ...body] = rows;
  return [line(header), line(Array<string>(width).fill("---")), ...body.map(line)].join("\n");
}
