import { useEffect } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useLenisScroll } from "@/hooks/useLenisScroll";
import { cn } from "@/lib/utils";

type SubpageLayoutProps = {
  wide?: boolean;
  /** Full-bleed content between the header and the page body (e.g. an article's photo). */
  banner?: ReactNode;
  children: ReactNode;
  "data-testid"?: string;
};

/** Header + footer shell for standalone pages outside the landing page (news index, articles). */
export function SubpageLayout({ wide = false, banner, children, "data-testid": testId }: SubpageLayoutProps) {
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
      <SiteHeader />

      {banner}

      <main className={cn("mx-auto w-full flex-1 px-5 py-10 lg:px-8 lg:py-16", container)}>{children}</main>

      <SiteFooter />
    </div>
  );
}
