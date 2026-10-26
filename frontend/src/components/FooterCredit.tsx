import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Bottom row shared by every page footer: copyright on one side, developer credit on the other. */
export function FooterCredit({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className={cn("flex flex-col gap-4 text-xs tracking-wide text-slate-400 sm:flex-row sm:items-center sm:justify-between", className)} data-testid="footer-credit">
      <p>© 2026 <span className="font-semibold text-slate-300">SMK Teratai Putih Global 2 Bekasi</span></p>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <span>Developed by</span>
        <a href="https://etosdev.com" target="_blank" rel="noreferrer" className="group inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold tracking-normal text-slate-200 transition-colors duration-300 hover:bg-white/20 hover:text-white" data-testid="footer-developer-link">etosdev <ArrowUpRight size={12} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></a>
        <span>with</span>
        <motion.span role="img" aria-label="love" className="inline-block text-sm text-red-500" animate={reduceMotion ? undefined : { scale: [1, 1.25, 1, 1.15, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>❤</motion.span>
      </p>
    </div>
  );
}
