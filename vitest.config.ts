import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Pure, runtime-agnostic modules shared with the process-booking edge
      // function. The guardrail tests import the real code rather than a copy
      // of it, so drift in the function shows up here.
      "@edge": path.resolve(__dirname, "./supabase/functions/process-booking/lib"),
    },
  },
});
