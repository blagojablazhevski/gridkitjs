import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  {
    // Generated output, plus config files that sit outside any tsconfig
    // project and so cannot be type-checked by the rules below.
    ignores: [
      "**/dist/**",
      "**/coverage/**",
      ".history/**",
      "**/*.config.{js,mjs,cjs,ts}",
      "**/playwright/.cache/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  reactHooks.configs.flat.recommended,
  {
    languageOptions: {
      parserOptions: {
        // Resolves each file to its nearest tsconfig, which is what makes the
        // type-aware rules work across every package in the workspace.
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
