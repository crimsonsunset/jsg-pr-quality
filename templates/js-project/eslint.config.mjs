import base from '@crimsonsunset/eslint-config';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...base,
  // Add repo-specific overrides below.
);
