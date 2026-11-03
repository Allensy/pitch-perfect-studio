import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const uiDependencies = {
  group: [
    'react',
    'react/*',
    '@radix-ui/*',
    'motion/*',
    '**/app/**',
    '**/components/**',
    '**/features/**',
  ],
  message: 'Pure models and service owners must not depend on React or UI modules.',
};

const applicationTypes = {
  group: ['**/domain/types', '**/domain/types.ts'],
  importNames: ['AppState', 'Runtime'],
  message:
    'Views use explicit data and callbacks. Whole app/runtime wiring belongs in src/app adapters.',
};

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'test-results/**', 'playwright-report/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  },
  {
    files: ['src/features/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            applicationTypes,
            {
              group: ['**/app/**'],
              message: 'Features and reusable components must not depend on app composition.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/domain/**', '**/features/**', '**/app/**'],
              message:
                'UI primitives are product-agnostic; business concepts belong at the feature boundary.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'src/domain/**/*.{ts,tsx}',
      'src/audio.ts',
      'src/runtime.ts',
      'src/persistence.ts',
      'src/store.ts',
    ],
    rules: { 'no-restricted-imports': ['error', { patterns: [uiDependencies] }] },
  },
  {
    files: [
      'src/shared/**/*.ts',
      'src/features/**/*-model.ts',
      'src/features/**/*-presentation.ts',
      'src/features/**/options.ts',
      'src/features/**/copy.ts',
      'src/components/practice-options.ts',
    ],
    rules: {
      'no-restricted-imports': ['error', { patterns: [applicationTypes, uiDependencies] }],
    },
  },
);
