import { ArrowRight } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { NavMenu, NavMenuMobile, navMenuItemClass, navMenuMobileItemClass } from "@/components/NavMenu";
import { profilePages } from "@/lib/profile";

const aboutHint = "Mengenal SMK Teratai Putih Global 2";

/**
 * "Profil" in the site header (from lg up): the home page's "Tentang kami" section plus the
 * profile pages, the one being viewed shaded. Underlined while on a profile page.
 */
export function ProfileNavMenu({ active = false, onAbout }: { active?: boolean; onAbout: () => void }) {
  return (
    <NavMenu label="Profil" active={active} testId="nav-link-profil" menuTestId="nav-profile-menu">
      {(close) => <>
        <li><button type="button" onClick={() => { close(); onAbout(); }} className={navMenuItemClass} data-testid="nav-profile-about"><span className="block text-sm font-extrabold text-[#0a3358]">Tentang Kami</span><span className="mt-0.5 block text-xs text-slate-500">{aboutHint}</span></button></li>
        {profilePages.map((page) => <li key={page.path}><NavLink to={page.path} onClick={close} className={({ isActive }) => `${navMenuItemClass} ${isActive ? "bg-slate-50" : ""}`} data-testid={`nav-profile-${page.path.slice(1)}`}><span className="block text-sm font-extrabold text-[#0a3358]">{page.label}</span><span className="mt-0.5 block text-xs text-slate-500">{page.hint}</span></NavLink></li>)}
      </>}
    </NavMenu>
  );
}

/** "Profil" in the site header's hamburger menu, with the page highlighted while on a profile page. */
export function ProfileNavMobile({ active = false, onAbout }: { active?: boolean; onAbout: () => void }) {
  return (
    <NavMenuMobile label="Profil" active={active} testId="mobile-nav-link-profil" listTestId="mobile-nav-profile-pages">
      <li><button type="button" onClick={onAbout} className={`${navMenuMobileItemClass} text-slate-500`} data-testid="mobile-nav-profile-about">Tentang Kami</button></li>
      {profilePages.map((page) => <li key={page.path}><NavLink to={page.path} className={({ isActive }) => `${navMenuMobileItemClass} ${isActive ? "text-[#0f4c81]" : "text-slate-500"}`} data-testid={`mobile-nav-profile-${page.path.slice(1)}`}>{page.label}</NavLink></li>)}
    </NavMenuMobile>
  );
}

/** The other profile pages, listed at the foot of each one. */
export function ProfileMoreLinks({ current }: { current: string }) {
  const links = [{ path: "/#profil", label: "Tentang Kami", hint: aboutHint }, ...profilePages.filter((page) => page.path !== current)];
  return (
    <nav aria-label="Profil sekolah" className="mt-16 border-t border-slate-200 pt-10" data-testid="profile-more-links">
      <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-slate-400">Lainnya di Profil</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {links.map((page) => (
          <li key={page.path}>
            <Link to={page.path} className="group flex h-full items-center justify-between gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200/80 transition-all hover:-translate-y-0.5 hover:ring-[#0f4c81]/30">
              <span><strong className="block text-sm font-extrabold text-[#0a3358]">{page.label}</strong><span className="mt-0.5 block text-xs text-slate-500">{page.hint}</span></span>
              <ArrowRight size={16} className="shrink-0 text-[#0f4c81] transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
