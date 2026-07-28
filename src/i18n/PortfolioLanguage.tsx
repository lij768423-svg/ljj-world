import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { portfolioTranslations } from "./portfolioTranslations";

export type PortfolioLanguage = "zh" | "en";

type PortfolioLanguageContextValue = {
  language: PortfolioLanguage;
  toggleLanguage: () => void;
};

const PortfolioLanguageContext = createContext<PortfolioLanguageContextValue | null>(null);
const HAN_PATTERN = /[\u3400-\u9fff]/u;
const SCRAMBLABLE_PATTERN = /[\p{L}\p{N}\u3400-\u9fff]/u;
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@%+";
const TRANSLATED_ATTRIBUTES = ["title", "aria-label", "alt", "placeholder", "content"] as const;
const SKIP_SELECTOR = "[data-no-translate], script, style, noscript, canvas, .decrypted-text, .blur-text";
const originalText = new WeakMap<Text, string>();
const expectedText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
let activeAnimationFrame: number | null = null;

function translateDynamicText(value: string) {
  let match = value.match(/^(\d+) 个真实项目，按产品、AI 工具与服务器项目整理。$/u);
  if (match) return `${match[1]} real projects across products, AI tools, and infrastructure.`;

  match = value.match(/^(\d+) 个持续生长的项目$/u);
  if (match) return `${match[1]} evolving projects`;

  match = value.match(/^第 (\d+) 张，共 (\d+) 张$/u);
  if (match) return `${match[1]} of ${match[2]}`;

  match = value.match(/^(.+) 项目地址$/u);
  if (match) return `${match[1]} links`;

  return null;
}

export function translatePortfolioText(value: string) {
  if (!HAN_PATTERN.test(value)) return value;
  const leading = value.match(/^\s*/u)?.[0] ?? "";
  const trailing = value.match(/\s*$/u)?.[0] ?? "";
  const core = value.slice(leading.length, value.length - trailing.length);
  const normalized = core.replace(/\s+/gu, " ").trim();
  const translated = portfolioTranslations[normalized] ?? translateDynamicText(normalized);
  return translated ? `${leading}${translated}${trailing}` : value;
}

function randomGlyph() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

function scrambleCharacters(value: string, amount: number, reveal = false) {
  const characters = Array.from(value);
  const indexes = characters
    .map((character, index) => SCRAMBLABLE_PATTERN.test(character) ? index : -1)
    .filter((index) => index >= 0);
  const affected = Math.round(indexes.length * Math.min(1, Math.max(0, amount)));

  indexes.forEach((characterIndex, order) => {
    const shouldScramble = reveal ? order >= affected : order < affected;
    if (shouldScramble) characters[characterIndex] = randomGlyph();
  });
  return characters.join("");
}

export function getDecryptedTransitionFrame(from: string, to: string, progress: number) {
  const clamped = Math.min(1, Math.max(0, progress));
  if (clamped <= 0) return from;
  if (clamped >= 1) return to;
  if (clamped < 0.4) return scrambleCharacters(from, clamped / 0.4);
  if (clamped < 0.5) return scrambleCharacters(from, 1);
  return scrambleCharacters(to, (clamped - 0.5) / 0.5, true);
}

function shouldSkip(node: Node) {
  const element = node instanceof Element ? node : node.parentElement;
  return !element || Boolean(element.closest(SKIP_SELECTOR));
}

function writeText(node: Text, value: string) {
  if (node.data === value) return;
  expectedText.set(node, value);
  node.data = value;
}

function textTarget(node: Text, language: PortfolioLanguage) {
  const current = node.data;
  let source = originalText.get(node);
  if (!source && HAN_PATTERN.test(current)) {
    source = current;
    originalText.set(node, source);
  }
  if (!source) return current;
  return language === "en" ? translatePortfolioText(source) : source;
}

function isVisible(node: Text) {
  const parent = node.parentElement;
  if (!parent || parent.closest(".sr-only, [aria-hidden='true']")) return false;
  if (!parent.getClientRects().length) return false;
  const rect = parent.getBoundingClientRect();
  return rect.bottom >= 0 && rect.top <= window.innerHeight && rect.right >= 0 && rect.left <= window.innerWidth;
}

function applyAttributes(root: ParentNode, language: PortfolioLanguage) {
  const elements = root instanceof Element ? [root, ...root.querySelectorAll("*")] : [...root.querySelectorAll("*")];
  elements.forEach((element) => {
    if (shouldSkip(element)) return;
    let originals = originalAttributes.get(element);
    TRANSLATED_ATTRIBUTES.forEach((attribute) => {
      const current = element.getAttribute(attribute);
      if (current === null) return;
      const stored = originals?.get(attribute);
      if (HAN_PATTERN.test(current) && stored !== current) {
        originals ??= new Map<string, string>();
        originals.set(attribute, current);
        originalAttributes.set(element, originals);
      }
      const source = originals?.get(attribute);
      if (!source) return;
      const target = language === "en" ? translatePortfolioText(source) : source;
      if (current !== target) element.setAttribute(attribute, target);
    });
  });
}

function collectTextNodes(root: Node) {
  const nodes: Text[] = [];
  if (root instanceof Text) {
    if (!shouldSkip(root)) nodes.push(root);
    return nodes;
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => shouldSkip(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }
  return nodes;
}

function stopActiveAnimation() {
  if (activeAnimationFrame === null) return;
  window.cancelAnimationFrame(activeAnimationFrame);
  activeAnimationFrame = null;
}

function animateTextNodes(jobs: Array<{ node: Text; from: string; to: string }>) {
  stopActiveAnimation();
  if (!jobs.length) return;
  const startedAt = performance.now();
  const duration = 620;
  document.documentElement.dataset.languageTransitioning = "true";

  const update = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    jobs.forEach(({ node, from, to }) => {
      if (node.isConnected) writeText(node, getDecryptedTransitionFrame(from, to, progress));
    });
    if (progress < 1) {
      activeAnimationFrame = window.requestAnimationFrame(update);
      return;
    }
    jobs.forEach(({ node, to }) => {
      if (node.isConnected) writeText(node, to);
    });
    activeAnimationFrame = null;
    delete document.documentElement.dataset.languageTransitioning;
  };

  activeAnimationFrame = window.requestAnimationFrame(update);
}

function applyLanguage(language: PortfolioLanguage, animateVisible: boolean, root: Node = document.documentElement) {
  if ("querySelectorAll" in root) applyAttributes(root as ParentNode, language);
  const jobs: Array<{ node: Text; from: string; to: string }> = [];
  collectTextNodes(root).forEach((node) => {
    const target = textTarget(node, language);
    if (target === node.data) return;
    if (animateVisible && isVisible(node)) jobs.push({ node, from: node.data, to: target });
    else writeText(node, target);
  });
  if (animateVisible) animateTextNodes(jobs);
}

function GlobalLanguageTransition({ language }: { language: PortfolioLanguage }) {
  const previousLanguage = useRef(language);
  const languageRef = useRef(language);
  languageRef.current = language;

  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const languageChanged = previousLanguage.current !== language;
    previousLanguage.current = language;
    document.documentElement.lang = language === "en" ? "en" : "zh-CN";
    document.documentElement.dataset.language = language;
    applyLanguage(language, languageChanged && !reducedMotion);
  }, [language]);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") {
          const node = mutation.target as Text;
          const expected = expectedText.get(node);
          if (expected === node.data) {
            expectedText.delete(node);
            return;
          }
          if (shouldSkip(node)) return;
          if (HAN_PATTERN.test(node.data)) originalText.set(node, node.data);
          const target = textTarget(node, languageRef.current);
          if (target !== node.data) writeText(node, target);
          return;
        }

        if (mutation.type === "attributes") {
          applyAttributes(mutation.target as Element, languageRef.current);
          return;
        }

        mutation.addedNodes.forEach((node) => applyLanguage(languageRef.current, false, node));
      });
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATED_ATTRIBUTES],
    });
    return () => {
      observer.disconnect();
      stopActiveAnimation();
      delete document.documentElement.dataset.languageTransitioning;
    };
  }, []);

  return null;
}

export function PortfolioLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<PortfolioLanguage>(() => (
    window.localStorage.getItem("portfolio-language") === "zh" ? "zh" : "en"
  ));

  useEffect(() => {
    window.localStorage.setItem("portfolio-language", language);
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage((current) => current === "zh" ? "en" : "zh");
  }, []);

  const value = useMemo(() => ({ language, toggleLanguage }), [language, toggleLanguage]);

  return (
    <PortfolioLanguageContext.Provider value={value}>
      {children}
      <GlobalLanguageTransition language={language} />
    </PortfolioLanguageContext.Provider>
  );
}

export function usePortfolioLanguage() {
  const context = useContext(PortfolioLanguageContext);
  if (!context) throw new Error("usePortfolioLanguage must be used inside PortfolioLanguageProvider");
  return context;
}
