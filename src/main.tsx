import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./ui/styles.css";
import { BUILD_COMMIT, DISTRIBUTION } from "@lib/distribution";
import { initErrorReporting } from "@lib/errorReporting";

if (DISTRIBUTION.preview) document.title = `Margin of Victory PREVIEW ${BUILD_COMMIT}, not for distribution`;

initErrorReporting({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  channel: DISTRIBUTION.channel,
  version: import.meta.env.VITE_APP_VERSION,
  commit: BUILD_COMMIT,
});

// Privacy-friendly analytics (self-hosted umami). Inert until a website id is
// configured in .env.production: register the site in the umami UI and set
// VITE_UMAMI_WEBSITE_ID (+ optional VITE_UMAMI_SRC).
const umamiId = import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined;
if (umamiId) {
  const s = document.createElement("script");
  s.defer = true;
  s.src = (import.meta.env.VITE_UMAMI_SRC as string | undefined) ?? "https://analytics.ahousedividedgame.com/script.js";
  s.dataset.websiteId = umamiId;
  document.head.appendChild(s);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
