import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Quote, UserRound } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { ProfileMoreLinks } from "@/components/ProfileNav";
import { SubpageLayout } from "@/components/SubpageLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { buildDriveSrcSet, optimizeImageUrl } from "@/lib/images";
import { currentPrincipal, principalQuery } from "@/lib/profile";

/** Loading placeholder in the page's shape: a portrait on the left, lines of text beside it. */
function PrincipalSkeleton() {
  return (
    <div className="mt-10 grid gap-10 md:grid-cols-[260px_1fr] md:items-start" data-testid="principal-loading">
      <div><Skeleton className="mx-auto aspect-[4/5] w-full max-w-[260px] rounded-[2rem]" /><Skeleton className="mx-auto mt-8 h-5 w-40 md:mx-0" /></div>
      <div className="space-y-3">{[100, 92, 96, 70, 100, 88, 60].map((width, index) => <Skeleton key={index} className="h-4" style={{ width: `${width}%` }} />)}</div>
    </div>
  );
}

// /sambutan-kepala-sekolah — the principal's welcome, kept in the CMS so a new principal only needs a new name, photo and letter.
export default function PrincipalWelcome() {
  const principalContent = useQuery(principalQuery);
  const principal = currentPrincipal(principalContent.data);
  const photo = optimizeImageUrl(principal?.image_url, 700);
  const role = principal?.badge || "Kepala Sekolah";

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Sambutan Kepala Sekolah — SMK Teratai Putih Global 2 Bekasi";
    return () => { document.title = previousTitle; };
  }, []);

  return (
    <SubpageLayout backTo="/" backLabel="Beranda" data-testid="principal-page">
      <p className="section-kicker">Profil · Sambutan</p>
      <h1 className="section-heading mt-3">Sambutan Kepala <span className="text-emerald-600">Sekolah.</span></h1>

      {principalContent.isPending ? <PrincipalSkeleton /> : !principal ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400" data-testid="principal-empty">
          {principalContent.isError ? "Sambutan belum bisa dimuat. Silakan muat ulang halaman beberapa saat lagi." : "Sambutan kepala sekolah belum tersedia."}
        </div>
      ) : (
        <div className="mt-10 grid gap-10 md:grid-cols-[260px_1fr] md:items-start">
          <Reveal className="md:sticky md:top-28" data-testid="principal-profile">
            <div className="relative mx-auto max-w-[260px]">
              <div className="aspect-[4/5] overflow-hidden rounded-[2rem] bg-slate-100 shadow-[0_20px_50px_-24px_rgba(15,76,129,.45)]">
                {photo
                  ? <img src={photo} srcSet={buildDriveSrcSet(principal.image_url, [400, 700])} sizes="260px" alt={`Foto ${principal.title}`} decoding="async" className="h-full w-full object-cover" data-testid="principal-photo" />
                  : <span className="flex h-full items-center justify-center bg-gradient-to-br from-[#0f4c81] to-[#092c4c] text-white/25"><UserRound size={80} /></span>}
              </div>
              <span className="absolute -bottom-4 -right-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-[#092c4c] shadow-lg" aria-hidden="true"><Quote size={22} fill="currentColor" /></span>
            </div>
            <p className="mt-8 text-center font-heading text-lg font-extrabold leading-snug text-[#0a3358] md:text-left" data-testid="principal-name">{principal.title}</p>
            <p className="mt-1 text-center text-xs font-bold text-emerald-600 md:text-left" data-testid="principal-role">{role}</p>
          </Reveal>

          <Reveal delay={120} data-testid="principal-message">
            {/* Blank lines split paragraphs; single line breaks (a greeting, a closing) stay as typed. */}
            <div className="space-y-5 text-base leading-relaxed text-slate-600">
              {principal.description.trim().split(/\n\s*\n/).map((paragraph, index) => <p key={index} className="whitespace-pre-line">{paragraph.trim()}</p>)}
            </div>
            <div className="mt-8 border-t border-slate-200 pt-6">
              <p className="font-heading text-base font-extrabold text-[#0a3358]">{principal.title}</p>
              <p className="mt-0.5 text-xs font-bold text-slate-500">{role}</p>
            </div>
          </Reveal>
        </div>
      )}

      <ProfileMoreLinks current="/sambutan-kepala-sekolah" />
    </SubpageLayout>
  );
}
