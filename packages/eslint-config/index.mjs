import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

/**
 * Shared ESLint flat-config base for TypeScript repos.
 * Consumers import this array and append repo-specific overrides.
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
