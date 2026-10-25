import { useEffect } from "react";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { SiteFooter } from "@/components/SiteFooter";
import { useLenisScroll } from "@/hooks/useLenisScroll";
import { cn } from "@/lib/utils";

type SubpageLayoutProps = {
  /** Where the header's back button goes, and what it says. */
  backTo: string;
  backLabel: string;
  wide?: boolean;
  /** Full-bleed content between the header and the page body (e.g. an article's photo). */
  banner?: ReactNode;
  children: ReactNode;
  "data-testid"?: string;
};

/** Header + footer shell for standalone pages outside the landing page (news index, articles). */
export function SubpageLayout({ backTo, backLabel, wide = false, banner, children, "data-testid": testId }: SubpageLayoutProps) {
  useLenisScroll();
  const { pathname, search } = useLocation();
  const container = wide ? "max-w-7xl" : "max-w-4xl";

  // The router keeps the previous page's scroll offset, so start every page (and every
  // ?halaman= change) at the top — instantly, overriding the global smooth scrolling.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, search]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900" data-testid={testId}>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl" data-testid="subpage-header">
        <div className={cn("mx-auto flex h-[76px] items-center justify-between gap-4 px-5 lg:px-8", container)}>
          <Link to="/" className="flex items-center gap-3" data-testid="subpage-brand-link">
            <img src="/logo-tp2.png" alt="Logo SMK Teratai Putih Global 2" className="h-11 w-11 rounded-2xl object-contain shadow-lg shadow-blue-900/15" />
            <span className="hidden sm:block"><span className="block font-heading text-[15px] font-extrabold leading-tight text-[#0a3358]">SMK TERATAI PUTIH</span><span className="mt-0.5 block text-[10px] font-bold tracking-[0.18em] text-emerald-600">GLOBAL 2 BEKASI</span></span>
          </Link>
          <Link to={backTo} className="group inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-[#0f4c81] transition-all hover:-translate-y-0.5 hover:border-[#0f4c81]/30 hover:bg-slate-50" data-testid="subpage-back-link"><ArrowLeft size={15} className="transition-transform duration-300 group-hover:-translate-x-1" /> {backLabel}</Link>
        </div>
      </header>

      {banner}

      <main className={cn("mx-auto w-full flex-1 px-5 py-10 lg:px-8 lg:py-16", container)}>{children}</main>

      <SiteFooter />
    </div>
  );
}
