import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

type TypewriterProps = {
  /** Typed in turn — each one typed, held, deleted, then the next — looping forever. Keep the
   *  array's identity stable (define it outside the component) so the loop isn't restarted. */
  phrases: readonly string[];
  /** Milliseconds per typed character. */
  typeSpeed?: number;
  /** Milliseconds per deleted character. */
  deleteSpeed?: number;
  /** How long a finished phrase stays before it's deleted. */
  holdTime?: number;
  /** Pause on the empty line before the next phrase starts. */
  gapTime?: number;
  /** Milliseconds before the very first character appears. */
  startDelay?: number;
};

type Phase = "typing" | "holding" | "deleting";

/**
 * Rotating typewriter text with a caret that blinks only while it's idle. Every phrase sits
 * invisibly in the same grid cell, so the element is always the size of the longest one and
 * nothing around it shifts as the text changes. Screen readers and search engines get all the
 * phrases once, as plain text, instead of the moving copy. With reduced motion only the first
 * phrase is shown, still.
 */
export function Typewriter({ phrases, typeSpeed = 70, deleteSpeed = 35, holdTime = 2000, gapTime = 450, startDelay = 350 }: TypewriterProps) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [length, setLength] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const started = useRef(false);

  useEffect(() => {
    if (reduceMotion) return;
    const phrase = phrases[index];
    let delay: number;
    let step: () => void;
    if (phase === "typing") {
      if (length < phrase.length) {
        delay = started.current ? typeSpeed : startDelay;
        step = () => {
          started.current = true;
          setLength(length + 1);
        };
      } else {
        delay = 0;
        step = () => setPhase("holding");
      }
    } else if (phase === "holding") {
      // A single phrase just stays put once typed.
      if (phrases.length < 2) return;
      delay = holdTime;
      step = () => setPhase("deleting");
    } else if (length > 0) {
      delay = deleteSpeed;
      step = () => setLength(length - 1);
    } else {
      delay = gapTime;
      step = () => {
        setIndex((index + 1) % phrases.length);
        setPhase("typing");
      };
    }
    const timer = window.setTimeout(step, delay);
    return () => window.clearTimeout(timer);
  }, [reduceMotion, phrases, index, length, phase, typeSpeed, deleteSpeed, holdTime, gapTime, startDelay]);

  const idle = phase === "holding" || (phase === "deleting" && length === 0);

  return (
    <>
      <span className="sr-only">{phrases.join(". ")}</span>
      <span className="grid" aria-hidden="true">
        {phrases.map((phrase) => <span key={phrase} className="invisible col-start-1 row-start-1">{phrase}</span>)}
        <span className="col-start-1 row-start-1">
          {reduceMotion ? phrases[0] : phrases[index].slice(0, length)}
          {/* Negative right margin cancels the caret's width so the typed line wraps exactly like the full phrase. */}
          {!reduceMotion && <span className={`${idle ? "typing-caret " : ""}ml-[0.06em] -mr-[0.14em] inline-block h-[0.9em] w-[0.08em] translate-y-[0.08em] rounded-full bg-current`} />}
        </span>
      </span>
    </>
  );
}
