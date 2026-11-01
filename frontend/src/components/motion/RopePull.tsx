import { useRef } from "react";
import type { ReactNode } from "react";
import { motion, useInView, useReducedMotion, type Easing } from "motion/react";
import { cn } from "@/lib/utils";

const SKIN = "#c68a5e";
const SKIN_SHADE = "#a8714a";
const HAIR = "#1e293b";
const SHIRT = "#059669";
const SLEEVE = "#10b981";
const SLEEVE_SHADE = "#047857";
const PANTS = "#0a3358";
const PANTS_SHADE = "#072540";
const SHOE = "#1e293b";
const ROPE = "#b45309";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** How far left of its place the pulled content starts, in px. */
const DISTANCE = 120;

type Point = readonly [number, number];

// The puller's joints in its 100×100 viewBox. It faces left, towards what it pulls, and stands on y = 98.
const HIP: Point = [66, 60];
const SHOULDER: Point = [66, 37];
const HAND: Point = [40, 52];
// A foot braced towards the load, and one planted behind — degrees around the hip.
const FRONT = 30;
const BACK = -12;

// The three heaves, in seconds: content and puller lurch right together during each one and catch their breath between.
const HEAVES = [0, 0.3, 0.45, 0.75, 0.9, 1.25];
const HEAVE_EASE: Easing[] = [EASE_OUT, "linear", EASE_OUT, "linear", EASE_OUT];
// How far back the puller leans at each heave keyframe, then upright again once the load is in.
const LEANS = [16, 24, 18, 24, 18, 24, 0];
const RELEASE = 1.5;

/** `point` turned `degrees` clockwise around `pivot`, as an SVG rotate() would. */
function turn([x, y]: Point, [cx, cy]: Point, degrees: number): Point {
  const angle = (degrees * Math.PI) / 180;
  const dx = x - cx;
  const dy = y - cy;
  return [cx + dx * Math.cos(angle) - dy * Math.sin(angle), cy + dx * Math.sin(angle) + dy * Math.cos(angle)];
}

// Joint to turn a part around, in viewBox units. Motion overwrites a plain transformOrigin on SVG
// with its own "50% 50%", so the origin goes in through originX/originY.
const pivot = ([x, y]: Point) => ({ transformBox: "view-box", originX: `${x}px`, originY: `${y}px` }) as const;

type RopePullProps = {
  children: ReactNode;
  /** Pops in from the bottom-right corner once the pulled content has landed. */
  after?: ReactNode;
  className?: string;
  "data-testid"?: string;
};

/**
 * On first scroll into view a little student, leaning back on a rope, hauls `children` in from the
 * left in three heaves. Once it lands they let go, straighten up, hop, turn round and walk off right,
 * while `after` pops in.
 */
export function RopePull({ children, after, className, "data-testid": testId }: RopePullProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });

  if (reduceMotion) return <div ref={ref} className={cn("relative", className)} data-testid={testId}>{children}{after}</div>;

  // Plays `keyframes` once in view; `seconds` are the moments each keyframe is reached.
  const play = (keyframes: Record<string, number[]>, seconds: number[], ease: Easing | Easing[] = "easeInOut") => {
    const duration = seconds[seconds.length - 1];
    return {
      initial: Object.fromEntries(Object.entries(keyframes).map(([key, values]) => [key, values[0]])),
      animate: inView ? keyframes : undefined,
      transition: { duration, times: seconds.map((second) => second / duration), ease },
    };
  };

  // The rope runs from the content's right edge to the front hand, which moves as the puller leans.
  const tie = turn(HAND, HIP, 20);
  const hands = LEANS.slice(0, HEAVES.length).map((lean) => turn(HAND, HIP, lean));
  const [dropX] = hands[hands.length - 1];

  // Each heave the planted foot ends up braced in front and the other steps back; then a short walk off.
  const legSeconds = [...HEAVES, RELEASE, 1.95, 2.12, 2.3, 2.48, 2.6];
  const legEase: Easing[] = [...HEAVE_EASE, "easeOut", "linear", "easeInOut", "easeInOut", "easeInOut", "easeInOut"];
  const leg = (pants: string, rotate: number[]) => (
    <motion.g style={pivot(HIP)} {...play({ rotate }, legSeconds, legEase)}>
      <path d="M66 60v34" stroke={pants} strokeWidth={9} strokeLinecap="round" />
      <path d="M68 96h-9" stroke={SHOE} strokeWidth={6} strokeLinecap="round" />
    </motion.g>
  );
  // Arms hold the rope out until the load is in, then drop to the sides.
  const arm = (sleeve: string, skin: string, [sx, sy]: Point, [hx, hy]: Point) => (
    <motion.g style={pivot(SHOULDER)} {...play({ rotate: [0, 0, -58] }, [0, HEAVES[HEAVES.length - 1], RELEASE], ["linear", "easeOut"])}>
      <path d={`M${sx} ${sy}L${hx} ${hy}`} stroke={sleeve} strokeWidth={6} strokeLinecap="round" />
      <circle cx={hx} cy={hy} r={3.4} fill={skin} />
    </motion.g>
  );

  return (
    <div ref={ref} className={cn("relative", className)} data-testid={testId}>
      <motion.div className="relative" {...play({ x: [-DISTANCE, -DISTANCE * 0.62, -DISTANCE * 0.62, -DISTANCE * 0.28, -DISTANCE * 0.28, 0], opacity: [0, 1, 1, 1, 1, 1] }, HEAVES, HEAVE_EASE)}>
        {children}
        <svg viewBox="0 0 100 100" className="pointer-events-none absolute bottom-0 left-full h-24 w-24 overflow-visible sm:h-28 sm:w-28" aria-hidden="true" data-testid="rope-puller">
          <motion.line
            x1={-3}
            y1={tie[1]}
            stroke={ROPE}
            strokeWidth={2.5}
            strokeLinecap="round"
            {...play(
              { x2: [...hands.map(([x]) => x), dropX, dropX], y2: [...hands.map(([, y]) => y), 96, 96], opacity: [...hands.map(() => 1), 1, 0] },
              [...HEAVES, RELEASE, 1.9],
              [...HEAVE_EASE, "easeIn", "linear"],
            )}
          />
          {/* Turns round and walks off once the job is done. */}
          <motion.g style={pivot([HIP[0], 98])} {...play({ x: [0, 0, 0, 30], scaleX: [1, 1, -1, -1], opacity: [1, 1, 1, 0] }, [0, 1.88, 1.98, 2.6], ["linear", "easeInOut", "linear"])}>
            <ellipse cx={66} cy={98.5} rx={18} ry={2.2} fill="#0f172a" opacity={0.12} />
            <motion.g {...play({ y: [0, 0, -7, 0] }, [0, RELEASE + 0.05, RELEASE + 0.17, RELEASE + 0.32], ["linear", "easeOut", "easeIn"])}>
              {leg(PANTS_SHADE, [BACK, FRONT, FRONT, BACK, BACK, FRONT, -4, -4, -16, 22, -16, 0])}
              {leg(PANTS, [FRONT, BACK, BACK, FRONT, FRONT, BACK, 4, 4, 22, -16, 22, 0])}
              <motion.g style={pivot(HIP)} {...play({ rotate: LEANS }, [...HEAVES, RELEASE], [...HEAVE_EASE, "easeOut"])}>
                {arm(SLEEVE_SHADE, SKIN_SHADE, [67, 38], [43, 50])}
                <path d="M66 58V38" stroke={SHIRT} strokeWidth={16} strokeLinecap="round" />
                <circle cx={67.5} cy={21} r={9} fill={HAIR} />
                <circle cx={64.5} cy={23} r={8} fill={SKIN} />
                <circle cx={59.8} cy={22} r={1.1} fill={HAIR} />
                <path d="M59 27.5h2.6" stroke={HAIR} strokeWidth={1.2} strokeLinecap="round" />
                {arm(SLEEVE, SKIN, SHOULDER, HAND)}
              </motion.g>
            </motion.g>
          </motion.g>
        </svg>
      </motion.div>
      {after && <motion.div className="pointer-events-none absolute inset-0 origin-bottom-right" {...play({ opacity: [0, 0, 1], scale: [0.6, 0.6, 1] }, [0, 1.3, 1.75], ["linear", "backOut"])}>{after}</motion.div>}
    </div>
  );
}
