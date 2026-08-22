import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { staticPersonNode, staticServiceNode } from "./src/config/identity";

/**
 * The JSON-LD in index.html is static so non-JS crawlers can read it, which
 * means it can't import from src/. Inject the nodes at transform time instead,
 * keeping src/config/identity.ts the only place these facts are written.
 */
const JSONLD_TOKENS = {
  '"__JSONLD_PERSON__"': staticPersonNode,
  '"__JSONLD_SERVICE__"': staticServiceNode,
} as const;

const siteJsonLd = (): Plugin => ({
  name: "site-json-ld",
  transformIndexHtml(html) {
    return Object.entries(JSONLD_TOKENS).reduce((acc, [token, build]) => {
      if (!acc.includes(token)) {
        throw new Error(
          `siteJsonLd: ${token} not found in index.html — the JSON-LD placeholder was renamed or removed.`,
        );
      }
      return acc.replace(token, JSON.stringify(build(), null, 2));
    }, html);
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
 base: "/",
 
 server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), siteJsonLd(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
