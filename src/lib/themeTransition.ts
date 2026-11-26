import type { ThemeMode } from "../App";

// A theme switch from the header toggle opens the new theme as a circle from the middle of the viewport until it
// covers the farthest corner. The browser freezes the old page as a picture underneath, and the live new page is
// clipped by the growing circle above it (see the theme-circle rules in effects.css).
//
// Only the toggle uses this. One switch runs at a time: clicks that arrive while one is preparing or playing are
// dropped, so nothing queues up and replays.

type Preparer = (next: ThemeMode) => Promise<void> | void;

type ViewTransitionLike = { finished: Promise<void> };
type DocumentWithViewTransition = Document & {
  startViewTransition?: (update: () => void) => ViewTransitionLike;
};

const PREPARE_LIMIT_MS = 300;
const SWITCHING_CLASS = "theme-circle-switching";

const preparers = new Set<Preparer>();
let busy = false;

/** Lets a component get ready for the next theme (e.g. decode a picture) before the circle starts. */
export function registerThemePreparer(preparer: Preparer) {
  preparers.add(preparer);
  return () => { preparers.delete(preparer); };
}

function prepare(next: ThemeMode) {
  if (preparers.size === 0) return Promise.resolve();
  const ready = Promise.all([...preparers].map((preparer) => {
    try {
      return Promise.resolve(preparer(next)).catch(() => undefined);
    } catch {
      return undefined;
    }
  }));
  return Promise.race([ready, new Promise((resolve) => window.setTimeout(resolve, PREPARE_LIMIT_MS))]).then(() => undefined);
}

function canAnimate() {
  const doc = document as DocumentWithViewTransition;
  if (typeof doc.startViewTransition !== "function") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  // The desk page plays its own wipe when the theme changes.
  if (document.documentElement.classList.contains("desk-route-root")) return false;
  return true;
}

/**
 * Applies `apply` (which must update the theme synchronously, e.g. through flushSync) with the circle reveal when
 * possible, or right away otherwise. Returns false when the request was ignored because a switch is still running.
 */
export function switchThemeWithCircle(next: ThemeMode, apply: () => void): boolean {
  if (busy) return false;
  if (!canAnimate()) {
    apply();
    return true;
  }

  busy = true;
  const root = document.documentElement;
  const release = () => {
    root.classList.remove(SWITCHING_CLASS);
    busy = false;
  };

  void prepare(next).then(() => {
    if (!canAnimate()) {
      apply();
      release();
      return;
    }
    const radius = Math.ceil(Math.hypot(window.innerWidth / 2, window.innerHeight / 2));
    root.style.setProperty("--theme-circle-radius", `${radius}px`);
    root.classList.add(SWITCHING_CLASS);
    try {
      const transition = (document as DocumentWithViewTransition).startViewTransition!(apply);
      transition.finished.catch(() => undefined).then(release);
    } catch {
      apply();
      release();
    }
  });
  return true;
}
