import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  getDecryptedTransitionFrame,
  translatePortfolioText,
  usePortfolioLanguage,
} from "../../i18n/PortfolioLanguage";

type BlurTextProps = {
  text: string;
  className?: string;
  delay?: number;
  crossFadeTransition?: boolean;
};

/** Lightweight Motion adaptation of React Bits BlurText for short display lines. */
export function BlurText({
  text,
  className = "",
  delay = 0,
  crossFadeTransition = false,
}: BlurTextProps) {
  const { language } = usePortfolioLanguage();
  const resolvedText = language === "en" ? translatePortfolioText(text) : text;
  const reduceMotion = useReducedMotion();
  const [displayText, setDisplayText] = useState(resolvedText);
  const [transitionProgress, setTransitionProgress] = useState(1);
  const displayRef = useRef(resolvedText);
  const targetRef = useRef(resolvedText);
  const frameRef = useRef<number | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    if (targetRef.current === resolvedText) return;
    targetRef.current = resolvedText;
    setTransitionProgress(0);
    if (reduceMotion) {
      displayRef.current = resolvedText;
      setDisplayText(resolvedText);
      setTransitionProgress(1);
      return;
    }

    const from = displayRef.current;
    const startedAt = performance.now();
    const update = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / 620);
      const next = getDecryptedTransitionFrame(from, resolvedText, progress);
      displayRef.current = next;
      setDisplayText(next);
      setTransitionProgress(progress);
      if (progress < 1) frameRef.current = window.requestAnimationFrame(update);
      else frameRef.current = null;
    };
    frameRef.current = window.requestAnimationFrame(update);
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [reduceMotion, resolvedText]);

  if (reduceMotion) return <span className={className}>{resolvedText}</span>;

  const crossFadeOpacity = transitionProgress < 0.5
    ? 1 - transitionProgress * 2
    : (transitionProgress - 0.5) * 2;

  return (
    <span
      className={`blur-text${crossFadeTransition ? " has-language-crossfade" : ""} ${className}`.trim()}
      style={crossFadeTransition ? {
        opacity: crossFadeOpacity,
        filter: `blur(${(1 - crossFadeOpacity) * 3}px)`,
      } : undefined}
    >
      <span className="sr-only">{resolvedText}</span>
      {Array.from(displayText).map((character, index) => (
        <motion.span
          key={index}
          aria-hidden="true"
          initial={mountedRef.current ? false : { opacity: 0, y: 30, filter: "blur(12px)", rotateX: -34 }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)", rotateX: 0 }}
          transition={{
            duration: 0.62,
            delay: delay + index * 0.038,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {character === " " ? "\u00a0" : character}
        </motion.span>
      ))}
    </span>
  );
}
