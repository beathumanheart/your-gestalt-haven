import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { SAME_AS } from "./src/config/social";

/** Placeholder sitting in index.html's Person JSON-LD, swapped for the real profile list. */
const SAME_AS_TOKEN = '["__SOCIAL_SAME_AS__"]';

/**
 * The JSON-LD in index.html is static so non-JS crawlers can read it, which
 * means it can't import from src/. Inject the profile URLs at transform time
 * instead, keeping src/config/social.ts the only place handles are written.
 */
const socialSameAs = (): Plugin => ({
  name: "social-same-as",
  transformIndexHtml(html) {
    if (!html.includes(SAME_AS_TOKEN)) {
      throw new Error(
        `socialSameAs: ${SAME_AS_TOKEN} not found in index.html — the JSON-LD sameAs placeholder was renamed or removed.`,
      );
    }
    return html.replace(SAME_AS_TOKEN, JSON.stringify(SAME_AS));
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
 base: "/",
 
 server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), socialSameAs(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
