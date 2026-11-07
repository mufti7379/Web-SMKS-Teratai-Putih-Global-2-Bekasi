import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { StaggerRise } from "@/components/motion/Reveal";
import { SubpageLayout } from "@/components/SubpageLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/lib/api";
import type { CMSItem } from "@/lib/cms";

const gridClass = "mt-10 grid gap-4 sm:grid-cols-2";

// /unduhan — the school's files from the CMS, newest first. Each opens its link in a new tab; a
// Drive file lands on Drive's own page, which has the download button.
export default function Downloads() {
  const files = useQuery({ queryKey: ["public-content", "download"], queryFn: () => apiGet<CMSItem[]>("/content/download"), retry: false });
  const items = [...(files.data ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Unduhan — SMK Teratai Putih Global 2 Bekasi";
    return () => { document.title = previousTitle; };
  }, []);

  return (
    <SubpageLayout data-testid="downloads-page">
      <p className="section-kicker">Layanan · Unduhan</p>
      <h1 className="section-heading mt-3">Pusat <span className="text-emerald-600">Unduhan.</span></h1>
      <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600">Berkas dan dokumen SMK Teratai Putih Global 2 Bekasi yang bisa diunduh oleh siswa, orang tua, dan masyarakat.</p>

      {files.isPending ? (
        <div className={gridClass} data-testid="downloads-loading">
          {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-24 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400" data-testid="downloads-empty">
          {files.isError ? "Daftar unduhan belum bisa dimuat. Silakan muat ulang halaman beberapa saat lagi." : "Belum ada berkas yang bisa diunduh."}
        </div>
      ) : (
        <div className={gridClass} data-testid="downloads-list">
          {items.map((item, index) => (
            <StaggerRise key={item.id} className="h-full">
              <a href={item.link ?? undefined} target="_blank" rel="noreferrer" className="group flex h-full items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80 transition-all duration-300 hover:-translate-y-0.5 hover:ring-[#0f4c81]/30" data-testid={`download-item-${index + 1}`}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600" aria-hidden="true"><FileText size={20} /></span>
                <span className="min-w-0 flex-1">
                  <strong className="block break-words text-sm font-extrabold text-[#0a3358]">{item.title}</strong>
                  {item.description && <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{item.description}</span>}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-extrabold text-[#0f4c81]"><Download size={15} className="transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden="true" /> Unduh</span>
              </a>
            </StaggerRise>
          ))}
        </div>
      )}
    </SubpageLayout>
  );
}
