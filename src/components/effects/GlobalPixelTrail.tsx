import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

type TrailState = {
  width: number;
  height: number;
  columns: number;
  rows: number;
  strengths: Float32Array;
  targetStrengths: Float32Array;
  activeCells: Set<number>;
  dirtyBounds: { left: number; top: number; right: number; bottom: number } | null;
  frame: number | null;
  lastFrameAt: number;
  lastPointer: { x: number; y: number; at: number } | null;
};

const CELL_SIZE = 24;
const REVEAL_RADIUS = 54;
const TRAIL_LIFETIME = 1050;
const DESKTOP_MIN_WIDTH = 1080;
const TRAIL_BLOCK_SELECTOR = [
  "[data-trail-occluder]",
  ".project-card-surface",
  ".favorite-project",
  ".project-paper-sheet",
].join(",");

export function GlobalPixelTrail({ enabled = true }: { enabled?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<TrailState | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || reduceMotion || !enabled) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let trailColor = "#b93b28";

    const readTheme = () => {
      const styles = getComputedStyle(document.documentElement);
      trailColor = styles.getPropertyValue("--kinetic-trail-color").trim()
        || styles.getPropertyValue("--accent").trim()
        || "#b93b28";
    };

    const draw = (timestamp: number) => {
      const state = stateRef.current;
      if (!state) return;
      const elapsed = state.lastFrameAt > 0 ? Math.min(timestamp - state.lastFrameAt, 200) : 0;
      state.lastFrameAt = timestamp;
      if (state.dirtyBounds) {
        const { left, top, right, bottom } = state.dirtyBounds;
        context.clearRect(left, top, right - left, bottom - top);
      }

      let hasVisibleTrail = false;
      let nextLeft = state.width;
      let nextTop = state.height;
      let nextRight = 0;
      let nextBottom = 0;
      const inset = 1.25;
      context.fillStyle = trailColor;

      for (const index of state.activeCells) {
        const targetStrength = Math.max(0, state.targetStrengths[index] - elapsed / TRAIL_LIFETIME);
        const currentStrength = state.strengths[index];
        const responseMs = targetStrength > currentStrength ? 80 : 150;
        const smoothing = 1 - Math.exp(-elapsed / responseMs);
        const strength = currentStrength + (targetStrength - currentStrength) * smoothing;
        state.targetStrengths[index] = targetStrength;
        state.strengths[index] = strength;
        if (strength <= 0.01 && targetStrength <= 0.01) {
          state.activeCells.delete(index);
          continue;
        }
        hasVisibleTrail = true;

        const column = index % state.columns;
        const row = Math.floor(index / state.columns);
        const x = column * CELL_SIZE + inset;
        const y = row * CELL_SIZE + inset;
        const size = CELL_SIZE - inset * 2;
        const eased = 1 - (1 - Math.min(strength, 1)) ** 3;
        const texture = 0.82 + ((column * 17 + row * 29) % 11) / 60;
        context.globalAlpha = eased * 0.34 * texture;
        context.fillRect(x, y, size, size);
        nextLeft = Math.min(nextLeft, x);
        nextTop = Math.min(nextTop, y);
        nextRight = Math.max(nextRight, x + size);
        nextBottom = Math.max(nextBottom, y + size);
      }

      context.globalAlpha = 1;
      state.dirtyBounds = hasVisibleTrail
        ? { left: nextLeft - 1, top: nextTop - 1, right: nextRight + 1, bottom: nextBottom + 1 }
        : null;
      if (hasVisibleTrail) {
        state.frame = window.requestAnimationFrame(draw);
      } else {
        state.frame = null;
        state.lastFrameAt = 0;
      }
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = 1;
      const width = Math.max(1, bounds.width);
      const height = Math.max(1, bounds.height);
      const previousFrame = stateRef.current?.frame;
      if (previousFrame !== null && previousFrame !== undefined) window.cancelAnimationFrame(previousFrame);

      canvas.width = Math.ceil(width * pixelRatio);
      canvas.height = Math.ceil(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      stateRef.current = {
        width,
        height,
        columns: Math.ceil(width / CELL_SIZE),
        rows: Math.ceil(height / CELL_SIZE),
        strengths: new Float32Array(Math.ceil(width / CELL_SIZE) * Math.ceil(height / CELL_SIZE)),
        targetStrengths: new Float32Array(Math.ceil(width / CELL_SIZE) * Math.ceil(height / CELL_SIZE)),
        activeCells: new Set<number>(),
        dirtyBounds: null,
        frame: null,
        lastFrameAt: 0,
        lastPointer: null,
      };
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
          const strength = Math.min(1, Math.max(0, (1 - distance / REVEAL_RADIUS) * 1.18));
          const index = row * state.columns + column;
          state.targetStrengths[index] = Math.max(state.targetStrengths[index], strength);
          state.activeCells.add(index);
        }
      }
    };

    const release = () => {
      if (stateRef.current) stateRef.current.lastPointer = null;
    };

    const handlePointerMove = (event: PointerEvent) => {
      const state = stateRef.current;
      if (
        !state
        || !event.isPrimary
        || event.pointerType === "touch"
        || !finePointer.matches
        || window.innerWidth <= DESKTOP_MIN_WIDTH
      ) return;

      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest(`.hero-intro,${TRAIL_BLOCK_SELECTOR}`)) {
        release();
        return;
      }

      const bounds = canvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      if (x < 0 || y < 0 || x > bounds.width || y > bounds.height) {
        release();
        return;
      }

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

    readTheme();
    resize();

    const themeObserver = new MutationObserver(readTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("blur", release);
    document.documentElement.addEventListener("pointerleave", release);

    return () => {
      themeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", release);
      document.documentElement.removeEventListener("pointerleave", release);
      const state = stateRef.current;
      if (state?.frame !== null && state?.frame !== undefined) window.cancelAnimationFrame(state.frame);
      stateRef.current = null;
    };
  }, [enabled, reduceMotion]);

  if (reduceMotion || !enabled) return null;
  return <canvas ref={canvasRef} className="global-pixel-trail" aria-hidden="true" />;
}
