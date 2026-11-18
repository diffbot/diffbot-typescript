// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";

// Scope is src/ only (per the Phase 0 plan): tests, scripts, and generated/vendored
// files are excluded rather than relaxed, so this stays strict-type-checked as shipped
// rather than drifting rule-by-rule.
export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "src/generated/**",
      "fixtures/**",
      "tests/**",
      "scripts/**",
      "*.config.*",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // `as` is confined to the decode module; everywhere else in src/ must go through
    // its readJson/readText/readBytes/readNdjson/parseJsonText instead of casting.
    files: ["src/**/*.ts"],
    rules: {
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
    },
  },
  {
    files: ["src/decode.ts"],
    rules: {
      "@typescript-eslint/consistent-type-assertions": "off",
    },
  },
  {
    // src/node/** is filesystem-only glue code outside the core fetch/JSON path the
    // decode-module rule is about (see src/decode.ts's header); Node error narrowing
    // (`error as NodeJS.ErrnoException`) is idiomatic here.
    files: ["src/node/**/*.ts"],
    rules: {
      "@typescript-eslint/consistent-type-assertions": "off",
    },
  },
);
