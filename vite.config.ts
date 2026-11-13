import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { COUNTRY_COUNT, ELECTION_COUNT, FIRST_YEAR, LAST_YEAR, VOTING_SYSTEM_COUNT, catalogFacts } from "./src/content/facts";

// Build identity: the short commit SHA and the package version. Error reports
// carry both, so a stack maps to a release and a commit.
let release = "unknown";
try { release = execSync("git rev-parse --short HEAD").toString().trim(); } catch { /* not a git checkout */ }
const appVersion = (JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string }).version;

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

// The store and marketing counts as JSON, next to index.html
// (/games/margin-of-victory/catalog-facts.json on the web), so the Lakeside store
// reads the same numbers the game shows. Generated from the content data on
// every build; no prices in it.
const catalogFactsJson: Plugin = {
  name: "mov-catalog-facts",
  apply: "build",
  generateBundle() {
    this.emitFile({ type: "asset", fileName: "catalog-facts.json", source: `${JSON.stringify(catalogFacts(), null, 2)}\n` });
  },
};

// Static SPA build. Output is plain static assets so it wraps directly in Tauri
// later with no rewrite. No SSR, no server framework.
export default defineConfig({
  base: "./",
  plugins: [react(), htmlFacts, catalogFactsJson],
  define: {
    "import.meta.env.VITE_RELEASE": JSON.stringify(release),
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
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
        // React and the other libraries change far less often than app code,
        // so they get their own long-cached chunk. Content is not grouped by
        // hand: each game shell and each country bundle is a dynamic import,
        // so Rollup gives it its own chunk that loads only when needed, and
        // the landing page downloads metadata only.
        manualChunks: (id) => (id.includes("node_modules") ? "vendor" : undefined),
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
