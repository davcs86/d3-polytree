import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/storybook-static/**',
      '**/.turbo/**',
      '**/node_modules/**',
      // Playwright e2e outputs (C8) — reports, traces, and binary baselines.
      '**/playwright-report/**',
      '**/test-results/**',
      '**/playwright/__screenshots__/**',
      // Legacy packages imported in B1, awaiting modernization (B6).
      // raw SVG catalogue (assets only, no source)
      'packages/icons-amazon/catalog/**',
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
  },
  {
    // B10 totality tripwire (decision O11): direct model-collection mutations
    // (`collections.add`/`collections.remove`) belong only in the registered
    // command handlers. This is a cheap syntactic tripwire that catches the
    // common escape — a new feature persisting outside a handler — NOT the proof:
    // the authoritative totality gate is the execute→revert `toXML` round-trip
    // harness (bare `.position.x =`/`.size =`/`.set('status')` writes are
    // type-erased and cannot be matched by lint). Keep both.
    files: ['packages/core/src/**/*.ts'],
    ignores: [
      'packages/core/src/modelling/commands.ts',
      'packages/core/src/modelling/ModellingElement.ts',
      '**/*.test.ts'
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.object.name='collections'][callee.property.name=/^(add|remove)$/]",
          message:
            'Route model-collection mutations through a registered commandStack handler (B10, O11); the toXML round-trip harness is the authoritative totality gate.'
        }
      ]
    }
  }
);
