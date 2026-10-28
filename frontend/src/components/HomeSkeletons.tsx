import { Skeleton } from "@/components/ui/skeleton";

// Loading placeholders for the landing page sections, each shaped like the content it
// stands in for so nothing jumps around when the CMS data arrives.

const range = (length: number) => Array.from({ length }, (_, index) => index);

export function MajorsSkeleton() {
  return (
    <div className="mt-12 grid gap-8 lg:grid-cols-[260px_1fr]" data-testid="majors-loading">
      <div className="flex gap-2 overflow-hidden pb-2 lg:block lg:space-y-2">
        {range(5).map((index) => <Skeleton key={index} className="h-11 w-[78px] shrink-0 lg:h-[54px] lg:w-full" />)}
      </div>
      <div className="grid min-h-[395px] overflow-hidden rounded-[1.75rem] bg-[#092c4c] lg:grid-cols-[.9fr_1.1fr]">
        <Skeleton className="min-h-[250px] rounded-none bg-white/10 lg:min-h-0" />
        <div className="flex flex-col justify-center p-7 sm:p-10">
          <Skeleton className="h-3 w-32 bg-white/10" />
          <Skeleton className="mt-5 h-8 w-3/4 bg-white/10" />
          <Skeleton className="mt-4 h-3 w-full bg-white/10" />
          <Skeleton className="mt-2 h-3 w-2/3 bg-white/10" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {range(2).map((column) => <div key={column} className="space-y-3"><Skeleton className="h-2.5 w-24 bg-white/10" />{range(4).map((index) => <Skeleton key={index} className="h-2.5 w-4/5 bg-white/10" />)}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mirrors the facility grid: a wide first card, then regular ones. */
export function FacilitySkeletons() {
  return range(6).map((index) => <Skeleton key={index} className={`rounded-2xl ${index === 0 ? "h-64 lg:col-span-2" : "h-52"}`} />);
}

/** Shaped like NewsCard: photo, date, two-line title, excerpt, full-width button. */
export function NewsCardSkeletons({ count = 3 }: { count?: number }) {
  return range(count).map((index) => (
    <div key={index} className="rounded-2xl bg-white p-3 ring-1 ring-slate-200/70" aria-hidden="true">
      <Skeleton className="aspect-[16/10]" />
      <div className="px-2 pb-1 pt-4">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="mt-3 h-5 w-11/12" />
        <Skeleton className="mt-2 h-5 w-3/5" />
        <Skeleton className="mt-4 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-4/5" />
        <Skeleton className="mt-6 h-11 w-full" />
      </div>
    </div>
  ));
}

export function PartnerSkeletons() {
  return range(5).map((index) => (
    <div key={index} className="flex flex-col items-center rounded-2xl border border-white/70 bg-white/50 p-5 backdrop-blur-xl" aria-hidden="true">
      <Skeleton className="h-14 w-full sm:h-16" />
      <Skeleton className="mt-3 h-2.5 w-2/3" />
    </div>
  ));
}

export function BannerSkeleton() {
  return (
    <div className="grid overflow-hidden rounded-[1.75rem] bg-[#092c4c] lg:grid-cols-2" data-testid="spmb-banner-loading">
      <Skeleton className="min-h-[260px] rounded-none bg-white/10" />
      <div className="flex flex-col justify-center p-7 sm:p-10">
        <Skeleton className="h-3 w-40 bg-white/10" />
        <Skeleton className="mt-6 h-8 w-4/5 bg-white/10" />
        <Skeleton className="mt-3 h-3 w-full bg-white/10" />
        <div className="mt-7 flex flex-wrap gap-3"><Skeleton className="h-12 w-40 rounded-full bg-white/10" /><Skeleton className="h-12 w-32 rounded-full bg-white/10" /></div>
      </div>
    </div>
  );
}
