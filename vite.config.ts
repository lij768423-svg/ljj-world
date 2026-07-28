import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["home-serve", "home-serve.tail32f88e.ts.net"],
  },
});
