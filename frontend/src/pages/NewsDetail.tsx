import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowLeft, ArrowUpRight, Link2, Newspaper } from "lucide-react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { toast } from "sonner";
import { NewsCard } from "@/components/NewsCard";
import { SubpageLayout } from "@/components/SubpageLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { optimizeImageUrl } from "@/lib/images";
import { findNewsByPath, formatNewsDate, newsPath, newsQuery, sortNewsNewestFirst } from "@/lib/news";

// Full-page, shareable view of a single news item at /berita/<bulan>/<tahun>/<tags-singkat>
// (also reached through old /berita/<id> links, which redirect to that readable URL).
export default function NewsDetail() {
  const { id, bulan, tahun, slug } = useParams();
  const { pathname } = useLocation();
  const newsContent = useQuery(newsQuery);
  const allNews = sortNewsNewestFirst(newsContent.data);
  const news = id
    ? allNews.find((item) => item.id === id) ?? null
    : bulan && tahun && slug ? findNewsByPath(allNews, bulan, tahun, slug) : null;
  const canonicalPath = news ? newsPath(news, allNews) : null;
  const otherNews = allNews.filter((item) => item.id !== news?.id).slice(0, 3);

  useEffect(() => {
    if (!news) return;
    const previousTitle = document.title;
    document.title = `${news.title} — SMK Teratai Putih Global 2 Bekasi`;
    return () => { document.title = previousTitle; };
  }, [news]);

  const shareNews = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: news?.title, url }); } catch { /* dibatalkan pengguna */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Tautan berita disalin.");
    } catch {
      toast.error("Tautan belum bisa disalin.");
    }
  };

  // The photo sits above the article column, in a full-width strip, so its frame can follow
  // the image itself: a small image stays at its natural size, centred; a large/wide one
  // grows up to the full screen width. Never cropped, never upscaled — if it would be too
  // tall it shrinks proportionally to 80% of the screen height. No srcSet: Drive "/d/" links
  // ignore the =w size, so width descriptors would misreport the file and shrink it.
  let banner = null;
  if (newsContent.isPending) {
    banner = <div className="px-5 pt-10 lg:px-8 lg:pt-16"><Skeleton className="mx-auto aspect-video w-full max-w-4xl rounded-[1.75rem]" data-testid="news-detail-banner-loading" /></div>;
  } else if (news?.image_url) {
    banner = (
      <div className="px-5 pt-10 lg:px-8 lg:pt-16" data-testid="news-detail-banner">
        <img src={optimizeImageUrl(news.image_url, 1920) ?? news.image_url} alt={news.title} fetchPriority="high" className="mx-auto block h-auto max-h-[80vh] w-auto max-w-full rounded-[1.75rem] bg-slate-200 shadow-xl shadow-slate-900/10" data-testid="news-detail-image" />
      </div>
    );
  }

  // Old /berita/<id> links and non-canonical spellings (e.g. "/berita/8/2026/…" or capitals)
  // land on the readable URL, without leaving the old one in the back-button history.
  if (canonicalPath && canonicalPath !== pathname) return <Navigate to={canonicalPath} replace />;

  return (
    <SubpageLayout backTo="/berita" backLabel="Semua berita" banner={banner} data-testid="news-detail-page">
      <Toaster position="top-right" richColors />

      {newsContent.isPending ? (
        <div data-testid="news-detail-loading">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-4 h-8 w-3/4" />
          <div className="mt-6 space-y-3"><Skeleton className="h-3" /><Skeleton className="h-3" /><Skeleton className="h-3 w-2/3" /></div>
        </div>
      ) : !news ? (
        <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center" data-testid="news-detail-not-found">
          <Newspaper size={28} className="mx-auto text-slate-300" />
          <h1 className="mt-4 font-heading text-xl font-extrabold text-[#0a3358]">{newsContent.isError ? "Berita belum bisa dimuat." : "Berita tidak ditemukan."}</h1>
          <p className="mt-2 text-sm text-slate-500">{newsContent.isError ? "Silakan muat ulang halaman beberapa saat lagi." : "Berita ini mungkin sudah dihapus atau tidak lagi ditampilkan."}</p>
          <Link to="/berita" className="group mt-6 inline-flex items-center gap-2 text-xs font-extrabold text-[#0f4c81] hover:text-emerald-600"><ArrowLeft size={14} className="transition-transform duration-300 group-hover:-translate-x-1" /> Lihat semua berita</Link>
        </div>
      ) : (
        <motion.article key={news.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 26 }} data-testid="news-detail-article">
          <div className="flex flex-wrap items-center gap-2 text-[#0f4c81]"><Newspaper size={16} /><span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400" data-testid="news-detail-date">{formatNewsDate(news.date)}</span>{news.badge && <span className="ml-1 rounded-full bg-[#0f4c81]/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#0f4c81]" data-testid="news-detail-category">{news.badge}</span>}</div>
          <h1 className="mt-3 font-heading text-3xl font-extrabold leading-tight tracking-tight text-[#0a3358] sm:text-4xl" data-testid="news-detail-title">{news.title}</h1>
          <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-slate-600" data-testid="news-detail-description">{news.description}</p>
          <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6">
            <button type="button" onClick={shareNews} className="group inline-flex items-center gap-2 rounded-full bg-[#0f4c81] px-5 py-2.5 text-xs font-extrabold text-white transition-all hover:-translate-y-0.5 hover:bg-[#0a3358]" data-testid="news-detail-share-button"><Link2 size={15} /> Bagikan berita</button>
            {news.link && <a href={news.link} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-extrabold text-[#0f4c81] transition-all hover:-translate-y-0.5 hover:text-emerald-600" data-testid="news-detail-source-link">Sumber lengkap <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5" /></a>}
          </div>
        </motion.article>
      )}

      {otherNews.length > 0 && (
        <section className="mt-16 border-t border-slate-200 pt-10" data-testid="news-detail-others">
          <div className="flex items-end justify-between gap-4">
            <p className="section-kicker">Berita lainnya</p>
            <Link to="/berita" className="group inline-flex items-center gap-1 text-xs font-extrabold text-[#0f4c81] hover:text-emerald-600" data-testid="news-detail-all-link">Lihat semua <ArrowUpRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" /></Link>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {otherNews.map((item, index) => <NewsCard key={item.id} item={item} to={newsPath(item, allNews)} headingAs="h2" data-testid={`news-detail-other-${index + 1}`} />)}
          </div>
        </section>
      )}
    </SubpageLayout>
  );
}
