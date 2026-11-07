import { Fragment, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { GraduationCap, Menu, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ProfileNavMenu, ProfileNavMobile } from "@/components/ProfileNav";
import { ServicesNavMenu, ServicesNavMobile } from "@/components/ServicesNav";
import { profilePages } from "@/lib/profile";

// The home page's sections, in page order.
const navItems = [
  ["Beranda", "#beranda"], ["Profil", "#profil"], ["Jurusan", "#jurusan"], ["Fasilitas", "#fasilitas"], ["Agenda", "#berita"], ["Berita", "#berita-terkini"], ["Galeri", "#galeri"], ["Kontak", "#kontak"],
] as const;

// Off the home page each item leads back to its section there — except Berita, which has a page of its own.
const itemPath = (href: string) => (href === "#beranda" ? "/" : href === "#berita-terkini" ? "/berita" : `/${href}`);

// The item the current page belongs to; none on the home page itself.
function currentItem(pathname: string) {
  if (pathname.startsWith("/berita")) return "#berita-terkini";
  if (pathname.startsWith("/galeri")) return "#galeri";
  if (profilePages.some((page) => page.path === pathname)) return "#profil";
  return null;
}

/**
 * On the home page: the item whose section crosses a line 40% down the window. Beranda until
 * Profil reaches it (the hero is sticky, so its own box never leaves), none over the sections
 * without an item (Kerja sama, SPMB), Kontak once the page is scrolled to the bottom.
 */
function sectionInView() {
  const line = window.innerHeight * 0.4;
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) return "#kontak";
  const profile = document.getElementById("profil");
  if (profile && profile.getBoundingClientRect().top > line) return "#beranda";
  return navItems.find(([, href]) => {
    const box = href === "#beranda" ? null : document.getElementById(href.slice(1))?.getBoundingClientRect();
    return box && box.top <= line && box.bottom > line;
  })?.[1] ?? null;
}

type SiteHeaderProps = {
  /** On the home page: scroll to one of its sections. Left out elsewhere, where the items link back to them. */
  onSection?: (href: string) => void;
  /** On the home page: bring up the SPMB announcement. Left out elsewhere, where the button links to it. */
  onSpmb?: () => void;
};

/**
 * The site's header on every public page: logo, the home page's sections (with "Profil" as a
 * dropdown, "Layanan" as another right beside it), SPMB and guest-book buttons, and a hamburger
 * menu below lg. Once the page scrolls it floats as a rounded bar. The item for where the visitor
 * is gets the amber underline: the page it belongs to, or on the home page the section in view —
 * so a clicked item takes it on arrival.
 */
export function SiteHeader({ onSection, onSpmb }: SiteHeaderProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onHome = Boolean(onSection);
  const [section, setSection] = useState<string | null>(null);
  const current = onHome ? section : currentItem(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
      if (onHome) setSection(sectionInView());
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onHome]);

  // A tap anywhere outside the header closes the hamburger menu.
  useEffect(() => {
    if (!menuOpen) return;
    const closeOutside = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setMenuOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [menuOpen]);

  const go = (href: string) => {
    setMenuOpen(false);
    if (onSection) onSection(href);
    else navigate(itemPath(href));
  };

  // A section button on the home page, a real link everywhere else.
  const item = (label: string, href: string, className: string, testId: string) => onSection
    ? <button type="button" key={href} onClick={() => go(href)} aria-current={href === current ? "location" : undefined} className={className} data-testid={testId}>{label}</button>
    : <Link key={href} to={itemPath(href)} onClick={() => setMenuOpen(false)} aria-current={href === current ? "page" : undefined} className={className} data-testid={testId}>{label}</Link>;

  const brand = <>
    <img src="/logo-tp2.png" alt="Logo SMK Teratai Putih Global 2" className="h-11 w-11 rounded-2xl object-contain shadow-lg shadow-blue-900/15" />
    <span className="hidden md:block lg:hidden xl:block"><span className="block whitespace-nowrap font-heading text-[15px] font-extrabold leading-tight text-[#0a3358]">SMK TERATAI PUTIH GLOBAL 2</span><span className="mt-0.5 block whitespace-nowrap text-[11px] font-bold text-amber-500">Kota Bekasi – Joyfull Learning</span></span>
  </>;
  const spmbClass = "flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 transition-all hover:-translate-y-0.5 hover:bg-amber-100 sm:gap-2 sm:px-4 sm:py-2";

  return (
    // w-full: in a flex column (the other pages' layout) mx-auto alone would shrink the header to its content.
    <header ref={ref} className={`sticky z-40 mx-auto w-full backdrop-blur-xl transition-all duration-300 ${scrolled ? "top-[10px] max-w-[min(80rem,calc(100%-2.5rem))] rounded-2xl border border-white/40 bg-slate-200/60 shadow-lg" : "top-0 max-w-full rounded-none border-b border-slate-200/80 bg-white/95 shadow-sm"}`} data-testid="site-header">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-8">
        {onSection
          ? <button type="button" className="flex items-center gap-3 text-left" onClick={() => go("#beranda")} data-testid="school-brand-button">{brand}</button>
          : <Link to="/" className="flex items-center gap-3" data-testid="school-brand-button">{brand}</Link>}
        <nav className="hidden items-center gap-4 lg:flex xl:gap-5" aria-label="Navigasi utama" data-testid="desktop-navigation">
          {navItems.map(([label, href]) => href === "#profil"
            ? <Fragment key={href}><ProfileNavMenu active={href === current} onAbout={() => go(href)} /><ServicesNavMenu /></Fragment>
            : item(label, href, `inline-block text-[13px] font-bold transition-all duration-300 hover:-translate-y-0.5 hover:text-[#0f4c81] ${href === current ? "nav-current" : "text-slate-600"}`, `nav-link-${label.toLowerCase()}`))}
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onSpmb
            ? <button type="button" onClick={() => { setMenuOpen(false); onSpmb(); }} className={spmbClass} data-testid="header-spmb-link"><GraduationCap size={15} /> SPMB</button>
            : <Link to="/#spmb" className={spmbClass} data-testid="header-spmb-link"><GraduationCap size={15} /> SPMB</Link>}
          <a href="https://s.id/DGB-TERPUT" target="_blank" rel="noreferrer" className="flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 transition-all hover:-translate-y-0.5 hover:bg-amber-100 sm:px-5 sm:py-2.5" data-testid="header-guestbook-link"><span className="hidden min-[400px]:inline">Buku Tamu Digital</span><span className="min-[400px]:hidden">Buku Tamu</span></a>
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="rounded-xl p-2 text-[#0a3358] lg:hidden" aria-label={menuOpen ? "Tutup menu" : "Buka menu"} aria-expanded={menuOpen} data-testid="mobile-menu-toggle">{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </div>
      <AnimatePresence>
        {/* Overlays the page instead of pushing it down: a taller in-flow header shifted
            everything, so a tapped section landed a whole menu's height too far. */}
        {menuOpen && <motion.nav initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={`absolute inset-x-0 top-full overflow-hidden bg-white lg:hidden ${scrolled ? "mt-2 rounded-2xl border border-slate-200 shadow-xl" : "border-b border-slate-100 shadow-lg"}`} aria-label="Navigasi utama" data-testid="mobile-navigation">
          {/* Scrolls on its own: with its lists folded out the menu outgrows a phone, and the header it hangs from never moves. */}
          <div data-lenis-prevent className="max-h-[calc(100dvh-6.5rem)] overflow-y-auto px-5 py-4">
            {navItems.map(([label, href]) => href === "#profil"
              ? <Fragment key={href}><ProfileNavMobile active={href === current} onAbout={() => go(href)} /><ServicesNavMobile onPick={() => setMenuOpen(false)} /></Fragment>
              : item(label, href, `block w-full border-b border-slate-100 py-3 text-left text-sm font-bold ${href === current ? "text-[#0f4c81]" : "text-slate-700"}`, `mobile-nav-link-${label.toLowerCase()}`))}
          </div>
        </motion.nav>}
      </AnimatePresence>
    </header>
  );
}
