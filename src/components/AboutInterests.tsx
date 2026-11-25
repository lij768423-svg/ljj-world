import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { motion, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { Link } from "wouter";
import { translatePortfolioText, usePortfolioLanguage } from "../i18n/PortfolioLanguage";
import { AboutBlurText } from "./AboutBlurText";

// One spring drives the whole word: every letter reads its own window of it, so turning back halfway reverses each
// letter from where it is.
const rollSpring = { stiffness: 170, damping: 26 };
const LETTER_SPREAD = 0.5; // how much of the roll the last letter waits for

function RollLetter({ letter, index, count, progress }: { letter: string; index: number; count: number; progress: MotionValue<number> }) {
  const y = useTransform(progress, (value) => {
    const wait = count > 1 ? (index / (count - 1)) * LETTER_SPREAD : 0;
    return `${-50 * Math.min(1, Math.max(0, (value - wait) / (1 - LETTER_SPREAD)))}%`;
  });
  return (
    <span className="about-roll-letter">
      <motion.span style={{ y }}><span>{letter}</span><span>{letter}</span></motion.span>
    </span>
  );
}

function DeskLink() {
  const { language } = usePortfolioLanguage();
  const reduceMotion = useReducedMotion();
  const progress = useSpring(0, rollSpring);
  const arrow = useTransform(progress, [0, 1], [0, 5]);
  const title = "数码桌搭";
  // Split into letters, so it takes its words from the translation table itself instead of the DOM translator.
  const letters = Array.from(language === "en" ? translatePortfolioText(title) : title);
  const roll = (on: boolean) => { if (!reduceMotion) progress.set(on ? 1 : 0); };

  return (
    <Link
      className="about-desk-link"
      to="/desk"
      aria-label={title}
      onPointerEnter={(event) => { if (event.pointerType === "mouse") roll(true); }}
      onPointerLeave={() => roll(false)}
      onFocus={(event) => { if (event.currentTarget.matches(":focus-visible")) roll(true); }}
      onBlur={() => roll(false)}
    >
      <AboutBlurText delay={1.54}>
        <span className="about-desk-link-line" aria-hidden="true" data-no-translate>
          <span className="about-desk-link-index">01</span>
          <span className="about-roll-word">
            {letters.map((letter, index) => (
              <RollLetter key={`${language}-${index}`} letter={letter} index={index} count={letters.length} progress={progress} />
            ))}
          </span>
          <motion.span className="about-desk-link-arrow" style={{ x: arrow }}><ArrowRight size={13} weight="bold" /></motion.span>
        </span>
      </AboutBlurText>
    </Link>
  );
}

export function AboutInterests() {
  return (
    <ul className="about-console-interests" aria-label="个人兴趣">
      <li><DeskLink /></li>
      <li><AboutBlurText text="健身" delay={1.65} /></li>
      <li><AboutBlurText text="穿搭" delay={1.74} /></li>
      <li><AboutBlurText text="硬件 DIY" delay={1.83} /></li>
    </ul>
  );
}
