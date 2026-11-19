import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "supabase/functions"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      /* One stray `import posthog from "posthog-js"` puts every PostHog
         product back in the entry chunk, and a second client beside the one
         src/lib/posthog.ts initialises. The bundle-size e2e would catch the
         weight after a full build; this catches it at the import. */
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "posthog-js",
              message:
                "This entry bundles every PostHog product (~390 KB). Import the client from @/lib/posthog.",
            },
          ],
        },
      ],
    },
  },
);
