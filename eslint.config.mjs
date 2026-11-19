// Lint for the TypeScript code: the web app, the API and the shared packages.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', 'weiqou/web/api/**', 'services/**', 'bench/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['weiqou/web/src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
  {
    files: ['weiqou/api/src/**/*.ts', 'packages/**/*.{ts,mjs}', '*.mjs'],
    languageOptions: { globals: globals.node },
  },
  {
    rules: {
      // The codebase passes untyped JSON from the agent runtime through on purpose; keep `any` visible, not fatal.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
);
