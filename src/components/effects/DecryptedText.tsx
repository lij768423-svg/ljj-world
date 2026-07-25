import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

type DecryptedTextProps = {
  text: string;
  className?: string;
  startDelay?: number;
};

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@%+";

/** Sequential, accessible adaptation of React Bits DecryptedText. */
export function DecryptedText({ text, className = "", startDelay = 120 }: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const intervalRef = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const decrypt = useCallback(() => {
    if (reduceMotion) return;
    stop();
    let revealed = 0;
    intervalRef.current = window.setInterval(() => {
      revealed += 1;
      setDisplayText(
        Array.from(text)
          .map((character, index) => {
            if (character === " " || character === "/") return character;
            if (index < revealed) return character;
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join(""),
      );
      if (revealed >= Array.from(text).length) {
        stop();
        setDisplayText(text);
      }
    }, 34);
  }, [reduceMotion, stop, text]);

  useEffect(() => {
    if (reduceMotion) {
      setDisplayText(text);
      return;
    }
    const timeout = window.setTimeout(decrypt, startDelay);
    return () => {
      window.clearTimeout(timeout);
      stop();
    };
  }, [decrypt, reduceMotion, startDelay, stop, text]);

  return (
    <span className={`decrypted-text ${className}`.trim()} onPointerEnter={decrypt}>
      <span className="sr-only">{text}</span>
      <span className="decrypted-text-measure" aria-hidden="true">{text}</span>
      <span className="decrypted-text-display" aria-hidden="true">{displayText}</span>
    </span>
  );
}
