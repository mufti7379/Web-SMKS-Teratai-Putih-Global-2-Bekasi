import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";

export const navMenuItemClass = "block w-full rounded-xl px-4 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none";
export const navMenuMobileItemClass = "block w-full py-2.5 pl-4 text-left text-sm font-semibold";

type NavMenuProps = { label: ReactNode; ariaLabel?: string; active?: boolean; testId: string; menuTestId: string; children: (close: () => void) => ReactNode };

/**
 * A dropdown in the site header (from lg up): hovering, clicking or tabbing in opens its list.
 * Leaving it, Escape or a click elsewhere closes it again. Underlined while active.
 */
export function NavMenu({ label, ariaLabel, active = false, testId, menuTestId, children }: NavMenuProps) {
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
    // flex: as an inline box in a plain block the button sat on a text baseline, a little below the header's other items.
    <div
      ref={ref}
      className="relative flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
    >
      <button type="button" aria-label={ariaLabel} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((value) => !value)} className={`inline-flex items-center gap-1 whitespace-nowrap text-[13px] font-bold transition-all duration-300 hover:-translate-y-0.5 hover:text-[#0f4c81] ${active ? "nav-current" : open ? "text-[#0f4c81]" : "text-slate-600"}`} data-testid={testId}>
        {label} <ChevronDown size={14} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {/* pt-3 bridges the gap under the button, so moving the mouse down doesn't close the menu. */}
        {open && <div className="absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-3">
          <motion.ul initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.18 }} className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10" data-testid={menuTestId}>
            {children(() => setOpen(false))}
          </motion.ul>
        </div>}
      </AnimatePresence>
    </div>
  );
}

type NavMenuMobileProps = { label: ReactNode; active?: boolean; testId: string; listTestId: string; children: ReactNode };

/**
 * The same in the site header's hamburger menu: tapping it folds the list out underneath. Each
 * time the hamburger menu opens it starts closed — or open while active.
 */
export function NavMenuMobile({ label, active = false, testId, listTestId, children }: NavMenuMobileProps) {
  const [open, setOpen] = useState(active);

  return (
    <div className="border-b border-slate-100">
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className={`flex w-full items-center justify-between py-3 text-left text-sm font-bold ${open || active ? "text-[#0f4c81]" : "text-slate-700"}`} data-testid={testId}>
        {label} <ChevronDown size={16} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
          <ul className="pb-2" data-testid={listTestId}>{children}</ul>
        </motion.div>}
      </AnimatePresence>
    </div>
  );
}
