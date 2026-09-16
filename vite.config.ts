import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { injectSiteJsonLd } from "./scripts/static-site/jsonLd";
import { staticSite } from "./scripts/static-site/plugin";

/**
 * The JSON-LD in index.html is static so non-JS crawlers can read it, which
 * means it can't import from src/. Inject the nodes at transform time instead,
 * keeping src/config/identity.ts the only place these facts are written.
 */
const siteJsonLd = (): Plugin => ({
  name: "site-json-ld",
  transformIndexHtml: injectSiteJsonLd,
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
 base: "/",
 
 server: {
    host: "::",
    port: 8080,
  },
  // staticSite() runs last: it reads the index.html the others have produced.
  plugins: [
    react(),
    siteJsonLd(),
    staticSite(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
