import { withLanguagePrefix } from "../i18n/languageRouting";
import type { PortfolioLanguage } from "../i18n/PortfolioLanguage";

/** Project pages that no longer exist. The build leaves a redirect to the index at each, in both languages. */
export const retiredProjectPaths = [
  "/projects/408",
  "/projects/harmonyos",
  "/projects/hermes-ios",
  "/projects/law-site",
  "/projects/mineradio",
  "/projects/grok-register-panel",
  "/projects/meshatlas",
  "/projects/grok2api-egress-enhancements",
  "/projects/writing-studio",
  "/projects/travel-agent",
  "/projects/tailscale-latency",
  "/projects/home-lab",
];

export function renderRetiredProjectPage(language: PortfolioLanguage, siteOrigin: string) {
  const target = withLanguagePrefix("/projects", language);
  return [
    "<!doctype html>",
    `<html lang="${language === "en" ? "en" : "zh-CN"}">`,
    "<head>",
    `<meta http-equiv="refresh" content="0; url=${target}">`,
    `<link rel="canonical" href="${siteOrigin}${target}">`,
    '<meta name="robots" content="noindex">',
    "</head>",
    "</html>",
    "",
  ].join("\n");
}
