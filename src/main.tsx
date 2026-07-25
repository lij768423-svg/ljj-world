import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@fontsource-variable/manrope";
import "./styles.css";
import "./effects.css";

const savedTheme = window.localStorage.getItem("portfolio-color-mode");
document.documentElement.dataset.theme = savedTheme === "dark" ? "dark" : "light";
window.localStorage.removeItem("portfolio-theme");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
