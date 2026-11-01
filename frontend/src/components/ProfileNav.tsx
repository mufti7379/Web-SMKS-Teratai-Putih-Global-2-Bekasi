import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { profilePages } from "@/lib/profile";

const aboutHint = "Mengenal SMK Teratai Putih Global 2";
const itemClass = "block w-full rounded-xl px-4 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none";

/**
 * "Profil" in the home page's desktop header: hovering, clicking or tabbing in opens a list of
 * the page's own "Tentang kami" section plus the profile pages. Leaving it, Escape or a click
 * elsewhere closes it again.
 */
export function ProfileNavMenu({ onAbout }: { onAbout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
    >
      <button type="button" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((value) => !value)} className={`inline-flex items-center gap-1 text-[13px] font-bold transition-all duration-300 hover:-translate-y-0.5 hover:text-[#0f4c81] ${open ? "text-[#0f4c81]" : "text-slate-600"}`} data-testid="nav-link-profil">
        Profil <ChevronDown size={14} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {/* pt-3 bridges the gap under the button, so moving the mouse down doesn't close the menu. */}
        {open && <div className="absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-3">
          <motion.ul initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.18 }} className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10" data-testid="nav-profile-menu">
            <li><button type="button" onClick={() => { setOpen(false); onAbout(); }} className={itemClass} data-testid="nav-profile-about"><span className="block text-sm font-extrabold text-[#0a3358]">Tentang Kami</span><span className="mt-0.5 block text-xs text-slate-500">{aboutHint}</span></button></li>
            {profilePages.map((page) => <li key={page.path}><Link to={page.path} onClick={() => setOpen(false)} className={itemClass} data-testid={`nav-profile-${page.path.slice(1)}`}><span className="block text-sm font-extrabold text-[#0a3358]">{page.label}</span><span className="mt-0.5 block text-xs text-slate-500">{page.hint}</span></Link></li>)}
          </motion.ul>
        </div>}
      </AnimatePresence>
    </div>
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
