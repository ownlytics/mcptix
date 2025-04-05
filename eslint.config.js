const typescript = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const importPlugin = require('eslint-plugin-import');
const prettierPlugin = require('eslint-plugin-prettier');

module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'public/**', 'templates/**', '*.js', '!eslint.config.js'],
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
      // Use a subset of recommended rules instead of all
      '@typescript-eslint/adjacent-overload-signatures': 'error',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/ban-types': 'warn',
      'no-array-constructor': 'off',
      '@typescript-eslint/no-array-constructor': 'error',
      '@typescript-eslint/no-duplicate-enum-values': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-extra-non-null-assertion': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-misused-new': 'error',
      '@typescript-eslint/no-namespace': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-this-alias': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-var-requires': 'warn',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/triple-slash-reference': 'error',

      // Other rules
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // More lenient formatting rules
      'prettier/prettier': 'warn',

      // More lenient import rules
      'import/order': [
        'warn',
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
