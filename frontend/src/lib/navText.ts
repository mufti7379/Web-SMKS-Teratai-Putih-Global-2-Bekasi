import { usePageLanguage } from "@/lib/translate";

/**
 * The site header's menu in English and Japanese, written here instead of left to Google: its
 * dropdowns and the hamburger menu only exist while open, and Google's translator never got to
 * them — and where it did, it sometimes picked the wrong sense (Kontak as 接触, "physical
 * contact"). The header marks its menus translate="no" so Google leaves them to this. A label
 * without an entry here stays Indonesian, so a new menu item needs one.
 */
const navText: Record<string, { en: string; ja: string }> = {
  // The menu bar.
  Beranda: { en: "Home", ja: "ホーム" },
  Profil: { en: "Profile", ja: "学校紹介" },
  Layanan: { en: "Services", ja: "サービス" },
  Jurusan: { en: "Majors", ja: "学科" },
  Fasilitas: { en: "Facilities", ja: "施設" },
  Agenda: { en: "Events", ja: "行事予定" },
  Berita: { en: "News", ja: "ニュース" },
  Galeri: { en: "Gallery", ja: "ギャラリー" },
  Kontak: { en: "Contact", ja: "お問い合わせ" },
  // Profil.
  "Tentang Kami": { en: "About Us", ja: "本校について" },
  "Mengenal SMK Teratai Putih Global 2": { en: "Get to know SMK Teratai Putih Global 2", ja: "SMK Teratai Putih Global 2 のご紹介" },
  "Visi & Misi": { en: "Vision & Mission", ja: "ビジョンとミッション" },
  "Arah Yayasan Teratai Putih Global": { en: "Where the Teratai Putih Global Foundation is heading", ja: "Teratai Putih Global 財団の方針" },
  "Sambutan Kepala Sekolah": { en: "Principal's Welcome", ja: "校長あいさつ" },
  "Pesan dari pimpinan sekolah": { en: "A message from the head of the school", ja: "学校長からのメッセージ" },
  GTK: { en: "Teachers & Staff", ja: "教職員" },
  "Guru dan tenaga kependidikan": { en: "Teachers and education staff", ja: "教員と職員" },
  // Layanan.
  Ujian: { en: "Exams", ja: "試験" },
  "Ujian berbasis komputer (CBT)": { en: "Computer-based tests (CBT)", ja: "コンピューター試験（CBT）" },
  Absensi: { en: "Attendance", ja: "出欠" },
  "Catatan kehadiran siswa": { en: "Student attendance records", ja: "生徒の出欠記録" },
  Raport: { en: "Report Cards", ja: "通知表" },
  "Rapor digital siswa": { en: "Students' digital report cards", ja: "生徒のデジタル通知表" },
  BKK: { en: "Career Center (BKK)", ja: "就職支援（BKK）" },
  "Bursa kerja dan lowongan": { en: "Job board and vacancies", ja: "求人・就職情報" },
  "Pembayaran Uang Sekolah": { en: "School Fee Payment", ja: "学費の支払い" },
  "Lewat aplikasi Sekolah Pro": { en: "Through the Sekolah Pro app", ja: "Sekolah Pro アプリから" },
  Unduhan: { en: "Downloads", ja: "ダウンロード" },
  "Berkas dan dokumen sekolah": { en: "School files and documents", ja: "学校の書類・資料" },
  // The language menu.
  Bahasa: { en: "Language", ja: "言語" },
  "Bahasa asli situs": { en: "The site's own language", ja: "サイトの元の言語" },
  "Terjemahan otomatis Google": { en: "Machine-translated by Google", ja: "Google による自動翻訳" },
};

/** Turns a header menu label into the page's language (see above); Indonesian as written. */
export function useNavText() {
  const language = usePageLanguage();
  return (text: string) => (language === "id" ? text : navText[text]?.[language] ?? text);
}
