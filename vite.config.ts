import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { previewRouting } from "./scripts/preview-routing.mjs";

export default defineConfig({
  plugins: [react(), previewRouting()],
  server: {
    allowedHosts: ["home-serve", "home-serve.tail32f88e.ts.net"],
  },
});
