// Vite plugin that makes `vite preview` follow deploy/caddy/portfolio.caddy.example: a route's
// own HTML entry (dist/<route>/index.html, written by scripts/generate-seo.mjs) is served
// before the SPA shell, and unknown paths get dist/404.html with a 404 status.
import { existsSync } from "node:fs";
import path from "node:path";

/** @returns {import("vite").Plugin} */
export function previewRouting() {
  return {
    name: "portfolio:preview-routing",
    configurePreviewServer(server) {
      const outDir = path.resolve(server.config.root, server.config.build.outDir);
      server.middlewares.use((request, response, next) => {
        let pathname;
        try {
          pathname = decodeURIComponent(new URL(request.url ?? "/", "http://preview.local").pathname);
        } catch {
          return next();
        }
        if (pathname === "/" || path.extname(pathname)) return next();
        const entry = path.resolve(outDir, `.${pathname}`, "index.html");
        if (entry.startsWith(`${outDir}${path.sep}`) && existsSync(entry)) {
          request.url = `${pathname.replace(/\/+$/, "")}/index.html`;
        } else {
          // Missing paths under /en get the English not-found page when the build has one.
          const english = (pathname === "/en" || pathname.startsWith("/en/")) && existsSync(path.join(outDir, "en", "404.html"));
          const notFound = english ? "/en/404.html" : "/404.html";
          if (existsSync(path.join(outDir, notFound))) {
            const writeHead = response.writeHead.bind(response);
            response.writeHead = (status, ...rest) => writeHead(status === 200 ? 404 : status, ...rest);
            request.url = notFound;
          }
        }
        next();
      });
    },
  };
}
