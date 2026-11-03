import { bodyBlocks } from "@/lib/news";
import { cn } from "@/lib/utils";

type ArticleBodyProps = { text: string; className?: string; "data-testid"?: string };

/**
 * A news article's body: its paragraphs as typed (line breaks kept), and any Markdown tables in
 * it as real tables. A table wider than the screen scrolls sideways inside its own frame;
 * headers never wrap, so a many-column table scrolls instead of squeezing into slivers.
 */
export function ArticleBody({ text, className, "data-testid": testId }: ArticleBodyProps) {
  return (
    <div className={cn("space-y-6", className)} data-testid={testId}>
      {bodyBlocks(text).map((block, index) => block.kind === "text"
        ? <p key={index} className="cms-text whitespace-pre-line">{block.text}</p>
        : (
          <div key={index} className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200" data-testid="article-table">
            <table className="min-w-full text-left text-sm tabular-nums">
              <thead className="bg-slate-50 text-[#0a3358]"><tr>{block.header.map((cell, column) => <th key={column} scope="col" className="whitespace-nowrap px-4 py-3 font-extrabold">{cell}</th>)}</tr></thead>
              <tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex} className="border-t border-slate-100">{row.map((cell, column) => <td key={column} className="px-4 py-3 align-top">{cell}</td>)}</tr>)}</tbody>
            </table>
          </div>
        ))}
    </div>
  );
}
