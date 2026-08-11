import base from '@crimsonsunset/eslint-config';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...base,
  {
    ignores: ['templates/**', 'packages/cli/templates/**', 'docs/**'],
  },
  {
    files: ['packages/cli/**/*.mjs', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
  },
);
