import path from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";

const base = path.dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory: base,
  recommendedConfig: js.configs.recommended,
});

export default [
  {
    ignores: ["eslint.config.js", "dist"],
  },
  ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
  ),
  {
    files: ["**/*.{ts,tsx,mjs,cjs,js}"],
    languageOptions: {
      parser,
      parserOptions: {
        project: path.resolve(base, "tsconfig.json"),
        tsconfigRootDir: base,
        sourceType: "module",
        ecmaVersion: "latest",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      import: importPlugin,
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: path.resolve(base, "tsconfig.json"),
          alwaysTryTypes: true,
          resolveFullPaths: true,
        },
      },
    },
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^\\$|_",
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "no-empty": "off",
    },
  },
];
