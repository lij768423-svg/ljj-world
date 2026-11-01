// The site's URL carries the language: Chinese pages live at "/…", English pages at "/en/…".
// Crawlers get a prerendered entry per language (scripts/generate-seo.mjs) and the app boots in
// the language the path names. These helpers are shared by the runtime and the build.
import type { PortfolioLanguage } from "./PortfolioLanguage";

export const ENGLISH_PREFIX = "/en";

/** "en" when the pathname is under the English prefix, otherwise null. */
export function languageFromPath(pathname: string): PortfolioLanguage | null {
  return pathname === ENGLISH_PREFIX || pathname.startsWith(`${ENGLISH_PREFIX}/`) ? "en" : null;
}

/** The language-neutral route for a pathname: "/en/projects" → "/projects", "/en/" → "/". */
export function stripLanguagePrefix(pathname: string) {
  if (!languageFromPath(pathname)) return pathname || "/";
  const rest = pathname.slice(ENGLISH_PREFIX.length);
  return rest === "" || rest === "/" ? "/" : rest;
}

/** The pathname for a neutral route in a language: ("/projects", "en") → "/en/projects", ("/", "en") → "/en/". */
export function withLanguagePrefix(route: string, language: PortfolioLanguage) {
  const neutral = stripLanguagePrefix(route);
  if (language !== "en") return neutral;
  return neutral === "/" ? `${ENGLISH_PREFIX}/` : `${ENGLISH_PREFIX}${neutral}`;
}

/** Language for a first visit with no saved choice: Chinese when the browser prefers it, else English. */
export function languageFromBrowser(languages: readonly string[]): PortfolioLanguage {
  return languages.some((tag) => /^zh\b/i.test(tag)) ? "zh" : "en";
}

/** Resolve the language a visit should start in, in priority order: URL prefix, saved choice, browser. */
export function resolveInitialLanguage(pathname: string, saved: string | null, languages: readonly string[]): PortfolioLanguage {
  return languageFromPath(pathname) ?? (saved === "zh" || saved === "en" ? saved : languageFromBrowser(languages));
}
