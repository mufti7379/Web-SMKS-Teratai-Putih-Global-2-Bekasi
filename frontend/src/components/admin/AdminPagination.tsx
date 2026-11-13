import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ADMIN_PAGE_SIZE, pageItems, usePagedList } from "@/lib/pagination";
import { cn } from "@/lib/utils";

const pageButtonClass = "inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2.5 text-xs font-bold transition-colors";
const idlePageButtonClass = cn(pageButtonClass, "border border-slate-200 bg-white text-slate-600 hover:border-[#0f4c81]/30 hover:text-[#0f4c81] disabled:pointer-events-none disabled:text-slate-300");

type AdminPaginationProps = {
  page: number;
  total: number;
  onChange: (page: number) => void;
  /** What's being counted, for "Menampilkan 1–10 dari 23 …" (e.g. "konten", "aktivitas"). */
  noun: string;
  /** Prefix for the test ids: <prefix>-pagination, <prefix>-page-prev, <prefix>-page-3, … */
  testId: string;
};

/**
 * The pager under a CMS list (see usePagedList): "Menampilkan x–y dari n" and, once there's more
 * than one page, previous / numbered / next buttons. Hidden for an empty list.
 */
export function AdminPagination({ page, total, onChange, noun, testId }: AdminPaginationProps) {
  if (total === 0) return null;
  const totalPages = Math.ceil(total / ADMIN_PAGE_SIZE);
  return (
    <nav aria-label={`Halaman ${noun}`} className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row" data-testid={`${testId}-pagination`}>
      <p className="text-xs text-slate-500" data-testid={`${testId}-pagination-summary`}>Menampilkan {(page - 1) * ADMIN_PAGE_SIZE + 1}–{Math.min(page * ADMIN_PAGE_SIZE, total)} dari {total} {noun}</p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Halaman sebelumnya" className={idlePageButtonClass} data-testid={`${testId}-page-prev`}><ChevronLeft size={15} /></button>
          {/* Phones get "Halaman x dari y"; the full number row only fits from sm up. */}
          <span className="px-2 text-xs font-bold text-slate-600 sm:hidden">Halaman {page} dari {totalPages}</span>
          {pageItems(page, totalPages).map((item, index) => item === "gap"
            ? <span key={`gap-${index}`} className="hidden px-1 text-xs font-bold text-slate-400 sm:inline">…</span>
            : item === page
              ? <span key={item} aria-current="page" className={cn(pageButtonClass, "hidden bg-[#0f4c81] text-white sm:inline-flex")}>{item}</span>
              : <button key={item} type="button" onClick={() => onChange(item)} aria-label={`Halaman ${item}`} className={cn(idlePageButtonClass, "hidden sm:inline-flex")} data-testid={`${testId}-page-${item}`}>{item}</button>)}
          <button type="button" onClick={() => onChange(page + 1)} disabled={page === totalPages} aria-label="Halaman berikutnya" className={idlePageButtonClass} data-testid={`${testId}-page-next`}><ChevronRight size={15} /></button>
        </div>
      )}
    </nav>
  );
}

type PagedListProps<T> = {
  items: readonly T[];
  /** Each entry, keyed. */
  render: (item: T) => ReactNode;
  /** The list's own classes (its grid). */
  className: string;
  listTestId?: string;
  noun: string;
  testId: string;
};

/**
 * A CMS list ten entries at a time, with the pager under it. Keyed by the caller per list, so
 * another section starts again at page 1.
 */
export function PagedList<T>({ items, render, className, listTestId, noun, testId }: PagedListProps<T>) {
  const { page, pageEntries, total, goTo, listRef } = usePagedList(items);
  return (
    <>
      <div ref={listRef} className={cn("scroll-mt-1", className)} data-testid={listTestId}>{pageEntries.map(render)}</div>
      <AdminPagination page={page} total={total} onChange={goTo} noun={noun} testId={testId} />
    </>
  );
}
