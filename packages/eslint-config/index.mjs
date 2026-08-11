import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import { flatConfigs as importXConfigs } from 'eslint-plugin-import-x';
import nodePlugin from 'eslint-plugin-n';
import unicorn from 'eslint-plugin-unicorn';
import tseslint from 'typescript-eslint';

const NODE_FILES = [
  'scripts/**/*.{js,mjs,cjs,ts,mts,cts}',
  'bin/**/*.{js,mjs,cjs,ts,mts,cts}',
  '**/*.{mjs,cjs}',
];

const nodeRecommended = nodePlugin.configs['flat/recommended'];

/**
 * Shared ESLint flat-config base for TypeScript and JavaScript repos.
 * Consumers import this array and append repo-specific overrides.
 *
 * Uses the untyped `tseslint.configs.recommended` tier rather than a
 * type-checked one, so this base works for plain-JS consumers too and never
 * requires a consumer's tsconfig to be wired up. TypeScript consumers should
 * layer `@crimsonsunset/eslint-config/recommended-type-checked` (CLI default
 * when a tsconfig exists). The stricter `strictTypeChecked` surface lives at
 * `@crimsonsunset/eslint-config/type-checked`.
 *
 * `stylistic` is cosmetic (Prettier-compatible) and kept for continuity.
 *
 * @example
 * import base from '@crimsonsunset/eslint-config';
 * export default tseslint.config(...base, { rules: { ... } });
 */
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // Stylistic-only rules (no type info required), e.g. consistent-type-imports.
  ...tseslint.configs.stylistic,
  unicorn.configs.unopinionated,
  importXConfigs.recommended,
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  // Node-context only — browser consumers (e.g. content scripts) stay clear of n/*.
  {
    files: NODE_FILES,
    plugins: { n: nodePlugin },
    languageOptions: {
      ...nodeRecommended.languageOptions,
      globals: {
        console: 'readonly',
        process: 'readonly',
        ...nodeRecommended.languageOptions?.globals,
      },
    }, // globals merge is intentional when the preset omits them
    rules: {
      ...nodeRecommended.rules,
      // CLIs and CI orchestrators exit deliberately.
      'n/no-process-exit': 'off',
      // Shebangs on `scripts/ci/*.mjs` are intentional for direct node execution.
      'n/hashbang': 'off',
    },
  },
  {
    rules: {
      // Common in CJS-shaped tooling and scripts; not a defect class we gate on.
      'unicorn/prefer-top-level-await': 'off',
      // Locale-aware sort is rarely the bug we're hunting in CI scripts.
      'unicorn/no-array-sort': 'off',
      'unicorn/require-array-sort-compare': 'off',
    },
  },
  // Disable ESLint formatting rules that conflict with Prettier.
  eslintConfigPrettier,
);
