import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

// The color rule below is the enforcement behind "theme is tokens, never
// literals": a component that hardcodes a hex or rgb()/hsl() value cannot be
// restyled from app/globals.css, which silently breaks every user's theme.
const COLOR_LITERAL_RULES = [
  {
    selector: "Literal[value=/^#(?:[0-9a-fA-F]{3,8})$/]",
    message: "No hex color literals in components — add a token to app/globals.css and use it."
  },
  {
    selector: "Literal[value=/(?:rgba?|hsla?)\\(/]",
    message: "No rgb()/hsl() color literals in components — add a token to app/globals.css and use it."
  },
  {
    selector: "TemplateElement[value.cooked=/(?:rgba?|hsla?)\\(/]",
    message: "No rgb()/hsl() color literals in components — add a token to app/globals.css and use it."
  }
];

export default tseslint.config(
  { ignores: [".next/", ".next-dev/", "out/", "node_modules/", "**/*.config.*", "next-env.d.ts"] },

  eslint.configs.recommended,

  {
    // Type-aware linting is scoped to the TypeScript program. Applying it
    // repo-wide would fail on any file tsconfig.json does not include.
    files: ["**/*.ts", "**/*.tsx"],
    extends: [...tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname }
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: { attributes: false } }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "object-shorthand": "error",
      curly: "error",
      "no-console": "warn"
    }
  },

  {
    files: ["components/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
    rules: { "no-restricted-syntax": ["error", ...COLOR_LITERAL_RULES] }
  },

  {
    // Build and validation scripts are plain Node ESM: outside the TypeScript
    // program, and free to write to stdout since their output is the interface.
    files: ["scripts/**/*.mjs"],
    languageOptions: { globals: globals.node },
    rules: { "no-console": "off" }
  },

  {
    files: ["**/*.test.{ts,tsx}"],
    rules: {
      "no-console": "off",
      // node:test's test() returns a thenable the runner owns; not awaiting it
      // is the intended usage.
      "@typescript-eslint/no-floating-promises": "off"
    }
  },

  eslintConfigPrettier
);
