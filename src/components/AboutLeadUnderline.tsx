import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { usePortfolioLanguage, type PortfolioLanguage } from "../i18n/PortfolioLanguage";

// A straight line under one phrase of the sentence it sits beside. The sentence has to stay one text node for the DOM
// translator, so the phrase is found with a Range and the line is laid over it. It draws itself once, after the
// sentence has finished appearing; later re-measuring (resize, language switch) only moves it.

const phrases: Record<PortfolioLanguage, string> = { zh: "长期运行", en: "run for a long time" };

type Segment = { left: number; top: number; width: number };

export function AboutLeadUnderline() {
  const { language } = usePortfolioLanguage();
  const ref = useRef<HTMLSpanElement>(null);
  const [segments, setSegments] = useState<Segment[]>([]);

  useLayoutEffect(() => {
    const host = ref.current?.parentElement;
    const sentence = host?.firstElementChild;
    if (!host || !sentence) return;
    let active = true;

    const measure = () => {
      if (!active) return;
      const node = document.createTreeWalker(sentence, NodeFilter.SHOW_TEXT).nextNode() as Text | null;
      const start = node ? node.data.indexOf(phrases[language]) : -1;
      if (!node || start < 0) {
        // Mid language switch the letters are scrambled; the line comes back with the real sentence.
        setSegments([]);
        return;
      }
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, start + phrases[language].length);
      const origin = host.getBoundingClientRect();
      setSegments([...range.getClientRects()].filter((rect) => rect.width > 1).map((rect) => ({
        left: rect.left - origin.left,
        top: rect.bottom - origin.top,
        width: rect.width,
      })));
    };

    const resize = new ResizeObserver(measure);
    const text = new MutationObserver(measure);
    const begin = () => {
      if (!active) return;
      resize.observe(host);
      text.observe(sentence, { subtree: true, characterData: true });
      measure();
    };
    const reveal = sentence.getAnimations();
    void Promise.all([document.fonts.ready, ...reveal.map((animation) => animation.finished.catch(() => undefined))]).then(begin);

    return () => {
      active = false;
      resize.disconnect();
      text.disconnect();
    };
  }, [language]);

  const total = segments.reduce((sum, segment) => sum + segment.width, 0);
  let before = 0;
  return (
    <span className="about-lead-underline" ref={ref} aria-hidden="true">
      {segments.map((segment, index) => {
        const style = {
          left: segment.left,
          top: segment.top,
          width: segment.width,
          "--draw-delay": `${Math.round((before / total) * 520)}ms`,
          "--draw-time": `${Math.round((segment.width / total) * 520)}ms`,
        } as CSSProperties;
        before += segment.width;
        return <i key={index} style={style} />;
      })}
    </span>
  );
}
