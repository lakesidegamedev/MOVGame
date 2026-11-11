import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { execSync } from "node:child_process";
import { COUNTRY_COUNT, ELECTION_COUNT, FIRST_YEAR, LAST_YEAR, VOTING_SYSTEM_COUNT } from "./src/content/facts";

// Release = current commit SHA, so GlitchTip events map to a commit.
let release = "unknown";
try { release = execSync("git rev-parse --short HEAD").toString().trim(); } catch { /* not a git checkout */ }

// index.html carries counts for search and link previews. They come from the
// scenario registry at build time so they never go stale.
const HTML_FACTS: Record<string, number> = { ELECTION_COUNT, COUNTRY_COUNT, VOTING_SYSTEM_COUNT, FIRST_YEAR, LAST_YEAR };
const htmlFacts = {
  name: "mov-html-facts",
  transformIndexHtml: (html: string) =>
    html.replace(/__MOV_([A-Z_]+)__/g, (token, key: string) => {
      if (!(key in HTML_FACTS)) throw new Error(`index.html: unknown fact ${token}`);
      return String(HTML_FACTS[key]);
    }),
};

// Static SPA build. Output is plain static assets so it wraps directly in Tauri
// later with no rewrite. No SSR, no server framework.
export default defineConfig({
  base: "./",
  plugins: [react(), htmlFacts],
  define: {
    "import.meta.env.VITE_RELEASE": JSON.stringify(release),
  },
  resolve: {
    alias: {
      "@engine": fileURLToPath(new URL("./src/engine", import.meta.url)),
      "@content": fileURLToPath(new URL("./src/content", import.meta.url)),
      "@ui": fileURLToPath(new URL("./src/ui", import.meta.url)),
      "@persistence": fileURLToPath(new URL("./src/persistence", import.meta.url)),
      "@store": fileURLToPath(new URL("./src/store", import.meta.url)),
      "@lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Long-cache chunks: React and the content tables change far less often
        // than app code, so a deploy that only touches the interface keeps them
        // cached. Content is grouped by engine path; every chunk stays under
        // Vite's 500 kB warning and downloads in parallel.
        manualChunks: (id) => {
          if (id.includes("node_modules")) return "vendor";
          if (/\/src\/content\/countries\/paths\//.test(id)) return "country-maps";
          if (/\/src\/content\/countries\//.test(id)) return "countries";
          if (/\/src\/content\/(historicalEvents|scenarios|statePaths|events|endorsements|states)\.ts$/.test(id)) return "us-content";
          // UK region paths stay with the lazy screens that draw them.
          if (/\/src\/content\/uk\/(?!regionPaths)/.test(id)) return "uk-content";
          return undefined;
        },
      },
    },
  },
  server: {
    // Dev-mode API passthrough to the campaign backend (npm run server).
    proxy: {
      "/api": `http://localhost:${process.env.CAMPAIGN_API_PORT ?? 3401}`,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "server/**/*.test.{ts,tsx}"],
  },
});
