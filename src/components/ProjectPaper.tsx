import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { ArrowUpRight } from "@phosphor-icons/react/ArrowUpRight";
import { Article } from "@phosphor-icons/react/Article";
import { GithubLogo } from "@phosphor-icons/react/GithubLogo";
import { GlobeHemisphereWest } from "@phosphor-icons/react/GlobeHemisphereWest";
import { LockKey } from "@phosphor-icons/react/LockKey";
import { X } from "@phosphor-icons/react/X";
import { motion, useIsPresent, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "wouter";
import { getBlogPost } from "../blog";

type PaperPreview = {
  image: string;
  alt: string;
  width: number;
  height: number;
  srcSet?: string;
  sizes?: string;
  fit?: "cover" | "contain";
  position?: string;
};

export type PaperProject = {
  id: string;
  title: string;
  description: string;
  category: "product" | "ai" | "system";
  kind: string;
  tags: string[];
  repo?: string;
  site?: string;
  article?: string;
  icon: ReactNode;
  preview?: PaperPreview;
};

/** How a paper can turn to dust when it closes. Passed in so the phone layout never loads three.js. */
export type PaperDust = {
  snapshot: (sheet: HTMLElement) => Promise<HTMLCanvasElement | null>;
  play: (snapshot: HTMLCanvasElement, rect: DOMRect, ink: string) => boolean;
};

/** Where the paper comes from: out of its card (desktop), or up from the bottom edge (phone). */
export type PaperEntry =
  | { from: "card"; rect: DOMRect; direction: number }
  | { from: "bottom" };

// How long the page behind a closed sheet takes to come back (veil, blur and dimmed cards), so it clears with the dust
// instead of snapping. Matches the .is-releasing transition in effects.css.
export const PAPER_RELEASE_MS = 900;
const PAPER_RELEASE_EASE = [0.37, 0, 0.63, 1] as const; // ease-in-out sine: an even fade, no sudden middle
// Longest a close waits for the dust picture before falling back to a plain fade.
const DUST_WAIT_MS = 400;
// The phone sheet rides one spring both ways, so closing mid-entrance turns it around without a jump.
const SHEET_SPRING = { type: "spring", stiffness: 360, damping: 38 } as const;
// Following the article link: gone before the route's own 0.28 s exit unmounts the page.
const LEAVE_S = 0.24;

/** The link around a project card: its public address for new tabs and screen readers, the paper for a plain click. */
export function ProjectCardLink({ project, onOpen, children }: {
  project: PaperProject;
  onOpen: (trigger: HTMLAnchorElement) => void;
  children: ReactNode;
}) {
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onOpen(event.currentTarget);
  };
  const address = project.site ?? project.repo;
  return address ? (
    <a className="project-card-link" href={address} target="_blank" rel="noreferrer" onClick={open}>{children}</a>
  ) : (
    <Link className="project-card-link" to="/projects" onClick={open}>{children}</Link>
  );
}

function cardEntry({ rect, direction }: Extract<PaperEntry, { from: "card" }>) {
  const width = Math.min(window.innerWidth - 96, 1120);
  const height = Math.min(window.innerHeight - 104, 680);
  const left = (window.innerWidth - width) / 2;
  const top = (window.innerHeight - height) / 2;
  return {
    style: { left, top, width, height },
    initial: {
      x: rect.left + rect.width / 2 - (left + width / 2),
      y: rect.top + rect.height / 2 - (top + height / 2),
      scaleX: Math.max(0.12, rect.width / width),
      scaleY: Math.max(0.12, rect.height / height),
      rotateX: -5,
      rotateY: direction * 9,
      borderRadius: 8,
    },
  };
}

export function ProjectPaper({ project, entry, dust, onClose }: {
  project: PaperProject;
  entry: PaperEntry;
  dust?: PaperDust;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const isPresent = useIsPresent();
  const flightRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [leaving, setLeaving] = useState(false);
  const card = entry.from === "card" ? cardEntry(entry) : null;
  const post = getBlogPost(project.article);

  // The picture the dust is made from. It is taken as soon as the sheet opens (not after it lands), so it is
  // ready within a few hundred milliseconds; a close that comes sooner waits a little for it (DUST_WAIT_MS).
  const snapshotRef = useRef<Promise<HTMLCanvasElement | null> | null>(null);
  const closingRef = useRef(false);

  // Also runs when a paper that was still closing is opened again: the same one turns around.
  useEffect(() => {
    if (!isPresent) {
      if (flightRef.current) flightRef.current.style.pointerEvents = "none";
      return;
    }
    closingRef.current = false;
    if (flightRef.current) flightRef.current.style.pointerEvents = "";
    if (sheetRef.current) sheetRef.current.style.visibility = "";
    closeRef.current?.focus({ preventScroll: true });
  }, [isPresent]);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!dust || reduceMotion || !sheet || snapshotRef.current) return;
    snapshotRef.current = (async () => {
      const image = sheet.querySelector("img");
      if (image && !image.complete) {
        await new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        });
      }
      await image?.decode().catch(() => undefined);
      const snapshot = await dust.snapshot(sheet);
      // Lets tests (and anyone debugging) see whether closing will turn to dust.
      sheet.dataset.dustReady = snapshot ? "true" : "failed";
      return snapshot;
    })();
  }, [dust, reduceMotion]);

  // Turns the sheet into dust (a circle from a new spot each time), then closes. The veil keeps fading for
  // PAPER_RELEASE_MS and stops catching clicks right away. Without dust it just closes.
  const close = async () => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (flightRef.current) flightRef.current.style.pointerEvents = "none";
    const pending = snapshotRef.current;
    const snapshot = pending
      ? await Promise.race([pending, new Promise<null>((resolve) => window.setTimeout(() => resolve(null), DUST_WAIT_MS))])
      : null;
    const sheet = sheetRef.current;
    if (dust && sheet && snapshot && dust.play(snapshot, sheet.getBoundingClientRect(), getComputedStyle(sheet).color)) {
      sheet.style.visibility = "hidden";
    }
    onClose();
  };

  // On the document, so Escape still works after a tap on the paper's text moved focus to the body.
  useEffect(() => {
    if (!isPresent) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        void close();
        return;
      }
      const sheet = sheetRef.current;
      if (event.key !== "Tab" || !sheet) return;

      const focusable = Array.from(sheet.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const inside = sheet.contains(document.activeElement);
      if (event.shiftKey && (!inside || document.activeElement === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!inside || document.activeElement === last)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  const followArticle = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    closingRef.current = true;
    if (flightRef.current) flightRef.current.style.pointerEvents = "none";
    setLeaving(true);
  };

  const flightExit = card
    ? { opacity: 0, transition: { duration: PAPER_RELEASE_MS / 1000, ease: PAPER_RELEASE_EASE } }
    : { opacity: 0, transition: { duration: 0.32, ease: PAPER_RELEASE_EASE } };
  // For a card, only seen when there is no dust (no WebGL, or the picture failed): an even fade, not the opening's fast curve.
  const sheetExit = card
    ? { opacity: 0, scaleX: 0.97, scaleY: 0.97, transition: { duration: 0.45, ease: PAPER_RELEASE_EASE } }
    : { y: "100%", transition: SHEET_SPRING };

  return createPortal(
    <motion.div
      ref={flightRef}
      className={`project-paper-flight${card ? "" : " is-sheet"}`}
      data-project-paper={project.id}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-paper-title"
      aria-describedby="project-paper-description"
      initial={reduceMotion ? false : { opacity: card ? 0.72 : 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      exit={reduceMotion ? undefined : flightExit}
      transition={{ duration: reduceMotion ? 0 : leaving ? LEAVE_S : 0.2 }}
      onClick={(event) => {
        if (event.target === event.currentTarget) void close();
      }}
    >
      <motion.article
        ref={sheetRef}
        className={`project-paper-sheet project-paper-${project.category}`}
        style={card?.style}
        initial={reduceMotion ? false : card?.initial ?? { y: "100%" }}
        animate={card ? { x: 0, y: 0, scaleX: 1, scaleY: 1, rotateX: 0, rotateY: 0, opacity: 1, borderRadius: 2 } : { y: 0 }}
        exit={reduceMotion ? undefined : sheetExit}
        transition={reduceMotion ? { duration: 0 } : card ? { duration: 0.74, ease: [0.16, 1, 0.3, 1] } : SHEET_SPRING}
      >
        <button
          ref={closeRef}
          className="project-paper-close"
          type="button"
          onClick={() => void close()}
          aria-label="关闭项目预览"
          title="关闭项目预览"
        >
          <X size={18} weight="bold" aria-hidden="true" />
        </button>

        <div className="project-paper-layout">
          <div className="project-paper-visual">
            {project.preview ? (
              <img
                className={project.preview.fit === "contain" ? "is-contain" : ""}
                src={project.preview.image}
                srcSet={project.preview.srcSet}
                sizes={card ? "min(64vw, 720px)" : "100vw"}
                alt={project.preview.alt}
                width={project.preview.width}
                height={project.preview.height}
                style={{ objectPosition: project.preview.position }}
              />
            ) : (
              <div className="project-paper-mark" aria-hidden="true">{project.icon}</div>
            )}
          </div>
          <div className="project-paper-copy">
            <span>{project.kind}</span>
            <h2 id="project-paper-title">{project.title}</h2>
            <p id="project-paper-description">{project.description}</p>
            <div className="project-paper-tags">{project.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
            <div className="project-paper-links" aria-label={`${project.title} 项目地址`}>
              {project.repo ? (
                <a href={project.repo} target="_blank" rel="noreferrer">
                  <GithubLogo size={17} weight="fill" aria-hidden="true" />
                  <span>GitHub</span>
                  <strong>{project.repo.replace(/^https?:\/\//, "")}</strong>
                  <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
                </a>
              ) : null}
              {project.site ? (
                <a href={project.site} target="_blank" rel="noreferrer">
                  <GlobeHemisphereWest size={17} weight="bold" aria-hidden="true" />
                  <span>在线地址</span>
                  <strong>{project.site.replace(/^https?:\/\//, "").replace(/\/$/, "")}</strong>
                  <ArrowUpRight size={16} weight="bold" aria-hidden="true" />
                </a>
              ) : null}
              {!project.repo && !project.site ? (
                <div className="project-paper-private">
                  <LockKey size={17} weight="bold" aria-hidden="true" />
                  <span>非公开项目</span>
                </div>
              ) : null}
              {post ? (
                <Link to={`/blog/${post.slug}`} onClick={followArticle}>
                  <Article size={17} weight="bold" aria-hidden="true" />
                  <span>相关文章</span>
                  <strong>{post.title}</strong>
                  <ArrowRight size={16} weight="bold" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </motion.article>
    </motion.div>,
    document.body,
  );
}
