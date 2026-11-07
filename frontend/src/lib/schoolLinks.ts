// The school's online services and the government sites its students need, all listed in the
// footer. Those with a hint are also the site header's "Layanan" menu. An href starting with "/"
// is a page of this site; the rest open in a new tab.
export const schoolLinks: { label: string; href: string; hint?: string }[] = [
  { label: "Ujian", href: "https://ujiango.smk-terataiputih2.sch.id", hint: "Ujian berbasis komputer (CBT)" },
  { label: "Absensi", href: "https://absensi.smk-terataiputih2.sch.id", hint: "Catatan kehadiran siswa" },
  { label: "Raport", href: "https://rapor.smk-terataiputih2.sch.id", hint: "Rapor digital siswa" },
  { label: "Aplikasi BankSampah", href: "https://akun.resikforschools.tech/" },
  { label: "BKK", href: "https://bkk.smk-terataiputih2.sch.id", hint: "Bursa kerja dan lowongan" },
  { label: "Pembayaran Uang Sekolah", href: "https://sekolah.pro/mobile/LoginPage", hint: "Lewat aplikasi Sekolah Pro" },
  { label: "Unduhan", href: "/unduhan", hint: "Berkas dan dokumen sekolah" },
  { label: "Validasi SHTKA", href: "https://shtka.kemendikdasmen.go.id/verifikasi-shtka" },
  { label: "NISN", href: "https://nisn.data.kemendikdasmen.go.id/?utm_source=portal-satu-data" },
  { label: "KIP-K", href: "https://kip-kuliah.kemdiktisaintek.go.id/" },
];
