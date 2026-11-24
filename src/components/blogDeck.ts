import { animate, useMotionValue, useMotionValueEvent, type MotionValue } from "motion/react";
import { useCallback, useMemo, useRef, useState } from "react";

// The blog index's one moving value: `focus`, the (fractional) position of the post on top, counted along a loop of
// the posts (it keeps growing or shrinking past the post count; post = focus mod count). The cover deck
// (BlogCoverStack) and the list wheel (BlogWheel) both draw themselves from it, so they always move together, and a
// drag or a scroll moves it directly. Choices glide on one critically damped spring and retarget mid-way.

const DECK_SPRING = { type: "spring" as const, stiffness: 170, damping: 26 };
// Scroll-wheel steps arrive in bursts; a stiffer spring smooths them without lagging behind the hand.
const NUDGE_SPRING = { type: "spring" as const, stiffness: 320, damping: 38 };
const MOMENTUM_S = 0.16; // how far a released drag coasts, as seconds of its last speed
const REST_NEAR = 0.25; // a glide this close to its post counts as arrived: the old words fade out over its last stretch

export const wrapIndex = (value: number, count: number) => ((value % count) + count) % count;

export type BlogDeck = {
  focus: MotionValue<number>;
  /** The post on top right now (nearest to focus). */
  active: number;
  /** The post the deck last came to rest on. It holds still while the deck is being scrolled or dragged through other
   *  posts, and changes once a glide has (nearly) arrived: what the words about "this post" should show. */
  resting: number;
  /** The post the deck is heading to (equal to `active` once it has settled). */
  targetIndex: () => number;
  /** Go to a post the short way round the loop. */
  goTo: (index: number) => void;
  /** Go a number of posts on (negative: back). */
  step: (by: number) => void;
  /** A swipe threw the top sheet away: continue from `risen` (0-1) of the way to the next post, then settle on it. */
  handOff: (risen: number) => void;
  /** Scroll-wheel input: move by a number of posts, smoothed. Call `settle` when the wheel goes quiet. */
  nudge: (posts: number) => void;
  /** Drag input: move by a number of posts, directly under the pointer. */
  drag: (posts: number) => void;
  /** Come to rest on the nearest post, coasting on `velocity` (posts per second) first. */
  settle: (velocity?: number) => void;
};

export function useBlogDeck(count: number, reduceMotion: boolean): BlogDeck {
  const focus = useMotionValue(0);
  const target = useRef(0);
  // True while the deck glides to a post of its own accord; false while it follows the scroll wheel or a drag.
  const gliding = useRef(false);
  const [active, setActive] = useState(0);
  const [resting, setResting] = useState(0);

  useMotionValueEvent(focus, "change", (value) => {
    const next = wrapIndex(Math.round(value), count);
    setActive((current) => (current === next ? current : next));
    if (gliding.current && Math.abs(value - target.current) < REST_NEAR) {
      const arrived = wrapIndex(Math.round(target.current), count);
      setResting((current) => (current === arrived ? current : arrived));
    }
  });

  const glide = useCallback((to: number, velocity?: number) => {
    target.current = to;
    gliding.current = true;
    // Already there (a scroll or drag that stopped right on a post): there will be no motion to report the arrival.
    if (reduceMotion || Math.abs(focus.get() - to) < REST_NEAR) setResting(wrapIndex(Math.round(to), count));
    if (reduceMotion) {
      focus.jump(to);
      setActive(wrapIndex(Math.round(to), count));
      return;
    }
    animate(focus, to, velocity === undefined ? DECK_SPRING : { ...DECK_SPRING, velocity });
  }, [count, focus, reduceMotion]);

  return useMemo<BlogDeck>(() => ({
    focus,
    active,
    resting,
    targetIndex: () => wrapIndex(Math.round(target.current), count),
    goTo: (index) => {
      const base = Math.round(target.current);
      let delta = wrapIndex(index - wrapIndex(base, count), count);
      if (delta > count / 2) delta -= count;
      glide(base + delta);
    },
    step: (by) => glide(Math.round(target.current) + by),
    handOff: (risen) => {
      const base = Math.round(target.current);
      focus.jump(base + risen);
      glide(base + 1);
    },
    nudge: (posts) => {
      gliding.current = false;
      target.current += posts;
      if (reduceMotion) {
        focus.jump(target.current);
        return;
      }
      animate(focus, target.current, NUDGE_SPRING);
    },
    drag: (posts) => {
      gliding.current = false;
      focus.stop();
      const next = focus.get() + posts;
      target.current = next;
      focus.set(next);
    },
    // After a drag, coast from where the pointer left it; after the scroll wheel, land where the wheel was heading.
    settle: (velocity = 0) => glide(Math.round(velocity ? focus.get() + velocity * MOMENTUM_S : target.current), velocity || undefined),
  }), [active, count, focus, glide, reduceMotion, resting]);
}
