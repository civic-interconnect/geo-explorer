// eslint.config.js
import { defineConfig } from "eslint/config";
import js from "@eslint/js";

export default defineConfig([
  {
    files: ["**/*.js"], // Apply this configuration to all .js files
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        // Define any global variables your project uses, e.g.,
        // "window": "readonly",
        // "document": "readonly",
      },
    },
    extends: [
      js.configs.recommended, // Use ESLint's recommended rules
    ],
    rules: {
      // Add or override specific rules here
      "no-unused-vars": "warn", // Example: warn about unused variables
      "no-undef": "error", // Example: error on undefined variables
      indent: ["error", 2], // Example: enforce 2-space indentation
      quotes: ["error", "double"], // Example: enforce double quotes
      semi: ["error", "always"], // Example: enforce semicolons
    },
  },
  // ---------- Browser-specific override ----------
  {
    files: ["docs/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        CustomEvent: "readonly",
        HTMLElement: "readonly",
        Node: "readonly",
        Event: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
      },
    },
  },
]);
