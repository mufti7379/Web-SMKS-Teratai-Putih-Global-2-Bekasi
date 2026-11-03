import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { StaggerRise } from "@/components/motion/Reveal";
import { ProfileMoreLinks } from "@/components/ProfileNav";
import { SubpageLayout } from "@/components/SubpageLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { buildDriveSrcSet, optimizeImageUrl } from "@/lib/images";
import { currentPrincipal, groupStaff, principalQuery, staffQuery } from "@/lib/profile";

type Person = { key: string; name: string; role: string; image: string | null };

const gridClass = "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

/** Up to two initials from a name, skipping titles: "Drs. H. Ahmad Fauzi, M.Pd." → "AF". */
function initials(name: string) {
  return name.replace(/,.*$/, "").split(/\s+/).filter((word) => word && !word.endsWith(".")).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function PersonCard({ person, testId }: { person: Person; testId: string }) {
  const photo = optimizeImageUrl(person.image, 500);
  return (
    <article className="group h-full overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" data-testid={testId}>
      <div className="aspect-[4/5] overflow-hidden bg-slate-100">
        {photo
          ? <img src={photo} srcSet={buildDriveSrcSet(person.image, [300, 500])} sizes="(min-width: 1280px) 230px, (min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw" alt={`Foto ${person.name}`} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          : <span className="flex h-full items-center justify-center bg-gradient-to-br from-[#0f4c81] to-[#092c4c] font-heading text-3xl font-extrabold text-white/40" aria-hidden="true">{initials(person.name)}</span>}
      </div>
      <div className="p-4">
        <h3 className="font-heading text-sm font-extrabold leading-snug text-[#0a3358]">{person.name}</h3>
        {person.role && <p className="mt-1 text-xs font-semibold leading-snug text-emerald-600">{person.role}</p>}
      </div>
    </article>
  );
}

// /gtk — teachers and education staff, by group, from the CMS. The principal heads the list,
// taken from the welcome page's entry so it's only ever entered once.
export default function StaffDirectory() {
  const staffContent = useQuery(staffQuery);
  const principalContent = useQuery(principalQuery);
  const principal = currentPrincipal(principalContent.data);
  const groups = groupStaff(staffContent.data)
    .map((group) => ({
      ...group,
      people: [
        ...(group.code === "pimpinan" && principal ? [{ key: principal.id, name: principal.title, role: principal.badge || "Kepala Sekolah", image: principal.image_url }] : []),
        ...group.members.map((item) => ({ key: item.id, name: item.title, role: item.badge ?? "", image: item.image_url })),
      ],
    }))
    .filter((group) => group.people.length > 0);
  const count = (code: string) => groups.find((group) => group.code === code)?.people.length ?? 0;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Guru & Tenaga Kependidikan (GTK) — SMK Teratai Putih Global 2 Bekasi";
    return () => { document.title = previousTitle; };
  }, []);

  return (
    <SubpageLayout wide data-testid="staff-page">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="section-kicker">Profil · GTK</p>
          <h1 className="section-heading mt-3">Guru &amp; Tenaga <span className="text-emerald-600">Kependidikan.</span></h1>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-slate-500">Para pendidik dan tenaga kependidikan yang setiap hari mendampingi siswa SMK Teratai Putih Global 2 Bekasi.</p>
      </div>

      {staffContent.isPending || principalContent.isPending ? (
        <div className={`mt-10 ${gridClass}`} data-testid="staff-loading">
          {Array.from({ length: 8 }, (_, index) => <div key={index}><Skeleton className="aspect-[4/5] rounded-2xl" /><Skeleton className="mt-3 h-4 w-3/4" /><Skeleton className="mt-2 h-3 w-1/2" /></div>)}
        </div>
      ) : groups.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400" data-testid="staff-empty">
          {staffContent.isError ? "Data GTK belum bisa dimuat. Silakan muat ulang halaman beberapa saat lagi." : "Data guru dan tenaga kependidikan belum tersedia."}
        </div>
      ) : (
        <>
          {(count("guru") > 0 || count("tendik") > 0) && <p className="mt-6 flex flex-wrap gap-2" data-testid="staff-summary">
            {count("guru") > 0 && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{count("guru")} guru</span>}
            {count("tendik") > 0 && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#0f4c81]">{count("tendik")} tenaga kependidikan</span>}
          </p>}
          {groups.map((group) => (
            <section key={group.code} className="mt-12" aria-labelledby={`staff-${group.code}`} data-testid={`staff-group-${group.code}`}>
              <h2 id={`staff-${group.code}`} className="font-heading text-xl font-extrabold text-[#0a3358]">{group.label}</h2>
              <div className={`mt-5 ${gridClass}`}>
                {group.people.map((person, index) => <StaggerRise key={person.key}><PersonCard person={person} testId={`staff-${group.code}-${index + 1}`} /></StaggerRise>)}
              </div>
            </section>
          ))}
        </>
      )}

      <ProfileMoreLinks current="/gtk" />
    </SubpageLayout>
  );
}
