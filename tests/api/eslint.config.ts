import typescriptEslint from "@typescript-eslint/eslint-plugin";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import { globalIgnores } from "eslint/config";
import globals from "globals";

// these are ESM imports, so we need to use require to bypass type checking errors
const tsParser = require("@typescript-eslint/parser");
const cspellESLintPluginRecommended = require("@cspell/eslint-plugin/recommended");

export default [
  globalIgnores(["**/node_modules/**/*", "**/*.js"]),

  cspellESLintPluginRecommended,

  {
    files: ["**/*.ts"],
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
      globals: {
        ...globals.node, // to recognize node globals, such as console, process, etc.
        ...globals.jest, // to recognize jest globals, such as describe, it, expect, etc.
        ...globals.jasmine, // to recognize not documented jest globals, such as fail, etc.
        ...globals.browser, // to recognize browser globals, such as fetch, etc.
      },

      parser: tsParser,
    },

    rules: {
      // TypeScript ESLint rules
      ...typescriptEslint.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          "ts-ignore": "allow-with-description",
        },
      ],
      "@typescript-eslint/consistent-type-assertions": ["off"],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/no-shadow": ["error"],
      "@typescript-eslint/no-unused-expressions": ["error"],
      "@typescript-eslint/no-unused-vars": "off",

      // ESLint rules
      "no-empty": "off",
      "no-useless-escape": "off",
      "no-case-declarations": "off",
      "no-negated-condition": ["error"],
      "no-nested-ternary": ["error"],
      "no-restricted-imports": [
        "error",
        {
          patterns: ["..", "../*", "node_modules/*"],
        },
      ],
      curly: ["error"],
    },
  },

  // README recommends to keep this at the end of the config to override other default rules
  eslintPluginPrettierRecommended,
];
