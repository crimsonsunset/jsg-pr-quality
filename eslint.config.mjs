import base from '@crimsonsunset/eslint-config';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...base,
  {
    ignores: ['templates/**', 'packages/cli/templates/**', 'docs/**'],
  },
  {
    // scripts/**/*.mjs Node globals now come from the shared base config.
    files: ['packages/cli/**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
  },
);
