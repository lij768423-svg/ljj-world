import type { PortfolioLanguage } from "../i18n/PortfolioLanguage";

export const shareCardSize = { width: 1200, height: 630 } as const;

/** Where the share card for one article and language lives, under public/. */
export function shareCardPath(slug: string, language: PortfolioLanguage) {
  return `/assets/share/${slug}-${language}.jpg`;
}
