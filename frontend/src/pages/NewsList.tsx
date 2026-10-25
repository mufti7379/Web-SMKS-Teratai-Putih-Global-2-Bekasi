import { useEffect } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { NewsCardSkeletons } from "@/components/HomeSkeletons";
import { NewsCard } from "@/components/NewsCard";
import { SubpageLayout } from "@/components/SubpageLayout";
import { newsPath, newsQuery, sortNewsNewestFirst } from "@/lib/news";
import { pageItems } from "@/lib/pagination";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 9;

const pageHref = (page: number) => (page === 1 ? "/berita" : `/berita?halaman=${page}`);

const pageButtonClass = "inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-bold transition-all";

function PageLink({ page, disabled, label, children }: { page: number; disabled: boolean; label: string; children: ReactNode }) {
  if (disabled) return <span aria-disabled="true" aria-label={label} className={cn(pageButtonClass, "border border-slate-200 bg-white text-slate-300")}>{children}</span>;
  return <Link to={pageHref(page)} aria-label={label} className={cn(pageButtonClass, "border border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-[#0f4c81]/30 hover:text-[#0f4c81]")}>{children}</Link>;
}

// Every published news item, newest first, paged via ?halaman= so each page has its own link.
export default function NewsList() {
  const [searchParams] = useSearchParams();
  const newsContent = useQuery(newsQuery);
  const allNews = sortNewsNewestFirst(newsContent.data);
  const totalPages = Math.max(1, Math.ceil(allNews.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Math.floor(Number(searchParams.get("halaman"))) || 1), totalPages);
  const firstIndex = (page - 1) * PAGE_SIZE;
  const pageNews = allNews.slice(firstIndex, firstIndex + PAGE_SIZE);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `Berita Sekolah${page > 1 ? ` · Halaman ${page}` : ""} — SMK Teratai Putih Global 2 Bekasi`;
    return () => { document.title = previousTitle; };
  }, [page]);

  return (
    <SubpageLayout backTo="/#berita-terkini" backLabel="Beranda" wide data-testid="news-list-page">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="section-kicker">Berita sekolah</p>
          <h1 className="section-heading mt-3">Kabar terbaru dari <span className="text-emerald-600">kami.</span></h1>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-slate-500">Ikuti pengumuman, prestasi, dan kegiatan terkini SMK Teratai Putih Global 2 Bekasi.</p>
      </div>

      {newsContent.isPending ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="news-list-loading">
          <NewsCardSkeletons count={6} />
        </div>
      ) : pageNews.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400" data-testid="news-list-empty">
          {newsContent.isError ? "Berita belum bisa dimuat. Silakan muat ulang halaman beberapa saat lagi." : "Belum ada berita."}
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="news-list-grid">
          {pageNews.map((item, index) => <NewsCard key={item.id} item={item} to={newsPath(item, allNews)} headingAs="h2" data-testid={`news-list-item-${index + 1}`} />)}
        </div>
      )}

      {pageNews.length > 0 && (
        <nav aria-label="Halaman berita" className="mt-12 flex flex-col items-center gap-4" data-testid="news-pagination">
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <PageLink page={page - 1} disabled={page === 1} label="Halaman sebelumnya"><ChevronLeft size={16} /></PageLink>
              {/* Phones get "Halaman x dari y"; the full number row only fits from sm up. */}
              <span className="px-3 text-sm font-bold text-slate-600 sm:hidden">Halaman {page} dari {totalPages}</span>
              {pageItems(page, totalPages).map((item, index) => item === "gap"
                ? <span key={`gap-${index}`} className="hidden px-1 text-sm font-bold text-slate-400 sm:inline">…</span>
                : item === page
                  ? <span key={item} aria-current="page" className={cn(pageButtonClass, "hidden bg-[#0f4c81] text-white shadow-lg shadow-blue-900/20 sm:inline-flex")}>{item}</span>
                  : <Link key={item} to={pageHref(item)} aria-label={`Halaman ${item}`} className={cn(pageButtonClass, "hidden border border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-[#0f4c81]/30 hover:text-[#0f4c81] sm:inline-flex")} data-testid={`news-page-${item}`}>{item}</Link>)}
              <PageLink page={page + 1} disabled={page === totalPages} label="Halaman berikutnya"><ChevronRight size={16} /></PageLink>
            </div>
          )}
          <p className="text-xs text-slate-500" data-testid="news-pagination-summary">Menampilkan {firstIndex + 1}–{firstIndex + pageNews.length} dari {allNews.length} berita</p>
        </nav>
      )}
    </SubpageLayout>
  );
}
