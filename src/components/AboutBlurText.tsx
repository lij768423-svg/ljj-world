import { useReducedMotion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

export function AboutBlurText({ text, delay = 0, children }: { text?: string; delay?: number; children?: ReactNode }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <span>{children ?? text}</span>;

  const revealDelay = Math.min(0.66, 0.05 + delay * 0.22);
  return (
    <span
      className="about-blur-text"
      style={{ "--about-reveal-delay": `${revealDelay}s` } as CSSProperties}
    >
      {children ?? text}
    </span>
  );
}
