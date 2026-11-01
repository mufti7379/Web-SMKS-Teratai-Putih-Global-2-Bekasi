import { useEffect } from "react";
import { Compass } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { ProfileMoreLinks } from "@/components/ProfileNav";
import { SubpageLayout } from "@/components/SubpageLayout";
import { foundationMissions, foundationVision } from "@/lib/profile";

// /visi-misi — the vision and mission of the foundation the school belongs to.
export default function VisionMission() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Visi & Misi — SMK Teratai Putih Global 2 Bekasi";
    return () => { document.title = previousTitle; };
  }, []);

  return (
    <SubpageLayout backTo="/" backLabel="Beranda" data-testid="vision-mission-page">
      <p className="section-kicker">Profil · Yayasan Teratai Putih Global</p>
      <h1 className="section-heading mt-3">Visi &amp; <span className="text-emerald-600">Misi.</span></h1>
      <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600">SMK Teratai Putih Global 2 Bekasi bernaung di bawah Yayasan Teratai Putih Global. Visi dan misi yayasan inilah yang menjadi arah seluruh kegiatan belajar di sekolah.</p>

      <Reveal className="relative mt-10 overflow-hidden rounded-[2rem] bg-[#0a3358] p-8 text-white sm:p-12" data-testid="vision-card">
        <Compass size={150} strokeWidth={1} className="absolute -right-8 -top-8 text-white/5" aria-hidden="true" />
        <p className="relative text-[10px] font-extrabold uppercase tracking-[.2em] text-amber-300">Visi</p>
        <p className="relative mt-4 max-w-2xl font-heading text-2xl font-bold leading-snug sm:text-3xl">“{foundationVision}”</p>
      </Reveal>

      <section className="mt-12" aria-labelledby="mission-heading" data-testid="mission-list">
        <h2 id="mission-heading" className="text-[10px] font-extrabold uppercase tracking-[.2em] text-emerald-600">Misi</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2">
          {foundationMissions.map((mission, index) => (
            <li key={mission}>
              <Reveal delay={index * 80} className="flex h-full gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80" data-testid={`mission-item-${index + 1}`}>
                <span className="font-heading text-3xl font-extrabold tabular-nums text-emerald-600/30" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <p className="text-sm font-semibold leading-relaxed text-slate-700">{mission}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      <ProfileMoreLinks current="/visi-misi" />
    </SubpageLayout>
  );
}
