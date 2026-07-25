import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, useLocation } from "wouter";

type GooeyNavItem = {
  label: string;
  to: string;
  end?: boolean;
};

type GooeyParticle = {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
};

type GooeyNavProps = {
  items: GooeyNavItem[];
  ariaLabel: string;
};

type ParticleStyle = CSSProperties & {
  "--gooey-particle-x": string;
  "--gooey-particle-y": string;
  "--gooey-particle-size": string;
  "--gooey-particle-delay": string;
};

const PARTICLE_COUNT = 12;
const PARTICLE_LIFETIME = 760;
const EFFECT_PADDING = 11;

function matchesPath(pathname: string, item: GooeyNavItem) {
  return item.end
    ? pathname === item.to
    : pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function createParticles(seed: number): GooeyParticle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => {
    const angle = ((Math.PI * 2) / PARTICLE_COUNT) * index + seed * 0.37;
    const distance = 19 + ((index * 7 + seed * 3) % 15);

    return {
      id: seed * 100 + index,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * Math.min(distance, 21),
      size: 4 + ((index + seed) % 5),
      delay: (index % 4) * 20,
    };
  });
}

export function GooeyNav({ items, ariaLabel }: GooeyNavProps) {
  const [pathname] = useLocation();
  const reduceMotion = useReducedMotion();
  const activeIndex = Math.max(0, items.findIndex((item) => matchesPath(pathname, item)));
  const [visualActiveIndex, setVisualActiveIndex] = useState(activeIndex);
  const [particles, setParticles] = useState<GooeyParticle[]>([]);
  const [isMoving, setIsMoving] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const effectRef = useRef<HTMLSpanElement>(null);
  const visualActiveRef = useRef(activeIndex);
  const animationSeedRef = useRef(0);
  const cleanupTimerRef = useRef<number | null>(null);

  const updateEffectPosition = useCallback((index: number, immediate = false) => {
    const nav = navRef.current;
    const item = itemRefs.current[index];
    const effect = effectRef.current;
    if (!nav || !item || !effect) return;

    const navRect = nav.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    effect.style.setProperty("--gooey-nav-x", `${itemRect.left - navRect.left - EFFECT_PADDING}px`);
    effect.style.setProperty("--gooey-nav-width", `${itemRect.width + EFFECT_PADDING * 2}px`);
    effect.dataset.ready = "true";
    effect.dataset.immediate = immediate ? "true" : "false";
  }, []);

  const activate = useCallback((index: number, immediate = false) => {
    if (visualActiveRef.current === index && !immediate) return;

    visualActiveRef.current = index;
    setVisualActiveIndex(index);
    updateEffectPosition(index, immediate);

    if (immediate || reduceMotion) {
      setParticles([]);
      setIsMoving(false);
      return;
    }

    animationSeedRef.current += 1;
    setParticles(createParticles(animationSeedRef.current));
    setIsMoving(true);
    if (cleanupTimerRef.current !== null) window.clearTimeout(cleanupTimerRef.current);
    cleanupTimerRef.current = window.setTimeout(() => {
      setParticles([]);
      setIsMoving(false);
      cleanupTimerRef.current = null;
    }, PARTICLE_LIFETIME);
  }, [reduceMotion, updateEffectPosition]);

  useLayoutEffect(() => {
    activate(activeIndex, true);
  }, []); // The first paint must place the indicator without travelling across the header.

  useEffect(() => {
    if (visualActiveRef.current !== activeIndex) activate(activeIndex);
  }, [activeIndex, activate]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const observer = new ResizeObserver(() => updateEffectPosition(visualActiveRef.current, true));
    observer.observe(nav);
    return () => observer.disconnect();
  }, [updateEffectPosition]);

  useEffect(() => () => {
    if (cleanupTimerRef.current !== null) window.clearTimeout(cleanupTimerRef.current);
  }, []);

  const particleElements = useMemo(() => particles.map((particle) => {
    const style: ParticleStyle = {
      "--gooey-particle-x": `${particle.x}px`,
      "--gooey-particle-y": `${particle.y}px`,
      "--gooey-particle-size": `${particle.size}px`,
      "--gooey-particle-delay": `${particle.delay}ms`,
    };

    return <span className="gooey-nav-particle" style={style} key={particle.id} />;
  }), [particles]);

  return (
    <nav
      ref={navRef}
      className="desktop-nav gooey-nav"
      aria-label={ariaLabel}
      data-active-index={visualActiveIndex}
      data-reduced-motion={reduceMotion ? "true" : "false"}
    >
      <ul>
        {items.map((item, index) => {
          const active = activeIndex === index;
          return (
            <li
              key={item.to}
              ref={(element) => { itemRefs.current[index] = element; }}
              className={active ? "is-active" : undefined}
            >
              <Link
                to={item.to}
                aria-current={active ? "page" : undefined}
                onClick={() => activate(index)}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <span
        ref={effectRef}
        className={`gooey-nav-effect${isMoving ? " is-moving" : ""}`}
        aria-hidden="true"
        data-testid="gooey-nav-indicator"
      >
        <span className="gooey-nav-liquid">
          <span className="gooey-nav-core" />
          {particleElements}
        </span>
      </span>
    </nav>
  );
}
