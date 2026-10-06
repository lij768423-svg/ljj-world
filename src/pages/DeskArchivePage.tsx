import { ArrowLeft } from "@phosphor-icons/react/ArrowLeft";
import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { X } from "@phosphor-icons/react/X";
import { animate, AnimatePresence, motion, useIsPresent, useReducedMotion } from "motion/react";
import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SceneLineOrnaments } from "../components/effects/SceneLineOrnaments";
import type { CircularGalleryClick } from "../components/CircularGallery";
import { CircularGallery, type ThemeMode, deskScenes, homeGalleryItems, schoolGalleryItems } from "../App";

function DeskGalleryFallback({ label }: { label: string }) {
  return (
    <div className="desk-gallery-loading" role="status">
      <span className="sr-only">{label}</span>
    </div>
  );
}

type DeskGroup = keyof typeof deskScenes;
type DeskSelection = CircularGalleryClick & { group: DeskGroup };

function DeskLightbox({
  selection,
  onChange,
  onClose,
}: {
  selection: DeskSelection;
  onChange: (index: number) => void;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const desks = selection.group === "home" ? deskScenes.home.desks : deskScenes.school.desks;
  const desk = desks[selection.index];
  const locationLabel = selection.group === "home" ? "HOME" : "DORM";
  const lightboxOrigin = {
    x: selection.clientX - window.innerWidth / 2,
    y: selection.clientY - window.innerHeight / 2,
  };

  const move = useCallback((delta: number) => {
    onChange((selection.index + delta + desks.length) % desks.length);
  }, [desks.length, onChange, selection.index]);

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [move, onClose]);

  useEffect(() => {
    const previous = desks[(selection.index - 1 + desks.length) % desks.length];
    const next = desks[(selection.index + 1) % desks.length];
    [previous, next].forEach((item) => {
      const image = new Image();
      image.src = `${item.image}-1600.webp`;
    });
  }, [desks, selection.index]);

  return createPortal(
    <motion.div
      className="desk-lightbox"
      data-trail-occluder
      data-desk-lightbox-backdrop
      data-desk-group={selection.group}
      role="dialog"
      aria-modal="true"
      aria-labelledby="desk-lightbox-title"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button ref={closeRef} className="desk-lightbox-close" type="button" onClick={onClose} title="关闭大图" aria-label="关闭大图">
        <X size={22} weight="bold" aria-hidden="true" />
      </button>

      <button className="desk-lightbox-arrow is-previous" type="button" onClick={() => move(-1)} title="上一张" aria-label="上一张">
        <ArrowLeft size={25} weight="bold" aria-hidden="true" />
      </button>

      <div
        className="desk-lightbox-stage"
        aria-live="polite"
        onPointerDown={(event) => {
          const target = event.target instanceof Element ? event.target : null;
          if (!target?.closest("img, figcaption, button")) onClose();
        }}
      >
        <motion.div
          className="desk-lightbox-zoom-shell"
          data-origin-x={Math.round(selection.clientX)}
          data-origin-y={Math.round(selection.clientY)}
          initial={reduceMotion ? false : { opacity: 0, scale: 0.34, x: lightboxOrigin.x, y: lightboxOrigin.y }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, scale: 0.34, x: lightboxOrigin.x, y: lightboxOrigin.y }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.figure
              key={desk.id}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.965, x: 18 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985, x: -18 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
            >
              <img
                src={`${desk.image}-1600.webp`}
                alt={desk.alt}
                width={desk.width}
                height={desk.height}
              />
              <figcaption>
                <div className="desk-lightbox-copy">
                  <h2 id="desk-lightbox-title">{desk.title}</h2>
                  <p>{desk.description}</p>
                  <div className="desk-lightbox-meta" aria-label="照片信息">
                    <span>{desk.period}</span>
                    <span>{locationLabel}</span>
                    <span>{desk.device}</span>
                  </div>
                </div>
                <span className="desk-lightbox-count" aria-label={`第 ${selection.index + 1} 张，共 ${desks.length} 张`}>
                  {String(selection.index + 1).padStart(2, "0")} / {String(desks.length).padStart(2, "0")}
                </span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </motion.div>
      </div>

      <button className="desk-lightbox-arrow is-next" type="button" onClick={() => move(1)} title="下一张" aria-label="下一张">
        <ArrowRight size={25} weight="bold" aria-hidden="true" />
      </button>
    </motion.div>,
    document.body,
  );
}

export function DeskArchivePage({ theme }: { theme: ThemeMode }) {
  const isPresent = useIsPresent();
  const entryTheme = useRef(theme);
  const previousTheme = useRef(theme);
  const [visualTheme, setVisualTheme] = useState<ThemeMode>("dark");
  const currentVisualTheme = previousTheme.current === theme ? visualTheme : theme;
  const [selection, setSelection] = useState<DeskSelection | null>(null);
  const [schoolMounted, setSchoolMounted] = useState(theme === "dark");
  const [galleryReady, setGalleryReady] = useState({ home: false, school: false });
  const galleriesReady = galleryReady.home && galleryReady.school;
  const openHome = useCallback((selection: CircularGalleryClick) => setSelection({ group: "home", ...selection }), []);
  const openSchool = useCallback((selection: CircularGalleryClick) => setSelection({ group: "school", ...selection }), []);
  const markHomeReady = useCallback(() => {
    setGalleryReady((current) => current.home ? current : { ...current, home: true });
  }, []);
  const markSchoolReady = useCallback(() => {
    setGalleryReady((current) => current.school ? current : { ...current, school: true });
  }, []);
  const closeLightbox = useCallback(() => setSelection(null), []);
  const changeLightboxImage = useCallback((index: number) => {
    setSelection((current) => current ? { ...current, index } : current);
  }, []);

  useLayoutEffect(() => {
    document.documentElement.classList.add("desk-route-root");
    document.body.classList.add("desk-route");
    return () => {
      document.documentElement.classList.remove("desk-route-root");
      document.body.classList.remove("desk-route");
      document.body.classList.remove("desk-chrome-dark");
    };
  }, []);

  useEffect(() => {
    if (previousTheme.current === theme) return;
    previousTheme.current = theme;
    setVisualTheme(theme);
  }, [theme]);

  useLayoutEffect(() => {
    if (theme === "dark") {
      document.body.classList.remove("desk-chrome-dark");
      return;
    }
    if (!isPresent && currentVisualTheme === "light") {
      document.body.classList.remove("desk-chrome-dark");
      return;
    }
    document.body.classList.add("desk-chrome-dark");
    if (isPresent && currentVisualTheme === "dark") return;
    const delay = isPresent ? 600 : 860;
    const restoreChrome = window.setTimeout(() => {
      document.body.classList.remove("desk-chrome-dark");
    }, delay);
    return () => window.clearTimeout(restoreChrome);
  }, [currentVisualTheme, isPresent, theme]);

  useEffect(() => {
    if (!isPresent) setSelection(null);
  }, [isPresent]);

  useEffect(() => {
    if (entryTheme.current === "dark") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSchoolMounted(true);
      return;
    }
    const mountSchool = window.setTimeout(() => setSchoolMounted(true), 180);
    return () => window.clearTimeout(mountSchool);
  }, []);

  return (
    <div
      className="desk-page"
      data-entry-theme={entryTheme.current}
      data-visual-theme={isPresent ? currentVisualTheme : theme}
      data-intro-ready={galleriesReady ? "true" : "false"}
      data-present={isPresent ? "true" : "false"}
    >
      <div className="desk-theme-wipe" aria-hidden="true">
        <span className="is-upper" />
        <span className="is-lower" />
      </div>
      <SceneLineOrnaments variant="desk" />
      <section className="desk-gallery-layout" aria-labelledby="page-title">
        <div className="desk-gallery-scene desk-gallery-scene-home">
          <div className="desk-gallery-scene-label" aria-hidden="true">
            <strong>HOME</strong>
          </div>
          <Suspense fallback={<DeskGalleryFallback label="正在加载家里桌搭" />}>
            <CircularGallery
              items={homeGalleryItems}
              bend={-5.8}
              borderRadius={0.095}
              textColor="#f2f1eb"
              scrollSpeed={1.75}
              scrollEase={0.072}
              showTitles={false}
              entryDirection="left"
              introLead={entryTheme.current === "dark" ? 0 : 180}
              startIntro={galleriesReady}
              exiting={!isPresent}
              onReady={markHomeReady}
              onItemClick={openHome}
              ariaLabel="家里桌搭曲线画廊，可拖动、使用左右方向键浏览或点击图片打开大图"
            />
          </Suspense>
        </div>

        <h1 id="page-title" className="desk-gallery-title" aria-label="我的桌搭">
          <span>DESK</span>
          <i />
          <span>SETUP</span>
          <span className="sr-only">我的桌搭</span>
        </h1>

        <div className="desk-gallery-scene desk-gallery-scene-school">
          <div className="desk-gallery-scene-label" aria-hidden="true">
            <strong>DORM</strong>
          </div>
          {schoolMounted ? (
            <Suspense fallback={<DeskGalleryFallback label="正在加载寝室桌搭" />}>
              <CircularGallery
                items={schoolGalleryItems}
                bend={5.8}
                borderRadius={0.095}
                textColor="#f2f1eb"
                scrollSpeed={1.75}
                scrollEase={0.072}
                showTitles={false}
                entryDirection="right"
                introLead={entryTheme.current === "dark" ? 0 : 180}
                startIntro={galleriesReady}
                exiting={!isPresent}
                onReady={markSchoolReady}
                onItemClick={openSchool}
                ariaLabel="寝室桌搭曲线画廊，可拖动、使用左右方向键浏览或点击图片打开大图"
              />
            </Suspense>
          ) : (
            <DeskGalleryFallback label="正在加载寝室桌搭" />
          )}
        </div>
      </section>
      <AnimatePresence>
        {selection ? (
          <DeskLightbox selection={selection} onChange={changeLightboxImage} onClose={closeLightbox} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
