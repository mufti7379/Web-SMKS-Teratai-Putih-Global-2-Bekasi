// The "Profil" menu's own pages — shared by the React app (frontend/src/lib/profile.ts
// re-exports it: header dropdown, the pages) and the Vercel functions next to it (each page's
// <head>, the sitemap). Deliberately dependency-free, like newsPath.ts.

export type ProfilePage = { path: string; label: string; hint: string };

/** In menu order. The home page's "Tentang kami" section comes first in the menu, ahead of these. */
export const profilePages: ProfilePage[] = [
  { path: "/visi-misi", label: "Visi & Misi", hint: "Arah Yayasan Teratai Putih Global" },
  { path: "/sambutan-kepala-sekolah", label: "Sambutan Kepala Sekolah", hint: "Pesan dari pimpinan sekolah" },
  { path: "/gtk", label: "GTK", hint: "Guru dan tenaga kependidikan" },
];

export type StaffGroup = "pimpinan" | "guru" | "tendik";

/** The GTK page's groups, in page order; a staff entry's `code` says which one it's in. */
export const staffGroups: { code: StaffGroup; label: string }[] = [
  { code: "pimpinan", label: "Pimpinan Sekolah" },
  { code: "guru", label: "Guru" },
  { code: "tendik", label: "Tenaga Kependidikan" },
];

type StaffRef = { title: string; code: string | null; sort_order?: number | null };

/**
 * Published staff split into `staffGroups`, each in its numbered order, then unnumbered ones
 * by name. An entry without a known group counts as a teacher.
 */
export function groupStaff<T extends StaffRef>(items: T[] | null | undefined) {
  const groupOf = (item: T) => staffGroups.find((group) => group.code === item.code)?.code ?? "guru";
  // Infinity - Infinity is NaN, which is falsy, so two unnumbered entries fall through to their names.
  const inOrder = (a: T, b: T) => (a.sort_order ?? Infinity) - (b.sort_order ?? Infinity) || a.title.localeCompare(b.title, "id");
  return staffGroups.map((group) => ({ ...group, members: (items ?? []).filter((item) => groupOf(item) === group.code).sort(inOrder) }));
}

/**
 * The principal's welcome on show, from the published ones the CMS returns: the most recently
 * edited, so a new principal's entry takes over even if the old one is still published.
 */
export function currentPrincipal<T extends { updated_at: string }>(items: T[] | null | undefined): T | null {
  return [...(items ?? [])].sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))[0] ?? null;
}

// Yayasan Teratai Putih Global's vision and mission, word for word from the "Tentang Kami"
// section of terataiputihglobal.info. Copied rather than fetched: that site also carries
// injected spam links, so the pages don't send visitors there.
export const foundationVision = "Menjadi Yayasan Pendidikan Berkualitas Terbaik dan Berwawasan Global.";

export const foundationMissions = [
  "Menyelenggarakan Yayasan Pendidikan Berkualitas, Unggul, Terpercaya, dan Profesional.",
  "Mewujudkan SDM yang Kompeten, Sarana/Prasarana Memadai, Sistem Mutakhir, dan Fokus pada Keberhasilan Siswa.",
  "Memberikan Manfaat Seluas-Luasnya Kepada Siswa dan Masyarakat.",
  "Memberikan Kontribusi yang Optimal untuk Mempersiapkan SDM Berakhlak Mulia, Kompeten, Produktif, dan Siap Bersaing di Era Globalisasi.",
];
