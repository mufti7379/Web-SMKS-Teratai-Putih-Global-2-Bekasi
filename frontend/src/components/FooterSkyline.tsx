import { useRef } from "react";
import { motion, useInView, useReducedMotion, type Easing } from "motion/react";

const SKY = "#1d9dc3";
const RIB = "#178bb0";
const WALL = "#e6dcc4";
const LINE = "#3a4466";
const ACCENT = "#e4533a";

const wall = { fill: WALL, stroke: LINE, strokeWidth: 3, strokeLinejoin: "round" } as const;
const detail = { stroke: LINE, strokeWidth: 2, strokeLinecap: "round" } as const;

// One loop, in seconds: the fan opens, the buildings rise left to right, hold, sink right to left, the fan folds shut.
const CYCLE = 10;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Flat city skyline under the footer's social links. Once scrolled into view it keeps building itself up and folding away again, while the clouds drift, the wheel turns and the antenna lights blink. */
export function FooterSkyline() {
  const reduceMotion = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const loop = (animate: Record<string, number[] | number>, duration: number, ease: "linear" | "easeInOut" = "easeInOut") =>
    reduceMotion ? {} : { animate, transition: { duration, repeat: Infinity, ease } };
  // Moves `key` from hidden to shown between the two `show` seconds of the loop and back between the two `hide` seconds.
  const cycle = (key: "y" | "opacity" | "pathLength", hidden: number, shown: number, show: [number, number], hide: [number, number], showEase: Easing = EASE_OUT) =>
    reduceMotion ? {} : {
      initial: { [key]: hidden },
      animate: inView ? { [key]: [hidden, hidden, shown, shown, hidden, hidden] } : undefined,
      transition: { duration: CYCLE, repeat: Infinity, times: [0, ...show, ...hide, CYCLE].map((second) => second / CYCLE), ease: ["linear", showEase, "linear", "easeIn", "linear"] as Easing[] },
    };
  const buildings = [
    <rect x="120" y="362" width="20" height="56" {...wall} />,
    <><rect x="145" y="258" width="43" height="160" {...wall} /><path d="M158 276v124M175 276v124" {...detail} /></>,
    <><path d="M184 418V352q0-6 6-6h36q6 0 6 6v66z" {...wall} /><path d="M184 366h48" {...detail} /></>,
    <><rect x="237" y="355" width="31" height="63" {...wall} /><rect x="246" y="376" width="34" height="8" fill={LINE} /></>,
    <><path d="M282 372v-74q0-6 6-6h19q6 0 6 6v74z" {...wall} /><rect x="278" y="372" width="34" height="46" {...wall} /><path d="M287 382v30M295 382v30M303 382v30" {...detail} /></>,
    <rect x="310" y="340" width="16" height="78" {...wall} />,
    <><path d="M326 418V318l13-20 13 20v100z" {...wall} /><circle cx="339" cy="328" r="5" fill={ACCENT} /></>,
    <rect x="352" y="340" width="18" height="78" {...wall} />,
    <><rect x="370" y="355" width="67" height="63" {...wall} /><path d="M368 355l34-18 35 18z" {...wall} /><path d="M370 364h67M382 370v40M394 370v40M406 370v40M418 370v40M428 370v40" {...detail} /></>,
    <rect x="437" y="220" width="48" height="198" {...wall} />,
    <><rect x="485" y="278" width="30" height="140" {...wall} /><path d="M491 278v-20M509 278v-20M505 292v126" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" /></>,
    <><rect x="515" y="166" width="48" height="252" {...wall} /><path d="M527 180v238M539 180v238M551 180v238" {...detail} /></>,
    <><rect x="560" y="282" width="36" height="136" {...wall} /><path d="M558 282l19-24 20 24z" fill={ACCENT} stroke={LINE} strokeWidth="3" strokeLinejoin="round" /><rect x="574" y="292" width="6" height="126" fill={SKY} /></>,
    <><path d="M596 418V298l14-14 14 14h8v120z" {...wall} /><path d="M610 300v118" {...detail} /></>,
    <>
      <path d="M656 128V84M670 128V84" stroke={SKY} strokeWidth="3" strokeLinecap="round" />
      <motion.circle cx="656" cy="80" r="3.5" fill={ACCENT} {...loop({ opacity: [1, 0.15, 1] }, 1.6)} />
      <motion.circle cx="670" cy="80" r="3.5" fill={ACCENT} {...loop({ opacity: [0.15, 1, 0.15] }, 1.6)} />
      <path d="M632 418V185h16v-57h32v290z" {...wall} />
      <path d="M632 248h48M632 335h48M648 185v233M664 128v290" {...detail} />
    </>,
    <>
      <path d="M710 352l-17 62M710 352l17 62" stroke={ACCENT} strokeWidth="3" strokeLinecap="round" />
      <motion.g {...loop({ rotate: 360 }, 18, "linear")}>
        <circle cx="710" cy="352" r="34" fill="none" stroke={WALL} strokeWidth="2.5" />
        {[0, 45, 90, 135].map((angle) => <path key={angle} d="M676 352h68" transform={`rotate(${angle} 710 352)`} stroke={WALL} strokeWidth="1.5" />)}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => <circle key={angle} cx="744" cy="352" r="3.5" transform={`rotate(${angle} 710 352)`} fill={ACCENT} />)}
        <circle cx="710" cy="352" r="5" fill={WALL} />
      </motion.g>
      <rect x="690" y="411" width="40" height="7" fill={ACCENT} />
    </>,
  ];
  const last = buildings.length - 1;

  return (
    <svg ref={ref} viewBox="40 66 720 358" className="mt-6 w-full max-w-xs" aria-hidden="true" data-testid="footer-skyline">
      <defs>
        <clipPath id="footer-skyline-ground"><rect x="0" y="0" width="800" height="417" /></clipPath>
        {/* A stroke as wide as the fan's radius, drawn along a half-radius arc, sweeps the half circle open like a folding fan. */}
        <mask id="footer-skyline-fan"><motion.path d="M229.5 418a162.5 162.5 0 0 1 325 0" fill="none" stroke="#fff" strokeWidth="325" {...cycle("pathLength", 0, 1, [0.2, 1.2], [7.4, 8.4], "easeInOut")} /></mask>
      </defs>
      <g mask="url(#footer-skyline-fan)">
        <path d="M67 418a325 325 0 0 1 650 0z" fill={SKY} />
        {[15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165].map((angle) => <path key={angle} d="M392 418H72" transform={`rotate(${angle} 392 418)`} stroke={RIB} strokeWidth="2" />)}
      </g>
      <motion.g {...cycle("opacity", 0, 1, [1, 1.6], [7, 7.5])}>
        <motion.g fill={WALL} {...loop({ x: [0, 28, 0] }, 12)}>
          <rect x="312" y="133" width="140" height="24" rx="12" /><rect x="265" y="152" width="140" height="24" rx="12" /><rect x="325" y="171" width="140" height="24" rx="12" />
        </motion.g>
        <motion.rect x="165" y="200" width="70" height="16" rx="8" fill={WALL} {...loop({ x: [0, -20, 0] }, 9)} />
      </motion.g>
      <g clipPath="url(#footer-skyline-ground)">
        {buildings.map((building, index) => {
          const rise = 0.7 + index * 0.08;
          const sink = 6.2 + (last - index) * 0.06;
          return <motion.g key={index} {...cycle("y", 360, 0, [rise, rise + 0.7], [sink, sink + 0.5])}>{building}</motion.g>;
        })}
      </g>
      <path d="M50 419h700" stroke="#4b6584" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
