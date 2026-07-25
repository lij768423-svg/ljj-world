import { useReducedMotion } from "motion/react";
import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";

export type PixelRevealHandle = {
  revealAt: (clientX: number, clientY: number) => void;
  release: () => void;
};

type RevealState = {
  width: number;
  height: number;
  columns: number;
  rows: number;
  strengths: Float32Array;
  coverColor: string;
  frame: number | null;
  lastFrameAt: number;
  lastPointer: { x: number; y: number; at: number } | null;
};

const CELL_SIZE = 24;
const REVEAL_RADIUS = 72;
const TRAIL_LIFETIME = 1050;

const revealImages = [
  "/assets/408-quiz-800.webp",
  "/assets/408-harmony-800.webp",
  "/assets/law-home-800.webp",
  "/assets/hardware-control-800.webp",
];

/**
 * Canvas 2D adaptation of React Bits PixelTrail and PixelTransition.
 * Copyright (c) 2026 David Haz, MIT + Commons Clause License Condition v1.0.
 */
export const PixelReveal = forwardRef<PixelRevealHandle>(function PixelReveal(_, ref) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<RevealState | null>(null);
  const revealAtRef = useRef<(clientX: number, clientY: number) => void>(() => undefined);
  const releaseRef = useRef<() => void>(() => undefined);
  const reduceMotion = useReducedMotion();

  useImperativeHandle(ref, () => ({
    revealAt: (clientX, clientY) => revealAtRef.current(clientX, clientY),
    release: () => releaseRef.current(),
  }), []);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!wrapper || !canvas || !context || reduceMotion) return;

    const readCoverColor = () => {
      return getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#f3f4f1";
    };

    const draw = (timestamp: number) => {
      const state = stateRef.current;
      if (!state) return;
      const elapsed = state.lastFrameAt > 0 ? Math.min(timestamp - state.lastFrameAt, 200) : 0;
      state.lastFrameAt = timestamp;

      context.globalCompositeOperation = "source-over";
      context.globalAlpha = 1;
      context.clearRect(0, 0, state.width, state.height);
      context.fillStyle = state.coverColor;
      context.fillRect(0, 0, state.width, state.height);

      context.globalCompositeOperation = "destination-out";
      let hasVisibleTrail = false;
      const inset = 1.25;

      for (let index = 0; index < state.strengths.length; index += 1) {
        const strength = Math.max(0, state.strengths[index] - elapsed / TRAIL_LIFETIME);
        state.strengths[index] = strength;
        if (strength <= 0.01) continue;
        hasVisibleTrail = true;

        const column = index % state.columns;
        const row = Math.floor(index / state.columns);
        const eased = 1 - (1 - Math.min(strength, 1)) ** 3;
        context.globalAlpha = eased;
        context.fillRect(
          column * CELL_SIZE + inset,
          row * CELL_SIZE + inset,
          CELL_SIZE - inset * 2,
          CELL_SIZE - inset * 2,
        );
      }

      context.globalCompositeOperation = "source-over";
      context.globalAlpha = 1;
      if (hasVisibleTrail) {
        state.frame = window.requestAnimationFrame(draw);
      } else {
        state.frame = null;
        state.lastFrameAt = 0;
      }
    };

    const resize = () => {
      const bounds = wrapper.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, bounds.width);
      const height = Math.max(1, bounds.height);
      const columns = Math.ceil(width / CELL_SIZE);
      const rows = Math.ceil(height / CELL_SIZE);
      const previousFrame = stateRef.current?.frame;
      if (previousFrame !== null && previousFrame !== undefined) window.cancelAnimationFrame(previousFrame);

      canvas.width = Math.ceil(width * pixelRatio);
      canvas.height = Math.ceil(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      stateRef.current = {
        width,
        height,
        columns,
        rows,
        strengths: new Float32Array(columns * rows),
        coverColor: readCoverColor(),
        frame: null,
        lastFrameAt: 0,
        lastPointer: null,
      };
      draw(performance.now());
    };

    const stamp = (x: number, y: number) => {
      const state = stateRef.current;
      if (!state) return;
      const startColumn = Math.max(0, Math.floor((x - REVEAL_RADIUS) / CELL_SIZE));
      const endColumn = Math.min(state.columns - 1, Math.ceil((x + REVEAL_RADIUS) / CELL_SIZE));
      const startRow = Math.max(0, Math.floor((y - REVEAL_RADIUS) / CELL_SIZE));
      const endRow = Math.min(state.rows - 1, Math.ceil((y + REVEAL_RADIUS) / CELL_SIZE));

      for (let row = startRow; row <= endRow; row += 1) {
        for (let column = startColumn; column <= endColumn; column += 1) {
          const centerX = (column + 0.5) * CELL_SIZE;
          const centerY = (row + 0.5) * CELL_SIZE;
          const distance = Math.hypot(centerX - x, centerY - y);
          if (distance > REVEAL_RADIUS) continue;
          const noise = ((column * 17 + row * 29) % 11) / 10;
          const strength = Math.min(1, Math.max(0, (1 - distance / REVEAL_RADIUS) * 1.24 + noise * 0.12));
          const index = row * state.columns + column;
          state.strengths[index] = Math.max(state.strengths[index], strength);
        }
      }
    };

    revealAtRef.current = (clientX, clientY) => {
      const state = stateRef.current;
      if (!state) return;
      const bounds = wrapper.getBoundingClientRect();
      const x = clientX - bounds.left;
      const y = clientY - bounds.top;
      if (x < 0 || y < 0 || x > bounds.width || y > bounds.height) return;

      const now = performance.now();
      const previous = state.lastPointer;
      const shouldInterpolate = previous && now - previous.at < 120;
      const distance = shouldInterpolate ? Math.hypot(x - previous.x, y - previous.y) : 0;
      const steps = Math.min(24, Math.max(1, Math.ceil(distance / (CELL_SIZE * 0.55))));
      for (let step = 1; step <= steps; step += 1) {
        const progress = step / steps;
        stamp(
          shouldInterpolate ? previous.x + (x - previous.x) * progress : x,
          shouldInterpolate ? previous.y + (y - previous.y) * progress : y,
        );
      }
      state.lastPointer = { x, y, at: now };
      if (state.frame === null) {
        state.lastFrameAt = now;
        state.frame = window.requestAnimationFrame(draw);
      }
    };

    releaseRef.current = () => {
      if (stateRef.current) stateRef.current.lastPointer = null;
    };

    const resizeObserver = new ResizeObserver(resize);
    const themeObserver = new MutationObserver(() => {
      const state = stateRef.current;
      if (!state) return;
      state.coverColor = readCoverColor();
      draw(performance.now());
    });
    resizeObserver.observe(wrapper);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    resize();

    return () => {
      resizeObserver.disconnect();
      themeObserver.disconnect();
      const state = stateRef.current;
      if (state?.frame !== null && state?.frame !== undefined) window.cancelAnimationFrame(state.frame);
      stateRef.current = null;
      revealAtRef.current = () => undefined;
      releaseRef.current = () => undefined;
    };
  }, [reduceMotion]);

  if (reduceMotion) return null;

  return (
    <div ref={wrapperRef} className="pixel-reveal-layer" aria-hidden="true">
      <div className="pixel-reveal-underlay">
        <div className="pixel-reveal-collage">
          {revealImages.map((image) => <img key={image} src={image} alt="" draggable="false" />)}
        </div>
      </div>
      <canvas ref={canvasRef} className="pixel-reveal-canvas" />
    </div>
  );
});
