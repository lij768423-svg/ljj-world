import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import { Browser } from "@phosphor-icons/react/Browser";
import { Database } from "@phosphor-icons/react/Database";
import { HardDrives } from "@phosphor-icons/react/HardDrives";
import { Robot } from "@phosphor-icons/react/Robot";
import { motion, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type FocusEvent, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Link } from "wouter";
import { ExternalLink, projects } from "../App";
import { getBlogPost } from "../blog";
import { aboutCapabilityLinks, type AboutCapabilityId } from "../data/aboutCapabilities";
import { AboutBlurText } from "./AboutBlurText";

// The four capability cells and the projects behind them. With a mouse there is one floating panel for the whole grid:
// it opens at the first cell and springs (position and size) to whichever cell is next, always from where it is, and
// the lists inside cross-fade without changing order. It is a portal to <body>, above the site's flowing lights. Only transforms and opacity move: the panel is a fill stretched
// by scale with four separate hairlines, and its content is clipped by two opposite translations. On touch screens
// there is no floating panel; tapping a cell opens its list under the grid.

type Entry = { key: string; title: string; href: string; image: string; external: boolean };
type Cell = { id: AboutCapabilityId; Icon: typeof Browser; name: string; stack: string; delay: number; entries: Entry[] };

const entriesFor = (id: AboutCapabilityId): Entry[] => {
  const { projectIds, pages = [] } = aboutCapabilityLinks[id];
  const linked = projectIds.flatMap((projectId) => {
    const project = projects.find((candidate) => candidate.id === projectId);
    const href = project?.site ?? project?.repo;
    return project && href ? [{ key: project.id, title: project.title, href, image: project.cardPreview.image, external: true }] : [];
  });
  const local = pages.flatMap((page) => {
    if (!("blogSlug" in page)) return [{ key: page.href, ...page, external: false }];
    const post = getBlogPost(page.blogSlug);
    return post ? [{ key: post.slug, title: post.title, href: `/blog/${post.slug}`, image: post.image, external: false }] : [];
  });
  return [...linked, ...local];
};

const cells: Cell[] = [
  { id: "interface", Icon: Browser, name: "产品界面", stack: "Web / SwiftUI / ArkTS", delay: 2.02, entries: entriesFor("interface") },
  { id: "ai", Icon: Robot, name: "AI 接入", stack: "SSE / API / 工作流", delay: 2.24, entries: entriesFor("ai") },
  { id: "service", Icon: Database, name: "服务系统", stack: "Python / FastAPI", delay: 2.44, entries: entriesFor("service") },
  { id: "operations", Icon: HardDrives, name: "运行维护", stack: "Docker / Tailscale", delay: 2.64, entries: entriesFor("operations") },
];

const PANEL_ID = "about-capability-panel";
const MAX_WIDTH = 300; // match .about-capability-panel in styles.css
const MAX_HEIGHT = 220;
const GAP = 8; // between a cell and its panel
const EDGE = 8; // kept clear of the page's lower edge
const CLOSE_AFTER_MS = 320; // a backstop; the panel's bridge already covers the gap
const geometrySpring = { stiffness: 320, damping: 33 };
const openSpring = { stiffness: 380, damping: 36 };
const floatingQuery = "(hover: hover) and (pointer: fine) and (min-width: 768px)";

function useFloatingPanel() {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia(floatingQuery);
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => window.matchMedia(floatingQuery).matches,
  );
}

function EntryList({ entries }: { entries: Entry[] }) {
  return (
    <ul className="about-capability-list">
      {entries.map((entry) => {
        const content = (
          <>
            <img src={entry.image} alt="" width={56} height={35} loading="lazy" decoding="async" draggable={false} />
            <span>{entry.title}</span>
          </>
        );
        return (
          <li key={entry.key}>
            {entry.external ? (
              <ExternalLink href={entry.href}>
                {content}
                <span className="sr-only">（在新标签页打开）</span>
                <ArrowUpRight className="about-capability-arrow" size={13} weight="bold" aria-hidden="true" />
              </ExternalLink>
            ) : <Link to={entry.href}>{content}</Link>}
          </li>
        );
      })}
    </ul>
  );
}

export function AboutCapabilities() {
  const reduceMotion = useReducedMotion();
  const floating = useFloatingPanel();
  const hostRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inlineRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef(new Map<AboutCapabilityId, HTMLDivElement>());
  const buttonRefs = useRef(new Map<AboutCapabilityId, HTMLButtonElement>());
  const layerRefs = useRef(new Map<AboutCapabilityId, HTMLDivElement>());
  const closeTimer = useRef<number | undefined>(undefined);
  const placedFor = useRef<AboutCapabilityId | null>(null);
  const ignoreFocus = useRef(false);
  const [open, setOpen] = useState<AboutCapabilityId | null>(null);
  const [last, setLast] = useState<AboutCapabilityId | null>(null); // stays while the panel fades out
  const [seen, setSeen] = useState<AboutCapabilityId[]>([]); // lists, and their covers, mount on first use

  const x = useSpring(0, geometrySpring);
  const y = useSpring(0, geometrySpring);
  const width = useSpring(MAX_WIDTH, geometrySpring);
  const height = useSpring(MAX_HEIGHT, geometrySpring);
  const openness = useSpring(0, openSpring);
  const opacity = useTransform(openness, (value) => Math.min(1, Math.max(0, value)));
  const panelY = useTransform(() => y.get() + (reduceMotion ? 0 : (1 - openness.get()) * 8));
  const fillX = useTransform(width, (value) => value / MAX_WIDTH);
  const fillY = useTransform(height, (value) => value / MAX_HEIGHT);
  const rightX = useTransform(width, (value) => value - 1);
  const bottomY = useTransform(height, (value) => value - 1);
  const clipX = useTransform(width, (value) => value - MAX_WIDTH);
  const clipY = useTransform(height, (value) => value - MAX_HEIGHT);
  const contentX = useTransform(width, (value) => MAX_WIDTH - value);
  const contentY = useTransform(height, (value) => MAX_HEIGHT - value);

  const keepOpen = useCallback(() => window.clearTimeout(closeTimer.current), []);
  const close = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    setOpen(null);
  }, []);
  const show = useCallback((id: AboutCapabilityId) => {
    window.clearTimeout(closeTimer.current);
    setOpen(id);
    setLast(id);
    setSeen((current) => current.includes(id) ? current : [...current, id]);
  }, []);

  // Moving into the panel, or keyboard focus on a cell or inside the panel, keeps it open.
  const closeSoon = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      const focused = document.activeElement;
      if (focused && (hostRef.current?.contains(focused) || panelRef.current?.contains(focused)) && focused.matches(":focus-visible")) return;
      close();
    }, CLOSE_AFTER_MS);
  };

  // Hovering another cell would make the focused link's list inert and drop the focus, so the keyboard keeps its list.
  const onCellHover = (id: AboutCapabilityId) => {
    const focused = document.activeElement;
    if (open && focused && panelRef.current?.contains(focused) && focused.matches(":focus-visible")) keepOpen();
    else show(id);
  };

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useEffect(() => { close(); }, [close, floating]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const focused = document.activeElement;
      if (panelRef.current?.contains(focused) || inlineRef.current?.contains(focused)) {
        ignoreFocus.current = true;
        buttonRefs.current.get(open)?.focus();
        ignoreFocus.current = false;
      }
      close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, open]);

  useLayoutEffect(() => {
    if (!floating) return;
    const to = reduceMotion ? openness.jump.bind(openness) : openness.set.bind(openness);
    if (!open) {
      to(0);
      return;
    }
    const host = hostRef.current;
    const cell = cellRefs.current.get(open);
    const layer = layerRefs.current.get(open);
    const page = host?.closest(".about-page");
    if (!host || !cell || !layer || !page) return;

    const place = () => {
      const origin = host.getBoundingClientRect();
      const box = cell.getBoundingClientRect();
      const w = Math.min(MAX_WIDTH, layer.offsetWidth);
      const h = Math.min(MAX_HEIGHT, layer.offsetHeight);
      // Cells in the upper row open upward and the others downward, so a panel never covers a neighbouring cell.
      const upper = box.top - origin.top < origin.height / 2 - 4;
      const left = Math.min(origin.right - w, Math.max(origin.left, box.left + (box.width - w) / 2));
      const lowest = page.getBoundingClientRect().bottom - EDGE - h;
      const below = box.bottom + GAP;
      const top = upper ? box.top - GAP - h : Math.min(lowest, below);
      // Which side bridges the gap to the cell; a panel pushed up over its cell has no gap left.
      if (panelRef.current) panelRef.current.dataset.bridge = upper ? "bottom" : lowest < below ? "none" : "top";
      const fresh = placedFor.current === null && openness.get() < 0.02;
      const jump = reduceMotion || fresh;
      placedFor.current = open;
      ([[x, left], [y, top], [width, w], [height, h]] as const).forEach(([value, target]) => {
        if (jump) value.jump(target);
        else value.set(target);
      });
    };

    if (openness.get() < 0.02) placedFor.current = null;
    place();
    to(1);
    // The list's size changes with the language, and the cell's place and the lower limit with the window.
    const observer = new ResizeObserver(place);
    observer.observe(layer);
    observer.observe(host);
    observer.observe(page);
    return () => observer.disconnect();
  }, [floating, height, open, openness, reduceMotion, seen, width, x, y]);

  // Under the grid on touch screens: bring the list into view once it is there.
  useEffect(() => {
    if (floating || !open) return;
    inlineRef.current?.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
  }, [floating, open, reduceMotion]);

  const linksOf = (id: AboutCapabilityId) => [...(layerRefs.current.get(id)?.querySelectorAll<HTMLAnchorElement>("a") ?? [])];

  // The panel sits after the grid in the document; Tab walks it as if it followed its own cell.
  const onCellKeyDown = (event: KeyboardEvent, id: AboutCapabilityId) => {
    if (!floating || open !== id) return;
    const into = event.key === "ArrowDown" || event.key === "Enter" || event.key === " " || (event.key === "Tab" && !event.shiftKey);
    const first = linksOf(id)[0];
    if (!into || !first) return;
    event.preventDefault();
    first.focus();
  };

  const onPanelKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Tab" || !open) return;
    const links = linksOf(open);
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (event.shiftKey && index === 0) {
      event.preventDefault();
      buttonRefs.current.get(open)?.focus();
    } else if (!event.shiftKey && index === links.length - 1) {
      const next = cells[cells.findIndex((cell) => cell.id === open) + 1];
      if (next) {
        event.preventDefault();
        buttonRefs.current.get(next.id)?.focus();
      }
    }
  };

  const onBlur = (event: FocusEvent) => {
    const next = event.relatedTarget as Node | null;
    if (floating && !hostRef.current?.contains(next) && !panelRef.current?.contains(next)) closeSoon();
  };

  return (
    <div className="about-capability-host" ref={hostRef} onBlur={onBlur}>
      <div className="about-console-capability-grid">
        {cells.map(({ id, Icon, name, stack, delay }) => (
          <div
            key={id}
            ref={(element) => { if (element) cellRefs.current.set(id, element); else cellRefs.current.delete(id); }}
            data-active={open === id}
            onPointerEnter={(event) => { if (floating && event.pointerType === "mouse") onCellHover(id); }}
            onPointerLeave={(event) => { if (floating && event.pointerType === "mouse") closeSoon(); }}
          >
            <Icon size={20} weight="duotone" aria-hidden="true" />
            <span id={`about-capability-${id}`}><AboutBlurText text={name} delay={delay} /></span>
            <strong><AboutBlurText text={stack} delay={delay + 0.1} /></strong>
            <button
              type="button"
              className="about-capability-hit"
              ref={(element) => { if (element) buttonRefs.current.set(id, element); else buttonRefs.current.delete(id); }}
              aria-labelledby={`about-capability-${id}`}
              aria-expanded={open === id}
              aria-controls={PANEL_ID}
              onFocus={(event) => { if (floating && !ignoreFocus.current && event.currentTarget.matches(":focus-visible")) show(id); }}
              onKeyDown={(event) => onCellKeyDown(event, id)}
              onClick={() => { if (!floating && open === id) close(); else show(id); }}
            />
          </div>
        ))}
      </div>

      {floating ? createPortal(
        <motion.div
          className="about-capability-panel"
          id={PANEL_ID}
          ref={panelRef}
          data-open={open !== null}
          role="group"
          aria-label="相关链接"
          inert={open === null}
          style={{ x, y: panelY, opacity }}
          onPointerEnter={keepOpen}
          onPointerLeave={closeSoon}
          onKeyDown={onPanelKeyDown}
        >
          <motion.span className="about-capability-bridge is-top" style={{ scaleX: fillX }} />
          <motion.span className="about-capability-bridge is-bottom" style={{ scaleX: fillX, y: height }} />
          <motion.span className="about-capability-fill" style={{ scaleX: fillX, scaleY: fillY }} />
          <motion.div className="about-capability-clip" style={{ x: clipX, y: clipY }}>
            <motion.div className="about-capability-content" style={{ x: contentX, y: contentY }}>
              {cells.filter((cell) => seen.includes(cell.id)).map((cell) => (
                <motion.div
                  key={cell.id}
                  className="about-capability-layer"
                  data-capability={cell.id}
                  data-current={last === cell.id}
                  ref={(element) => { if (element) layerRefs.current.set(cell.id, element); else layerRefs.current.delete(cell.id); }}
                  inert={last !== cell.id}
                  initial={{ opacity: seen.length === 1 ? 1 : 0 }}
                  animate={{ opacity: last === cell.id ? 1 : 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <EntryList entries={cell.entries} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
          <motion.span className="about-capability-edge is-top" style={{ scaleX: fillX }} />
          <motion.span className="about-capability-edge is-bottom" style={{ scaleX: fillX, y: bottomY }} />
          <motion.span className="about-capability-edge is-left" style={{ scaleY: fillY }} />
          <motion.span className="about-capability-edge is-right" style={{ scaleY: fillY, x: rightX }} />
        </motion.div>,
        document.body,
      ) : (
        <div className="about-capability-inline" id={PANEL_ID} ref={inlineRef} role="group" aria-label="相关链接" hidden={!open}>
          {cells.filter((cell) => seen.includes(cell.id)).map((cell) => (
            <motion.div
              key={cell.id}
              data-capability={cell.id}
              inert={open !== cell.id}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
              animate={{ opacity: open === cell.id ? 1 : 0, y: open === cell.id || reduceMotion ? 0 : 8 }}
              transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 32 }}
            >
              <EntryList entries={cell.entries} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
