import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import { FooterCredit } from "@/components/FooterCredit";
import { FooterSkyline } from "@/components/FooterSkyline";

// lucide dropped its brand icons, so the social ones are drawn here in lucide's stroke
// style (24px grid, 2px round strokes) to match the rest of the site's icons.
type IconProps = { size?: number };
const strokeIcon = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", viewBox: "0 0 24 24", "aria-hidden": true } as const;

function FacebookIcon({ size = 18 }: IconProps) {
  return <svg width={size} height={size} {...strokeIcon}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>;
}

function TikTokIcon({ size = 18 }: IconProps) {
  return <svg width={size} height={size} {...strokeIcon}><path d="M21 7.917v4.034a9.948 9.948 0 0 1-5-1.951v4.5a6.5 6.5 0 1 1-8-6.326v4.326a2.5 2.5 0 1 0 4 2v-11.5h4.083a6.005 6.005 0 0 0 4.917 4.917z" /></svg>;
}

function InstagramIcon({ size = 18 }: IconProps) {
  return <svg width={size} height={size} {...strokeIcon}><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>;
}

function YouTubeIcon({ size = 18 }: IconProps) {
  return <svg width={size} height={size} {...strokeIcon}><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>;
}

// WhatsApp and email live in the home page's contact section, so the footer only links out
// to the school's social accounts.
const footerSocials: { label: string; href: string; icon: ComponentType<IconProps>; testId: string }[] = [
  { label: "Facebook", href: "https://www.facebook.com/teratai.putihdua", icon: FacebookIcon, testId: "footer-facebook-link" },
  { label: "Instagram", href: "https://www.instagram.com/smkterput2.bekasi/", icon: InstagramIcon, testId: "footer-instagram-link" },
  { label: "TikTok", href: "https://www.tiktok.com/@smkterput2.bekasi", icon: TikTokIcon, testId: "footer-tiktok-link" },
  { label: "YouTube", href: "https://www.youtube.com/@smkterput2oke559", icon: YouTubeIcon, testId: "footer-youtube-link" },
];

const footerShortcuts = [
  ["Ujian", "https://ujiango.smk-terataiputih2.sch.id"],
  ["Absensi", "https://absensi.smk-terataiputih2.sch.id"],
  ["Raport", "https://rapor.smk-terataiputih2.sch.id"],
  ["BKK", "https://bkk.smk-terataiputih2.sch.id"],
  ["Pembayaran Uang Sekolah", "https://sekolah.pro/mobile/LoginPage"],
  ["Validasi SHTKA", "https://shtka.kemendikdasmen.go.id/verifikasi-shtka"],
  ["NISN", "https://nisn.data.kemendikdasmen.go.id/?utm_source=portal-satu-data"],
  ["KIP-K", "https://kip-kuliah.kemdiktisaintek.go.id/"],
] as const;

/** Full site footer — school info, shortcut links, contacts and credit — shared by every public page. */
export function SiteFooter() {
  return (
    // Higher than the header's z-40 so the footer visually covers the sticky header
    // as soon as it scrolls up to the top of the viewport, instead of the header
    // staying pinned on top of the footer for the rest of the scroll.
    <footer className="relative z-50 bg-[#061e34] px-5 pb-8 pt-16 text-slate-400" data-testid="site-footer">
      <div className="mx-auto max-w-7xl lg:px-3">
        <div className="grid gap-10 border-b border-white/10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3"><img src="/logo-tp2.png" alt="Logo SMK Teratai Putih Global 2" className="h-10 w-10 rounded-xl object-contain" /><span><strong className="block text-sm text-white">SMK Teratai Putih Global 2</strong><small className="text-[10px]">Unggul · Terpercaya · Profesional</small></span></div>
            <div className="mt-4 flex flex-wrap gap-2" data-testid="footer-school-identity"><span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-slate-200">Akreditasi A</span><span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-slate-200">NPSN 20254039</span></div>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-slate-400">Ruang tumbuh bagi generasi muda yang unggul, terpercaya, dan profesional dengan lima program keahlian siap kerja.</p>
            <p className="mt-4 text-xs leading-relaxed text-slate-400">Jl. Rajawali V, RT.005/RW.023, Kayuringin Jaya<br />Kec. Bekasi Selatan, Kota Bekasi, Jawa Barat 17144</p>
            <div className="mt-5 flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white p-1.5"><img src="/logo-yayasan.png" alt="Logo Yayasan Teratai Putih Global" className="h-full w-full object-contain" data-testid="footer-foundation-logo" /></span><span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white p-1.5"><img src="/logo-smk-hebat.jpg" alt="Logo SMK Bisa Hebat" className="h-full w-full object-contain" data-testid="footer-smk-hebat-logo" /></span></div>
          </div>
          <div data-testid="footer-shortcuts">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Tautan</p>
            <ul className="mt-4 space-y-2.5">{footerShortcuts.map(([label, href]) => <li key={label}><a href={href} target="_blank" rel="noreferrer" className="inline-block text-xs font-bold text-slate-300 transition-all duration-300 hover:translate-x-1 hover:text-white" data-testid={`footer-shortcut-${label.toLowerCase().replaceAll(" ", "-")}`}>{label}</a></li>)}</ul>
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Ikuti Kami</p>
            {/* Round icon buttons; the name shows as a tooltip and is read out by screen readers. */}
            <ul className="mt-4 flex flex-wrap gap-3" data-testid="footer-socials">
              {footerSocials.map(({ label, href, icon: Icon, testId }) => (
                <li key={label}><a href={href} target="_blank" rel="noreferrer" aria-label={label} title={label} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20" data-testid={testId}><Icon size={18} /></a></li>
              ))}
            </ul>
            <Link to="/admin" className="mt-5 inline-block text-xs font-bold text-slate-500 transition-colors hover:text-white" data-testid="footer-admin-link">Admin</Link>
            <FooterSkyline />
          </div>
        </div>
        <FooterCredit className="mt-8" />
      </div>
    </footer>
  );
}
