import { animate, motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import type { BlogPost } from "../blog";
import { wrapIndex, type BlogDeck } from "./blogDeck";

// The blog cover as the top sheet of a deck: one sheet per post, in list order, looping (after the last post comes the
// first again), so the pile under the cover never runs out.
//
// One spring drives everything: `focus`, the (fractional) index of the post on top. Every sheet's place, angle and
// opacity follow from its distance to it. Sheets for later posts wait in the pile, fanned out to the right in the
// order they will come up; sheets for earlier posts have slid off to the left and faded. Choosing a post just sends
// focus there, so a new choice mid-way bends the same motion toward the new target instead of queueing a second
// animation, and a long jump flips through the posts in between. Focus lives in blogDeck.ts and is shared with the
// list wheel, so scrolling or dragging the wheel moves the cover in step. Stacking follows each sheet's place in the deck, and
// a sheet only changes place in the stacking order when it wraps from the far back to just passed (or the other
// way), which happens where it is fully transparent, so no sheet can pop from under another while they overlap.
//
// Fan: on a wide screen the pile rests fanned out, so the next covers show beside the current one; the one under the
// pointer slides out a little and clicking it brings that post up. On a phone the pile lies squared up.
//
// Swipe: drag the top sheet sideways. It follows the pointer and tilts around where it was grabbed; the sheets under
// it rise as it goes. Throw it far or fast enough and it flies off, and the next post settles on top. A tap without
// dragging opens the article.
//
// Motion is calm on purpose (an editorial page, motion around 4 of 10 in taste-skill's terms): transform and opacity
// only, motion values outside React renders, one critically damped spring for the deck. The fan and swipe values
// follow designbookmark.com's Fan cards and Swipe deck demos. The code is written for this page.

type Pose = { x: number; y: number; rotate: number }; // x, y in % of the sheet, rotate in degrees
export type CoverFling = { dir: number; vx: number; vy: number };

const SPRING = (stiffness: number, damping: number) => ({ type: "spring" as const, stiffness, damping });
const FAN_SPRING = { stiffness: 220, damping: 18 };
const LIFT_SPRING = { stiffness: 420, damping: 20 };
const SCALE_SPRING = { stiffness: 420, damping: 22 };
const FOLLOW = SPRING(900, 50); // held by the pointer: no overshoot, no lag
const RETURN = SPRING(280, 16); // let go short of the threshold
const THROW = SPRING(70, 17); // thrown: keeps going instead of swinging back
const THROW_PX = 110; // drag this far, or
const THROW_SPEED = 700; // throw this fast (px/s)
const THROW_MS = 420;
const TILT = 0.065; // degrees of tilt per pixel dragged
// A hovered sheet in the fan slides out toward the side it fans to (and grows a touch) rather than lifting up, so it
// never moves out from under the pointer that is on its visible edge.
const LIFT_PX = 18;
const LIFT_SCALE = 1.04;
const FAN_SHRINK = 0.1; // the pile shrinks this much while fanned, so the spread stays near its column
const FAN_SHIFT = 13; // and moves this far left (% of the frame), so cover and fan together sit centred
const VISIBLE_LEVELS = 3; // sheets shown under the cover
// Distances wrap into [PASSED_LIMIT, PASSED_LIMIT + post count). With 7 posts that is -2 (well past, hidden) to 4 (the
// hidden level under the pile), so the wrap always happens out of sight.
const PASSED_LIMIT = -2;

const TOP: Pose = { x: 0, y: 0, rotate: 0 };
// Where earlier posts have gone: slid off to the left.
const OFF_LEFT: Pose = { x: -42, y: 2, rotate: -7 };
// Level 0 is the cover's place, 1-3 the sheets under it, 4 the hidden level a sheet fades in from. Both layouts move
// one way only (down and to the right, further at each level), so a sheet moving up several levels glides in a
// straight sweep instead of zigzagging between sides.
const LEVEL_REST: Pose[] = [
  TOP,
  { x: 1.6, y: 1.8, rotate: 1.1 },
  { x: 3, y: 3.4, rotate: 2 },
  { x: 4.2, y: 4.8, rotate: 2.9 },
  { x: 5.2, y: 6, rotate: 3.6 },
];
const LEVEL_FANNED: Pose[] = [
  TOP,
  { x: 6, y: -1, rotate: 4 },
  { x: 11, y: -0.5, rotate: 7.5 },
  { x: 15.5, y: 0.5, rotate: 10.5 },
  { x: 19, y: 1.5, rotate: 13 },
];

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixPose = (a: Pose, b: Pose, t: number): Pose => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), rotate: mix(a.rotate, b.rotate, t) });
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** A distance along the looping deck, wrapped into [PASSED_LIMIT, PASSED_LIMIT + count). */
function wrapDistance(raw: number, count: number) {
  return ((((raw - PASSED_LIMIT) % count) + count) % count) + PASSED_LIMIT;
}

function along(levels: Pose[], level: number) {
  const at = clamp(level, 0, levels.length - 1);
  const low = Math.floor(at);
  const high = Math.min(levels.length - 1, low + 1);
  return mixPose(levels[low], levels[high], at - low);
}

/**
 * Progress along the slide off the top, shaped so a sheet leaves the top at the speed it arrived with from the pile
 * (`startSlope`, as a share of the full slide per unit of focus) and then gathers pace: no lurch as it crosses the top.
 */
const easeOff = (t: number, startSlope: number) => startSlope * t + (1 - startSlope) * t * t;

/**
 * A sheet `distance` places from the top (negative: already passed): where it sits and how visible it is. Passing
 * off the top it slides left, staying solid for the first half so it reads as paper going away, not a ghost.
 */
function placeAt(distance: number, fan: number): { pose: Pose; opacity: number } {
  if (distance < 0) {
    const gone = Math.min(1, -distance);
    const first = mixPose(LEVEL_REST[1], LEVEL_FANNED[1], fan);
    const pose = {
      x: OFF_LEFT.x * easeOff(gone, clamp(Math.abs(first.x / OFF_LEFT.x), 0, 1)),
      y: OFF_LEFT.y * gone,
      rotate: OFF_LEFT.rotate * easeOff(gone, clamp(Math.abs(first.rotate / OFF_LEFT.rotate), 0, 1)),
    };
    return { pose, opacity: gone <= 0.5 ? 1 : Math.max(0, 1 - (gone - 0.5) * 2) };
  }
  const pose = mixPose(along(LEVEL_REST, distance), along(LEVEL_FANNED, distance), fan);
  return { pose, opacity: clamp(VISIBLE_LEVELS + 1 - distance, 0, 1) };
}

type SheetProps = {
  post: BlogPost;
  index: number;
  isActive: boolean;
  focus: MotionValue<number>;
  fan: MotionValue<number>;
  rise: MotionValue<number>;
  count: number;
  interactive: boolean;
  pickable: boolean;
  hovered: boolean;
  showImage: boolean;
  fling: CoverFling | null;
  sizes: string;
  highPriority: boolean;
  onHover: (slug: string | null) => void;
  onPick: () => void;
  onGrab: () => void;
  onSwipe: (fling: CoverFling) => boolean;
  onThrown: () => void;
  onOpen: () => void;
};

function Sheet({ post, index, isActive, focus, fan, rise, count, interactive, pickable, hovered, showImage, fling, sizes, highPriority, onHover, onPick, onGrab, onSwipe, onThrown, onOpen }: SheetProps) {
  const lift = useSpring(0, LIFT_SPRING);
  const scale = useSpring(1, SCALE_SPRING);
  // While thrown, the sheet keeps its place in the deck and only its paper flies off.
  const pinned = useMotionValue(0);
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const grabSign = useMotionValue(1);
  const fade = useMotionValue(1);
  const tilt = useTransform([dragX, grabSign], ([x, sign]) => (x as number) * TILT * (sign as number));
  const drag = useRef<{ id: number; x0: number; y0: number; dx: number; lx: number; ly: number; lt: number; vx: number; vy: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    lift.set(hovered ? LIFT_PX : 0);
    scale.set(hovered ? LIFT_SCALE : 1);
  }, [hovered, lift, scale]);

  // Distance from the top, counted around the loop. Sheets under the one being dragged rise with the drag (`rise`, 0-1).
  const wrapped = (f: number) => wrapDistance(index - f, count);
  const distanceOf = (f: number, r: number, pin: number) => {
    if (pin) return 0;
    const distance = wrapped(f);
    return distance > 0 ? distance - r : distance;
  };
  // The sheet itself only follows the deck. Hover and drag move the paper inside it, so the place you point at (the
  // sheet's box) never slides out from under the pointer.
  const transform = useTransform([focus, fan, rise, pinned], ([f, spread, r, pin]) => {
    const { pose } = placeAt(distanceOf(f as number, r as number, pin as number), spread as number);
    return `translate(${pose.x}%, ${pose.y}%) rotate(${pose.rotate}deg)`;
  });
  const paperX = useTransform([dragX, lift], ([x, l]) => (x as number) + (l as number));
  // Stacking by place in the deck (the sheet's position counted along the loop): earlier lies over later. It changes
  // only when the sheet wraps, out of sight. A thrown sheet keeps its place while its paper flies.
  const zIndex = useTransform(focus, (f) => 100000 - Math.round(f + wrapped(f)));
  const opacity = useTransform([focus, fan, rise, pinned], ([f, spread, r, pin]) => placeAt(distanceOf(f as number, r as number, pin as number), spread as number).opacity);

  // Thrown: the paper keeps flying from wherever the drag left it and fades. Afterwards the sheet takes its place
  // among the passed ones (invisible there), and its paper is put back once it can no longer be seen.
  useEffect(() => {
    if (!fling) return;
    pinned.set(1);
    const ahead = fling.dir * Math.max(window.innerWidth / 2 + 360, Math.abs(dragX.get()) + 420);
    const flyX = animate(dragX, ahead, { ...THROW, velocity: fling.dir * Math.max(Math.abs(fling.vx), 1500) });
    const flyY = animate(dragY, dragY.get() + clamp(fling.vy * 0.2, -120, 120), THROW);
    const fadeOut = animate(fade, 0, { duration: THROW_MS / 1000, ease: [0.4, 0, 1, 1] });
    let stopWatching = () => {};
    const done = window.setTimeout(() => {
      flyX.stop();
      flyY.stop();
      pinned.set(0);
      onThrown();
      const restore = () => {
        dragX.set(0);
        dragY.set(0);
        fade.set(1);
        stopWatching();
      };
      // Put the paper back when the sheet is fully gone, or right away if the reader is already bringing it back.
      stopWatching = focus.on("change", (f) => {
        if (wrapped(f) <= -0.98 || wrapped(f) > -0.5) restore();
      });
      if (wrapped(focus.get()) <= -0.98) restore();
    }, THROW_MS);
    return () => {
      flyX.stop();
      flyY.stop();
      fadeOut.stop();
      window.clearTimeout(done);
      stopWatching();
    };
    // Runs once per throw.
  }, [fling]);

  const springBack = () => {
    animate(dragX, 0, RETURN);
    animate(dragY, 0, RETURN);
    animate(rise, 0, RETURN);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!isActive || event.button !== 0) return;
    drag.current = { id: event.pointerId, x0: event.clientX, y0: event.clientY, dx: 0, lx: event.clientX, ly: event.clientY, lt: performance.now(), vx: 0, vy: 0, moved: false };
    if (!interactive) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    grabSign.set(event.clientY < bounds.top + bounds.height / 2 ? 1 : -1); // grabbed by the top half tilts one way, the bottom half the other
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Capture is a nicety; the drag still works inside the sheet.
    }
    onGrab();
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || event.pointerId !== state.id) return;
    const dx = event.clientX - state.x0;
    const dy = event.clientY - state.y0;
    if (Math.hypot(dx, dy) > 5) state.moved = true;
    if (!interactive) return;
    const now = performance.now();
    const seconds = Math.max(1, now - state.lt) / 1000;
    state.vx = state.vx * 0.5 + ((event.clientX - state.lx) / seconds) * 0.5;
    state.vy = state.vy * 0.5 + ((event.clientY - state.ly) / seconds) * 0.5;
    state.lx = event.clientX;
    state.ly = event.clientY;
    state.lt = now;
    state.dx = dx;
    if (!state.moved) return;
    if (!dragging) setDragging(true);
    animate(dragX, dx, FOLLOW);
    animate(dragY, dy * 0.6, FOLLOW);
    rise.set(clamp(Math.abs(dx) / (THROW_PX * 1.6), 0, 1));
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state || event.pointerId !== state.id) return;
    drag.current = null;
    setDragging(false);
    if (!state.moved) {
      if (isActive) onOpen();
      return;
    }
    if (!interactive) return;
    const x = state.dx;
    const dir = Math.abs(x) > THROW_PX
      ? Math.sign(x)
      : Math.abs(state.vx) > THROW_SPEED && Math.sign(state.vx) === Math.sign(x || state.vx) ? Math.sign(state.vx) : 0;
    if (dir && onSwipe({ dir, vx: state.vx, vy: state.vy })) return;
    springBack();
  };

  const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || event.pointerId !== drag.current.id) return;
    drag.current = null;
    setDragging(false);
    springBack();
  };

  const markLoaded = (image: HTMLImageElement | null) => {
    if (image?.complete && image.naturalWidth > 0) image.classList.add("is-loaded");
  };

  return (
    <motion.figure
      className={`blog-cover-sheet${isActive ? " is-active" : ""}${pickable ? " is-open" : ""}`}
      aria-hidden={!isActive}
      style={{ transform, opacity, zIndex }}
      onPointerEnter={() => pickable && onHover(post.slug)}
      onPointerLeave={() => pickable && onHover(null)}
      onClick={() => pickable && onPick()}
    >
      <motion.div
        className={`blog-cover-paper${interactive && isActive ? " is-draggable" : ""}${dragging ? " is-dragging" : ""}`}
        style={{ x: paperX, y: dragY, rotate: tilt, scale, opacity: fade }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onDragStart={(event) => event.preventDefault()}
      >
        {showImage ? (
          <img
            ref={markLoaded}
            src={post.image}
            srcSet={post.srcSet}
            sizes={sizes}
            alt={isActive ? post.imageAlt : ""}
            width={1600}
            height={1000}
            loading="eager"
            decoding="async"
            draggable={false}
            fetchPriority={highPriority ? "high" : "low"}
            onLoad={(event) => event.currentTarget.classList.add("is-loaded")}
            style={{ objectPosition: post.imagePosition ?? "center center" }}
          />
        ) : null}
      </motion.div>
    </motion.figure>
  );
}

type BlogCoverStackProps = {
  posts: BlogPost[];
  /** The shared position (blogDeck.ts): the list wheel moves the same value. */
  deck: BlogDeck;
  coverReady: boolean;
  reduceMotion: boolean;
  sizes: string;
  /** Asked when the reader starts handling the pile, so the next cover is decoded before it is needed. */
  onPrepare: (slug: string) => void;
  onOpen: (slug: string) => void;
  children?: ReactNode;
};

const WIDE = "(min-width: 761px)"; // the pile rests fanned out above this width

/** The browser's data saver (Save-Data): fetch nothing ahead of the reader. */
export function prefersSavingData() {
  return typeof navigator !== "undefined" && Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
}

export function BlogCoverStack({ posts, deck, coverReady, reduceMotion, sizes, onPrepare, onOpen, children }: BlogCoverStackProps) {
  const count = posts.length;
  const { focus } = deck;
  const activeIndex = deck.active;
  const activePost = posts[activeIndex];
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia(WIDE).matches);
  const fan = useSpring(wide ? 1 : 0, FAN_SPRING);
  const pileScale = useTransform(fan, (value) => 1 - FAN_SHRINK * value);
  const pileX = useTransform(fan, (value) => `${-FAN_SHIFT * value}%`);
  const rise = useMotionValue(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [engaged, setEngaged] = useState(false);
  const [thrown, setThrown] = useState<{ slug: string; fling: CoverFling } | null>(null);
  // Sheets whose picture has been put in once keep it, so nothing decodes again on the way back.
  const [shown, setShown] = useState<Set<string>>(() => new Set([activePost.slug]));

  useEffect(() => {
    const query = window.matchMedia(WIDE);
    const sync = () => setWide(query.matches);
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion) fan.jump(wide ? 1 : 0);
    else fan.set(wide ? 1 : 0);
  }, [fan, reduceMotion, wide]);

  // Fanned out, the next covers are on show: load them as soon as the cover itself is in (not before, so they don't
  // compete with it). With the browser's data saver on, only the cover on top loads by itself.
  useEffect(() => {
    if (!wide || !coverReady || engaged || prefersSavingData()) return;
    setEngaged(true);
  }, [coverReady, engaged, wide]);

  // Phones have no hover: get the next cover ready shortly after the page settles, so the first swipe can land.
  const nextPost = posts[(activeIndex + 1) % count];
  useEffect(() => {
    if (reduceMotion || !nextPost || prefersSavingData() || !window.matchMedia("(hover: none)").matches) return;
    const timer = window.setTimeout(() => {
      setEngaged(true);
      onPrepare(nextPost.slug);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [nextPost, onPrepare, reduceMotion]);

  // Pictures: fanned out, the sheets near the top (a few back, for going back, and the visible ones ahead). Squared
  // up on a phone only edges show, so just the next one, ready for a swipe.
  useEffect(() => {
    setShown((current) => {
      const next = new Set(current).add(activePost.slug);
      if (engaged) {
        const [from, to] = wide ? [-2, VISIBLE_LEVELS + 1] : [1, 1];
        for (let offset = from; offset <= to; offset += 1) next.add(posts[wrapIndex(activeIndex + offset, count)].slug);
      }
      return next.size === current.size ? current : next;
    });
  }, [activeIndex, activePost.slug, count, engaged, posts, wide]);

  const engage = () => {
    setEngaged(true);
    if (nextPost) onPrepare(nextPost.slug);
  };

  const swipe = (fling: CoverFling) => {
    if (reduceMotion) return false;
    // Hand the drag's rise over to the deck: the sheets underneath stay exactly where they are, then glide on.
    const risen = rise.get();
    rise.jump(0);
    deck.handOff(risen);
    setThrown({ slug: activePost.slug, fling });
    return true;
  };

  const interactive = !reduceMotion && coverReady;
  return (
    <div
      className="blog-console-portrait"
      data-cover-ready={coverReady}
      data-fanned={wide ? "true" : "false"}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") engage();
      }}
      onPointerLeave={() => setHovered(null)}
    >
      <span className="blog-console-skeleton" aria-hidden="true" />
      <motion.div className="blog-cover-pile" style={{ scale: pileScale, x: pileX }}>
        {posts.map((post, index) => {
          const ahead = wrapDistance(index - activeIndex, count);
          return (
            <Sheet
              key={post.slug}
              post={post}
              index={index}
              isActive={index === activeIndex}
              focus={focus}
              fan={fan}
              rise={rise}
              count={count}
              interactive={interactive}
              pickable={wide && ahead >= 1 && ahead <= VISIBLE_LEVELS}
              hovered={hovered === post.slug}
              showImage={shown.has(post.slug)}
              fling={thrown?.slug === post.slug ? thrown.fling : null}
              sizes={sizes}
              highPriority={index === 0}
              onHover={setHovered}
              onPick={() => {
                setHovered(null);
                deck.step(ahead);
              }}
              onGrab={engage}
              onSwipe={swipe}
              onThrown={() => setThrown((current) => (current?.slug === post.slug ? null : current))}
              onOpen={() => onOpen(post.slug)}
            />
          );
        })}
      </motion.div>
      {children}
    </div>
  );
}
