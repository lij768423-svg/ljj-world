import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  getDecryptedTransitionFrame,
  translatePortfolioText,
  usePortfolioLanguage,
} from "../../i18n/PortfolioLanguage";

type DecryptedTextProps = {
  text: string;
  className?: string;
  startDelay?: number;
  animateOnMount?: boolean;
  constrainWidth?: boolean;
};

/** Sequential, accessible adaptation of React Bits DecryptedText. */
export function DecryptedText({
  text,
  className = "",
  startDelay = 120,
  animateOnMount = true,
  constrainWidth = false,
}: DecryptedTextProps) {
  const { language } = usePortfolioLanguage();
  const translatedText = translatePortfolioText(text);
  const resolvedText = language === "en" ? translatedText : text;
  const [displayText, setDisplayText] = useState(resolvedText);
  const displayRef = useRef(resolvedText);
  const targetRef = useRef(resolvedText);
  const frameRef = useRef<number | null>(null);
  const displayElementRef = useRef<HTMLSpanElement>(null);
  const sourceMeasureRef = useRef<HTMLSpanElement>(null);
  const translatedMeasureRef = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();

  const stop = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const transitionTo = useCallback((target: string, from = displayRef.current) => {
    if (reduceMotion) {
      displayRef.current = target;
      setDisplayText(target);
      return;
    }
    stop();
    const startedAt = performance.now();
    const duration = 620;
    const update = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const next = getDecryptedTransitionFrame(from, target, progress);
      displayRef.current = next;
      setDisplayText(next);
      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(update);
      } else {
        frameRef.current = null;
      }
    };
    frameRef.current = window.requestAnimationFrame(update);
  }, [reduceMotion, stop]);

  useEffect(() => {
    const languageChanged = targetRef.current !== resolvedText;
    targetRef.current = resolvedText;
    if (reduceMotion) {
      displayRef.current = resolvedText;
      setDisplayText(resolvedText);
      return;
    }
    if (!languageChanged && !animateOnMount) {
      displayRef.current = resolvedText;
      setDisplayText(resolvedText);
      return;
    }
    const timeout = window.setTimeout(
      () => transitionTo(resolvedText),
      languageChanged ? 0 : startDelay,
    );
    return () => {
      window.clearTimeout(timeout);
      stop();
    };
  }, [animateOnMount, reduceMotion, resolvedText, startDelay, stop, transitionTo]);

  useLayoutEffect(() => {
    if (!constrainWidth) return;
    const display = displayElementRef.current;
    const sourceMeasure = sourceMeasureRef.current;
    const translatedMeasure = translatedMeasureRef.current;
    if (!display || !sourceMeasure || !translatedMeasure) return;
    const naturalWidth = display.offsetWidth;
    const minimumWidth = Math.min(sourceMeasure.offsetWidth, translatedMeasure.offsetWidth);
    const maximumWidth = Math.max(sourceMeasure.offsetWidth, translatedMeasure.offsetWidth);
    const constrainedWidth = Math.min(maximumWidth, Math.max(minimumWidth, naturalWidth));
    const scaleX = naturalWidth > 0 ? constrainedWidth / naturalWidth : 1;
    display.style.setProperty("--decrypted-text-scale-x", scaleX.toFixed(6));
  }, [constrainWidth, displayText, text, translatedText]);

  return (
    <span
      className={`decrypted-text${constrainWidth ? " is-width-constrained" : ""} ${className}`.trim()}
    >
      <span className="sr-only">{resolvedText}</span>
      <span className="decrypted-text-measure" aria-hidden="true">{resolvedText}</span>
      {constrainWidth ? (
        <>
          <span ref={sourceMeasureRef} className="decrypted-text-bound-measure" aria-hidden="true">{text}</span>
          <span ref={translatedMeasureRef} className="decrypted-text-bound-measure" aria-hidden="true">{translatedText}</span>
        </>
      ) : null}
      <span ref={displayElementRef} className="decrypted-text-display" aria-hidden="true">{displayText}</span>
    </span>
  );
}
