import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { type PointerEvent, type ReactNode, useRef } from "react";

type MagneticProps = {
  children: ReactNode;
  className?: string;
  strength?: number;
};

/** Motion-value adaptation of the React Bits Magnet interaction. */
export function Magnetic({ children, className = "", strength = 0.18 }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 22, mass: 0.42 });
  const springY = useSpring(y, { stiffness: 260, damping: 22, mass: 0.42 });

  const handlePointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    if (reduceMotion || event.pointerType === "touch" || !ref.current) return;
    const bounds = ref.current.getBoundingClientRect();
    x.set((event.clientX - bounds.left - bounds.width / 2) * strength);
    y.set((event.clientY - bounds.top - bounds.height / 2) * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.span
      ref={ref}
      className={`magnetic-target ${className}`.trim()}
      style={reduceMotion ? undefined : { x: springX, y: springY }}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      onBlur={reset}
    >
      {children}
    </motion.span>
  );
}
