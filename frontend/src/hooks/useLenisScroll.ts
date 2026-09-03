import { useEffect, useRef } from "react";
import Lenis from "lenis";

/** Mounts a Lenis smooth-scroll instance for as long as the calling page stays mounted. */
export function useLenisScroll() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({ smoothWheel: true });
    lenisRef.current = lenis;
    let frame: number;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return lenisRef;
}
