import { motion, useReducedMotion } from "motion/react";

type BlurTextProps = {
  text: string;
  className?: string;
  delay?: number;
};

/** Lightweight Motion adaptation of React Bits BlurText for short display lines. */
export function BlurText({ text, className = "", delay = 0 }: BlurTextProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <span className={className}>{text}</span>;

  return (
    <span className={`blur-text ${className}`.trim()}>
      <span className="sr-only">{text}</span>
      {Array.from(text).map((character, index) => (
        <motion.span
          key={`${character}-${index}`}
          aria-hidden="true"
          initial={{ opacity: 0, y: 30, filter: "blur(12px)", rotateX: -34 }}
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
