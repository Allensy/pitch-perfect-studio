import js from '@eslint/js';
import tseslint from 'typescript-eslint';
export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'test-results/**', 'playwright-report/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/**', '../../app/**'],
              message: 'Feature modules may use shared catalogs, not the app composition layer.',
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
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react/*',
                '@radix-ui/*',
                'motion/*',
                '@/app/**',
                '@/components/**',
                '@/features/**',
                './app/**',
                './components/**',
                './features/**',
                '../app/**',
                '../components/**',
                '../features/**',
              ],
              message: 'Music rules and service owners must not depend on React or UI modules.',
            },
          ],
        },
      ],
    },
  },
);
