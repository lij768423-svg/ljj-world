import { useAnimationFrame, useReducedMotion } from "motion/react";
import { type PointerEvent, useRef } from "react";

// Letters near a focus point turn heavy and the rest stay light. The target
// weight follows a Gaussian around the focus and each letter's actual weight
// springs toward it. Over the line the pointer sets the focus; otherwise the
// focus glides from end to end by itself. The font needs a weight axis (Geist
// has 100-900); CJK fallbacks only ship a few fixed weights, so use Latin text.

// Springs are stiffness / damping with mass 1, the same values as the reference.
const letterSpring = { stiffness: 260, damping: 22 };
const focusSpring = { stiffness: 150, damping: 22 };
const light = 300;
const bold = 820;
const spread = 0.13; // width of the swell, as a share of the line
const sweepSeconds = 4.6;
const substeps = 4;

type Spring = { x: number; v: number; target: number; stiffness: number; damping: number };

function createSpring(x: number, { stiffness, damping }: { stiffness: number; damping: number }): Spring {
  return { x, v: 0, target: x, stiffness, damping };
}

function stepSpring(spring: Spring, dt: number) {
  const acceleration = -spring.stiffness * (spring.x - spring.target) - spring.damping * spring.v;
  spring.v += acceleration * dt;
  spring.x += spring.v * dt;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

type WeightWaveProps = {
  text: string;
  className?: string;
};

export function WeightWave({ text, className = "" }: WeightWaveProps) {
  const reduceMotion = useReducedMotion();
  const characters = [...text];
  const lineRef = useRef<HTMLSpanElement>(null);
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const wave = useRef({
    letters: characters.map(() => createSpring(light, letterSpring)),
    focus: createSpring(-0.2, focusSpring), // 0 = left end of the line, 1 = right end
    hovering: false,
    sweep: 0,
  });

  useAnimationFrame((_, delta) => {
    const line = lineRef.current;
    if (reduceMotion || !line) return;
    const state = wave.current;
    const dt = Math.min(delta / 1000, 1 / 30);

    if (!state.hovering) {
      state.sweep += dt;
      state.focus.target = -0.06 + 1.12 * (0.5 - 0.5 * Math.cos((state.sweep * Math.PI * 2) / sweepSeconds));
    }
    for (let index = 0; index < substeps; index += 1) {
      stepSpring(state.focus, dt / substeps);
      state.letters.forEach((letter) => stepSpring(letter, dt / substeps));
    }

    // Measure all letters before changing any weight: one layout pass per frame.
    const total = line.offsetWidth || 1;
    const centres = letterRefs.current.map((element) => (element ? (element.offsetLeft + element.offsetWidth / 2) / total : 0));
    state.letters.forEach((letter, index) => {
      const element = letterRefs.current[index];
      if (!element) return;
      const distance = (centres[index] - state.focus.x) / spread;
      letter.target = light + (bold - light) * Math.exp(-distance * distance);
      element.style.fontWeight = clamp(letter.x, 100, 900).toFixed(1);
      element.style.opacity = (0.42 + 0.58 * clamp((letter.x - light) / (bold - light), 0, 1)).toFixed(3);
    });
  });

  const handlePointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    const line = lineRef.current;
    if (!line) return;
    const bounds = line.getBoundingClientRect();
    wave.current.hovering = true;
    wave.current.focus.target = (event.clientX - bounds.left) / (bounds.width || 1);
  };

  const handlePointerLeave = () => {
    wave.current.hovering = false;
    wave.current.sweep = 0;
  };

  return (
    // A div, not a p, so paragraph rules of the surrounding copy don't restyle it.
    <div className={`weight-wave ${reduceMotion ? "is-static" : ""} ${className}`.trim()} data-no-translate>
      <span className="sr-only">{text}</span>
      <span
        ref={lineRef}
        className="weight-wave-line"
        aria-hidden="true"
        onPointerMove={reduceMotion ? undefined : handlePointerMove}
        onPointerLeave={reduceMotion ? undefined : handlePointerLeave}
      >
        {characters.map((character, index) => (
          <span
            key={`${character}-${index}`}
            ref={(element) => {
              letterRefs.current[index] = element;
            }}
            className="weight-wave-letter"
          >
            {character}
          </span>
        ))}
      </span>
    </div>
  );
}
