import base from '@crimsonsunset/eslint-config';
import recommendedTypeChecked from '@crimsonsunset/eslint-config/recommended-type-checked';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...base,
  ...recommendedTypeChecked,
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // Add repo-specific overrides below.
);
