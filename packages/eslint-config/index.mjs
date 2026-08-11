import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

/**
 * Shared ESLint flat-config base for TypeScript repos.
 * Consumers import this array and append repo-specific overrides.
 *
 * Uses the untyped `tseslint.configs.recommended` tier rather than a
 * type-checked one, so this base works for plain-JS consumers too and never
 * requires a consumer's tsconfig to be wired up. Repos that want type-aware
 * rules (`no-floating-promises`, `no-unsafe-assignment`, etc.) should layer
 * `@crimsonsunset/eslint-config/type-checked` on top — see that file.
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
  // Disable ESLint formatting rules that conflict with Prettier.
  eslintConfigPrettier,
);
