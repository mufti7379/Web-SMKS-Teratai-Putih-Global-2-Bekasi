import { useRef } from "react";
import type { ReactNode } from "react";
import { motion, useInView, type HTMLMotionProps } from "motion/react";
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
