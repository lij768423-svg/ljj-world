import { gsap } from "gsap";
import { useReducedMotion } from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
} from "react";
import { Link } from "wouter";

export type FlowingMenuItemData = {
  href: string;
  label: string;
  ariaLabel: string;
  images: string[];
};

type FlowingMenuProps = {
  items: FlowingMenuItemData[];
  onSelect: () => void;
  speed?: number;
};

type FlowingMenuItemProps = FlowingMenuItemData & {
  onSelect: () => void;
  speed: number;
};

const isFinePointer = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

function FlowingMenuItem({
  href,
  label,
  ariaLabel,
  images,
  onSelect,
  speed,
}: FlowingMenuItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);
  const marqueeTweenRef = useRef<gsap.core.Tween | null>(null);
  const revealTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const [repetitions, setRepetitions] = useState(4);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const item = itemRef.current;
    const inner = marqueeInnerRef.current;
    if (!item || !inner) return;

    const calculateRepetitions = () => {
      const part = inner.querySelector<HTMLElement>(".flowing-menu-marquee-part");
      if (!part || part.offsetWidth === 0) return;
      setRepetitions(Math.max(4, Math.ceil(item.offsetWidth / part.offsetWidth) + 2));
    };

    calculateRepetitions();
    const observer = new ResizeObserver(calculateRepetitions);
    observer.observe(item);
    return () => observer.disconnect();
  }, [images, label]);

  useEffect(() => {
    const inner = marqueeInnerRef.current;
    if (!inner || reduceMotion) return;

    const part = inner.querySelector<HTMLElement>(".flowing-menu-marquee-part");
    if (!part || part.offsetWidth === 0) return;

    marqueeTweenRef.current?.kill();
    marqueeTweenRef.current = gsap.to(inner, {
      x: -part.offsetWidth,
      duration: speed,
      ease: "none",
      repeat: -1,
    });

    return () => {
      marqueeTweenRef.current?.kill();
      marqueeTweenRef.current = null;
    };
  }, [reduceMotion, repetitions, speed]);

  useEffect(() => () => {
    revealTimelineRef.current?.kill();
    marqueeTweenRef.current?.kill();
    if (marqueeRef.current && marqueeInnerRef.current) {
      gsap.killTweensOf([marqueeRef.current, marqueeInnerRef.current]);
    }
  }, []);

  const closestEdge = (clientX: number, clientY: number) => {
    const rect = itemRef.current?.getBoundingClientRect();
    if (!rect) return "bottom" as const;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const topDistance = (x - rect.width / 2) ** 2 + y ** 2;
    const bottomDistance = (x - rect.width / 2) ** 2 + (y - rect.height) ** 2;
    return topDistance < bottomDistance ? "top" as const : "bottom" as const;
  };

  const showMarquee = (edge: "top" | "bottom") => {
    const marquee = marqueeRef.current;
    const inner = marqueeInnerRef.current;
    if (!marquee || !inner) return;

    revealTimelineRef.current?.kill();
    gsap.killTweensOf(marquee, "y");
    gsap.killTweensOf(inner, "y");
    gsap.set(marquee, { y: edge === "top" ? "-101%" : "101%" });
    gsap.set(inner, { y: edge === "top" ? "101%" : "-101%" });

    if (reduceMotion) {
      gsap.set([marquee, inner], { y: "0%" });
      return;
    }

    revealTimelineRef.current = gsap.timeline({ defaults: { duration: 0.62, ease: "expo.out" } })
      .to([marquee, inner], { y: "0%" }, 0);
  };

  const hideMarquee = (edge: "top" | "bottom") => {
    const marquee = marqueeRef.current;
    const inner = marqueeInnerRef.current;
    if (!marquee || !inner) return;

    revealTimelineRef.current?.kill();
    gsap.killTweensOf(marquee, "y");
    gsap.killTweensOf(inner, "y");
    if (reduceMotion) {
      gsap.set(marquee, { y: edge === "top" ? "-101%" : "101%" });
      gsap.set(inner, { y: edge === "top" ? "101%" : "-101%" });
      return;
    }

    revealTimelineRef.current = gsap.timeline({ defaults: { duration: 0.58, ease: "expo.out" } })
      .to(marquee, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .to(inner, { y: edge === "top" ? "101%" : "-101%" }, 0);
  };

  const handleMouseEnter = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isFinePointer()) showMarquee(closestEdge(event.clientX, event.clientY));
  };

  const handleMouseLeave = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isFinePointer()) hideMarquee(closestEdge(event.clientX, event.clientY));
  };

  const handleFocus = () => showMarquee("bottom");
  const handleBlur = (event: FocusEvent<HTMLAnchorElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) hideMarquee("bottom");
  };

  return (
    <div className="flowing-menu-item" ref={itemRef} role="listitem">
      <Link
        className="flowing-menu-link"
        to={href}
        aria-label={ariaLabel}
        onClick={onSelect}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        <strong>{label}</strong>
      </Link>
      <div className="flowing-menu-marquee" ref={marqueeRef} aria-hidden="true">
        <div className="flowing-menu-marquee-viewport">
          <div className="flowing-menu-marquee-inner" ref={marqueeInnerRef}>
            {Array.from({ length: repetitions }, (_, index) => (
              <div className="flowing-menu-marquee-part" key={`${href}-${index}`}>
                <span>{label}</span>
                <i style={{ backgroundImage: `url(${images[index % images.length]})` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FlowingMenu({ items, onSelect, speed = 15 }: FlowingMenuProps) {
  return (
    <div className="flowing-menu" role="list">
      {items.map((item) => (
        <FlowingMenuItem key={item.href} {...item} onSelect={onSelect} speed={speed} />
      ))}
    </div>
  );
}
