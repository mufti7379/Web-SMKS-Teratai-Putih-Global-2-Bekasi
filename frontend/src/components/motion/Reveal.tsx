import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion, useInView, useReducedMotion, useScroll, useTransform, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

type RevealProps = Omit<HTMLMotionProps<"div">, "initial" | "animate" | "transition"> & {
  children: ReactNode;
  delay?: number;
  y?: number;
  scale?: number;
  once?: boolean;
};

/** Scroll-triggered fade + rise, once per element, spring-eased. */
export function Reveal({ children, className, delay = 0, y = 28, scale, once = true, ...rest }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, amount: 0.2 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y, scale: scale ?? 1 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y, scale: scale ?? 1 }}
      transition={{ type: "spring", stiffness: 190, damping: 26, delay: delay / 1000 }}
      className={cn(className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

type ClipRevealProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  delay?: number;
  duration?: number;
  as?: "span" | "div";
};

/** Clip-mask slide-up reveal for headings — the whole block slides up out of an overflow-hidden mask. */
export function ClipReveal({ children, className, innerClassName, delay = 0, duration = 0.9, as = "span" }: ClipRevealProps) {
  const Tag = as;
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref as React.RefObject<Element>, { once: true, amount: 0.4 });
  return (
    <Tag ref={ref as never} className={cn("block overflow-hidden pb-[0.14em]", className)}>
      <motion.span
        className={cn("block", innerClassName)}
        initial={{ y: "115%", opacity: 0 }}
        animate={inView ? { y: "0%", opacity: 1 } : { y: "115%", opacity: 0 }}
        transition={{ duration, ease: [0.16, 1, 0.3, 1], delay: delay / 1000 }}
      >
        {children}
      </motion.span>
    </Tag>
  );
}

type StaggerRiseProps = {
  children: ReactNode;
  className?: string;
  /** How much lower each column further right starts, in px, as its row enters the viewport. */
  step?: number;
};

/**
 * Scroll-linked "uneven → level" entrance for grid items (as on adobe.com): a row starts
 * stepped — each column further right sits lower — and rises into line as it scrolls in,
 * level once the row's top reaches 40% of the viewport. Follows the scroll both ways.
 */
export function StaggerRise({ children, className, step = 72 }: StaggerRiseProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [column, setColumn] = useState(0);
  // Motion measures the target by offsetTop, so the item's own translate doesn't feed back
  // into its progress — every item in a row shares one progress value.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.4"] });
  const y = useTransform(scrollYProgress, (progress) => (1 - progress) * column * step);

  // Which grid column the item landed in (0 = leftmost), re-measured whenever the grid reflows.
  useLayoutEffect(() => {
    const item = ref.current;
    const grid = item?.parentElement;
    if (!item || !grid) return;
    const measure = () => {
      if (item.offsetWidth) setColumn(Math.round((item.getBoundingClientRect().left - grid.getBoundingClientRect().left) / item.offsetWidth));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(item);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div ref={ref} style={reduceMotion ? undefined : { y }} className={cn(className)}>
      {children}
    </motion.div>
  );
}
