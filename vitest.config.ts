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
      // The worksheet email and the helpers both functions share. Imported by
      // the guardrail tests so they assert on the real bytes, not a copy.
      "@shared": path.resolve(__dirname, "./supabase/functions/_shared"),
      "@takesignup": path.resolve(__dirname, "./supabase/functions/take-signup/lib"),
    },
  },
});
