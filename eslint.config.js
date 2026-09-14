import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/storybook-static/**',
      '**/.turbo/**',
      '**/node_modules/**',
      // Legacy packages imported in B1, awaiting modernization (B6).
      'packages/icons-amazon/**',
      '!**/.storybook'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module'
    },
    rules: {
      // TypeScript's type checker handles undefined references; the core rule
      // false-positives on DOM/globals under flat config.
      'no-undef': 'off'
    }
  }
);
