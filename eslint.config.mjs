import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'public/**', 'templates/**', '*.js', '!eslint.config.mjs'],
  },
  // Base configuration for all TypeScript files
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      import: importPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      // Using recommended rules from @typescript-eslint
      ...typescript.configs.recommended.rules,

      // Override specific rules
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // Other rules
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // More lenient formatting rules
      'prettier/prettier': 'warn',

      // More lenient import rules
      'import/order': [
        'never',
        {
          'newlines-between': 'never',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        },
      ],
      'import/first': 'warn',
      'import/newline-after-import': 'off',
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
  },
  // More lenient rules for test files
  {
    files: ['**/*.test.ts', '**/test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  // Extremely lenient rules for new files (likely AI-generated)
  {
    files: ['src/**/new-*.ts', 'src/**/*.new.ts'],
    rules: {
      // Turn off most formatting rules for AI-generated files
      'prettier/prettier': 'off',
      'import/order': 'off',
      'import/first': 'off',
      'import/newline-after-import': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/ban-types': 'off',
      // Only keep essential type-checking rules
      '@typescript-eslint/no-var-requires': 'warn',
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
];
