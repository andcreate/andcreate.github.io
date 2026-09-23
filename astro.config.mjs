// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// User site repository (andcreate.github.io), so no `base` is needed.
export default defineConfig({
  site: "https://andcreate.github.io",
  vite: {
    plugins: [tailwindcss()],
  },
});
