import { motion, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { Link } from "wouter";
import type { BlogPost } from "../blog";
import { wrapIndex, type BlogDeck } from "./blogDeck";

// The post list beside the cover deck. In the desktop console it is a looping wheel: the post in the middle is the one
// on the cover, the ones above and below fade and step back with distance, and after the last post comes the first.
// The wheel and the cover both draw themselves from the deck's `focus` (blogDeck.ts), so turning one turns the other.
// Turn it with the scroll wheel or a drag (it coasts, then settles on a post), click a post to bring it to the middle
// (click the middle one to read it), or use Tab / the arrow keys. On narrower layouts it is a plain list.

const ROW = 76; // px per row; matches --blog-wheel-row in styles.css
const BAND_ROWS_ABOVE = 2; // rows of room above the middle band; matches the band's top in styles.css
const WHEEL_LAYOUT = "(min-width: 981px) and (min-height: 681px)"; // the three-column console
const SETTLE_AFTER_MS = 140; // the scroll wheel has gone quiet
const STILL_MS = 80; // a drag that rested this long before release has no speed left to coast on
const DRAG_CLICK_MS = 250; // a click this soon after a drag ends is the drag's own, not a choice
// Two posts show above the middle (the ones already read past) and the rest of the column below it is the posts still
// to come, fading out toward the bottom. The loop wraps where rows can't be seen: just past the top fade, and at the
// furthest row below.
const LOOP_ABOVE = 2.5;
const REACH_BELOW = 4.5;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** A row's opacity at distance `d` from the middle. Either side, the first step down is the same; above, the second
 *  row stays readable and then fades out just before the loop wraps; below, rows fade gently to nothing at `reach`. */
function fadeAt(d: number, above: number, reach: number) {
  if (d >= -1 && d <= 1) return 1 - Math.abs(d) * 0.42;
  if (d > 1) return 0.58 * Math.pow(clamp((reach - d) / (reach - 1), 0, 1), 0.6);
  if (d >= -2) return 0.58 - (-1 - d) * 0.22;
  return clamp(0.36 * (above + d) / (above - 2), 0, 0.36);
}

function WheelRow({ index, count, focus, children }: { index: number; count: number; focus: MotionValue<number>; children: ReactNode }) {
  const above = Math.min(LOOP_ABOVE, count / 2);
  const reach = Math.max(1.5, Math.min(REACH_BELOW, count - above));
  // Distance along the loop, wrapped into [-above, count - above): negative is above the middle.
  const place = useTransform(focus, (f) => wrapIndex(index - f + above, count) - above);
  const y = useTransform(place, (d) => d * ROW);
  const x = useTransform(place, (d) => Math.min(Math.abs(d), 3) * 10);
  const scale = useTransform(place, (d) => 1 - Math.min(Math.abs(d), 3) * 0.05);
  const opacity = useTransform(place, (d) => fadeAt(d, above, reach));
  // Rows too faint to read can't be clicked (they are still in the tab order, and focusing one turns it to the middle).
  const pointerEvents = useTransform(opacity, (o) => (o > 0.2 ? "auto" : "none"));
  return <motion.li className="blog-wheel-row" style={{ y, x, scale, opacity, pointerEvents }}>{children}</motion.li>;
}

type BlogWheelProps = {
  posts: BlogPost[];
  deck: BlogDeck;
  reduceMotion: boolean;
  formatDate: (date: string) => string;
  /** The reader started browsing: a good moment to fetch the other covers. */
  onEngage: () => void;
  introDelay: (index: number) => number;
};

export function BlogWheel({ posts, deck, reduceMotion, formatDate, onEngage, introDelay }: BlogWheelProps) {
  const [wheel, setWheel] = useState(() => typeof window !== "undefined" && window.matchMedia(WHEEL_LAYOUT).matches);
  const listRef = useRef<HTMLOListElement>(null);
  // Handlers outside React's render (native wheel events, timers) read the latest deck through refs.
  const deckRef = useRef(deck);
  deckRef.current = deck;
  const engageRef = useRef(onEngage);
  engageRef.current = onEngage;
  const hoverTimer = useRef(0);
  const pressing = useRef(false); // focus that comes from a pointer press is not a keyboard choice
  const drag = useRef<{ id: number; startY: number; lastY: number; lastT: number; velocity: number; moved: boolean } | null>(null);
  const dragEndedAt = useRef(-Infinity);
  const count = posts.length;

  useEffect(() => {
    const query = window.matchMedia(WHEEL_LAYOUT);
    const sync = () => setWheel(query.matches);
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  // Line the wheel's middle band up with the middle of the cover. The heading above the wheel moves with it (the whole
  // column's content shifts), but never closer than 24px to the top of its column. Then let the wheel run on down to
  // the bottom of the column, so the posts to come fill it.
  useEffect(() => {
    const list = listRef.current;
    const column = list?.parentElement;
    const pile = document.querySelector<HTMLElement>(".blog-console-portrait");
    if (!wheel || !list || !column || !pile) return;
    column.dataset.wheelHost = "true";
    const align = () => {
      column.style.setProperty("--blog-wheel-shift", "0px");
      list.style.setProperty("--blog-wheel-extra", "0px");
      const cover = pile.querySelector<HTMLElement>(".blog-cover-sheet.is-active");
      const first = column.firstElementChild;
      if (!cover || !first) return;
      const coverBox = cover.getBoundingClientRect();
      const listBox = list.getBoundingClientRect();
      const columnBox = column.getBoundingClientRect();
      const band = listBox.top + BAND_ROWS_ABOVE * ROW + ROW / 2;
      const room = first.getBoundingClientRect().top - (columnBox.top + 24);
      const shift = Math.round(Math.max(coverBox.top + coverBox.height / 2 - band, -room));
      const floor = columnBox.bottom - parseFloat(getComputedStyle(column).paddingBottom || "0");
      // Neither the shifted wheel nor its unshifted box may run past the column's bottom.
      const extra = Math.max(0, Math.floor(floor - listBox.bottom - Math.max(shift, 0)));
      column.style.setProperty("--blog-wheel-shift", `${shift}px`);
      list.style.setProperty("--blog-wheel-extra", `${extra}px`);
    };
    // Measured at rest: now, again once the page's entrance motion (the cover column eases in from a slight zoom) has
    // finished, and whenever the frame or the column changes size.
    const frame = window.requestAnimationFrame(align);
    const afterIntro = window.setTimeout(align, 900);
    const observer = new ResizeObserver(align);
    observer.observe(pile);
    observer.observe(column);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(afterIntro);
      observer.disconnect();
      delete column.dataset.wheelHost;
      column.style.removeProperty("--blog-wheel-shift");
      list.style.removeProperty("--blog-wheel-extra");
    };
  }, [wheel]);

  // The scroll wheel turns the wheel (a native listener: React's is passive and can't keep the page from scrolling).
  useEffect(() => {
    const list = listRef.current;
    if (!wheel || !list) return;
    let quiet = 0;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const pixels = event.deltaMode === 1 ? event.deltaY * 40 : event.deltaMode === 2 ? event.deltaY * list.clientHeight : event.deltaY;
      engageRef.current();
      deckRef.current.nudge(pixels / ROW);
      window.clearTimeout(quiet);
      quiet = window.setTimeout(() => deckRef.current.settle(), SETTLE_AFTER_MS);
    };
    list.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      list.removeEventListener("wheel", onWheel);
      window.clearTimeout(quiet);
    };
  }, [wheel]);

  const handlePointerDown = (event: PointerEvent<HTMLOListElement>) => {
    pressing.current = true;
    if (!wheel || event.button !== 0) return;
    drag.current = { id: event.pointerId, startY: event.clientY, lastY: event.clientY, lastT: performance.now(), velocity: 0, moved: false };
  };

  const handlePointerMove = (event: PointerEvent<HTMLOListElement>) => {
    const state = drag.current;
    if (!state || event.pointerId !== state.id) return;
    if (!state.moved) {
      if (Math.abs(event.clientY - state.startY) < 5) return;
      state.moved = true;
      engageRef.current();
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Capture keeps the drag going outside the list; without it the drag still works inside.
      }
    }
    const now = performance.now();
    const posts = -(event.clientY - state.lastY) / ROW; // dragging up brings later posts to the middle
    const seconds = Math.max(1, now - state.lastT) / 1000;
    state.velocity = state.velocity * 0.5 + (posts / seconds) * 0.5;
    state.lastY = event.clientY;
    state.lastT = now;
    deck.drag(posts);
  };

  const endPointer = (event: PointerEvent<HTMLOListElement>) => {
    window.setTimeout(() => {
      pressing.current = false;
    }, 0);
    const state = drag.current;
    if (!state || event.pointerId !== state.id) return;
    drag.current = null;
    if (!state.moved) return;
    dragEndedAt.current = performance.now();
    deck.settle(performance.now() - state.lastT > STILL_MS ? 0 : state.velocity);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLOListElement>) => {
    if (!wheel || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
    event.preventDefault();
    deck.step(event.key === "ArrowDown" ? 1 : -1);
    const index = deckRef.current.targetIndex();
    window.requestAnimationFrame(() => listRef.current?.querySelectorAll<HTMLAnchorElement>("a")[index]?.focus({ preventScroll: true }));
  };

  const handleClick = (event: MouseEvent<HTMLAnchorElement>, index: number) => {
    if (performance.now() - dragEndedAt.current < DRAG_CLICK_MS) {
      event.preventDefault();
      return;
    }
    if (!wheel || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    // Only the post in the middle (or on its way there) opens; any other is brought to the middle first.
    if (index === deck.targetIndex()) return;
    event.preventDefault();
    deck.goTo(index);
  };

  const previewOnHover = (index: number) => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => deckRef.current.goTo(index), 40);
  };

  return (
    <ol
      ref={listRef}
      className="blog-index-list"
      data-wheel={wheel ? "true" : undefined}
      aria-labelledby="blog-index-heading"
      onPointerEnter={() => engageRef.current()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onKeyDown={handleKeyDown}
    >
      {posts.map((post, index) => {
        const link = (
          <Link
            className={index === deck.active ? "is-active" : undefined}
            to={`/blog/${post.slug}`}
            data-blog-slug={post.slug}
            draggable={false}
            onClick={(event) => handleClick(event, index)}
            // As a plain list, hovering previews the post on the cover; the wheel is turned instead.
            onPointerEnter={(event) => {
              if (!wheel && event.pointerType !== "touch") previewOnHover(index);
            }}
            onPointerLeave={() => window.clearTimeout(hoverTimer.current)}
            onPointerCancel={() => window.clearTimeout(hoverTimer.current)}
            onFocus={() => {
              window.clearTimeout(hoverTimer.current);
              if (!pressing.current) deck.goTo(index);
            }}
          >
            <time dateTime={post.date.replaceAll(".", "-")}>{formatDate(post.date)}</time>
            <strong>{post.title}</strong>
            <span>{post.category}</span>
          </Link>
        );
        return wheel ? (
          <WheelRow key={post.slug} index={index} count={count} focus={deck.focus}>{link}</WheelRow>
        ) : (
          <motion.li
            key={post.slug}
            initial={reduceMotion ? false : { opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.5, delay: introDelay(index), ease: [0.16, 1, 0.3, 1] }}
          >
            {link}
          </motion.li>
        );
      })}
    </ol>
  );
}
