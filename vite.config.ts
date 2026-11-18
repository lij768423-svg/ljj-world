import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { previewRouting } from "./scripts/preview-routing.mjs";

// Production marks the home boot screen in scripts/generate-seo.mjs. The dev server serves index.html for
// every route, so mark the home paths here too; otherwise a light boot screen cuts to the dark intro.
function homeBootScreen(): Plugin {
  return {
    name: "home-boot-screen",
    apply: "serve",
    transformIndexHtml(html, context) {
      const path = (context.originalUrl ?? context.path).split(/[?#]/)[0];
      if (path !== "/" && path !== "/en" && path !== "/en/") return html;
      return html.replace('<div class="boot-loader"', '<div class="boot-loader is-home"');
    },
  };
}

export default defineConfig({
  plugins: [react(), previewRouting(), homeBootScreen()],
  server: {
    allowedHosts: ["home-serve", "home-serve.tail32f88e.ts.net"],
  },
});
