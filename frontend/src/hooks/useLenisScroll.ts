import { useEffect, useRef } from "react";
import type Lenis from "lenis";

/**
 * Mounts a Lenis smooth-scroll instance for as long as the calling page stays mounted — started
 * once the page has loaded and gone quiet, or at the first turn of a mouse wheel, whichever comes
 * first, and only then downloaded. While the page is still filling in its height changes again
 * and again, and Lenis re-measured the whole page each time (half a second of a phone's main
 * thread, where it doesn't even smooth anything: touch scrolling stays the browser's own). Until
 * it's running, ref.current is null and callers scroll natively (html's scroll-padding-top keeps
 * targets clear of the header).
 */
export function useLenisScroll() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    let frame = 0;
    let stopped = false;
    let starting = false;
    const start = () => {
      if (starting) return;
      starting = true;
      void import("lenis").then(({ default: LenisScroll }) => {
        if (stopped) return;
        const lenis = new LenisScroll({ smoothWheel: true });
        lenisRef.current = lenis;
        const raf = (time: number) => {
          lenis.raf(time);
          frame = requestAnimationFrame(raf);
        };
        frame = requestAnimationFrame(raf);
      });
    };
    // Safari before 18 has no requestIdleCallback.
    const hasIdle = typeof window.requestIdleCallback === "function";
    const idle = hasIdle ? window.requestIdleCallback(start, { timeout: 4000 }) : setTimeout(start, 2500);
    window.addEventListener("wheel", start, { once: true, passive: true });
    return () => {
      stopped = true;
      if (hasIdle) window.cancelIdleCallback(idle as number);
      else clearTimeout(idle);
      window.removeEventListener("wheel", start);
      cancelAnimationFrame(frame);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, []);

  return lenisRef;
}
