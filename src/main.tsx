import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ENGLISH_PREFIX, languageFromPath, resolveInitialLanguage, withLanguagePrefix } from "./i18n/languageRouting";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@fontsource-variable/manrope";
import "./styles.css";
import "./effects.css";

const savedTheme = window.localStorage.getItem("portfolio-color-mode");
const savedLanguage = resolveInitialLanguage(window.location.pathname, window.localStorage.getItem("portfolio-language"), navigator.languages ?? [navigator.language]);
// The URL names the language. A visit that should start in English but arrived at a neutral path
// moves under /en before the app mounts, so the address, <html lang> and the router agree; "/en"
// without a trailing slash becomes "/en/" so the router sees "/" as the route.
const { pathname, search, hash } = window.location;
if (savedLanguage === "en" && (!languageFromPath(pathname) || pathname === ENGLISH_PREFIX)) {
  window.history.replaceState(window.history.state, "", `${withLanguagePrefix(pathname, "en")}${search}${hash}`);
}
document.documentElement.dataset.theme = savedTheme === "dark" ? "dark" : "light";
// The home boot screen is the intro's first frame. If its wordmark is already showing, the intro
// keeps it on screen instead of fading it in a second time.
const bootMark = document.querySelector<HTMLElement>(".boot-loader.is-home .boot-loader-mark");
if (bootMark && Number.parseFloat(getComputedStyle(bootMark).opacity) > 0.05) document.documentElement.dataset.bootShown = "true";
document.documentElement.dataset.language = savedLanguage;
document.documentElement.lang = savedLanguage === "en" ? "en" : "zh-CN";
window.localStorage.removeItem("portfolio-theme");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
