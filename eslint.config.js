import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    'dist',
    'node_modules',
    'coverage',
    'storybook-static',
    'build',
    'public',
    'scripts/**/*.ts',
    'backups',
  ]),

  // 1. Core JS Recommended
  js.configs.recommended,

  // 2. JS/TS Configuration and script files - No project-based type information needed
  {
    files: ['*.js', '*.cjs', '*.mjs', 'scripts/**/*.js', '.storybook/**/*.js', 'verify_streets.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      'no-console': 'off',
    },
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      'react/prop-types': 'off',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/return-await': 'error',
    },
  },

  // 3. API TypeScript files - serverless functions
  {
    files: ['api/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'max-lines-per-function': ['warn', { max: 200, skipBlankLines: true, skipComments: true }],
      'no-magic-numbers': [
        'warn',
        {
          ignore: [0, 1, -1, 2, 10, 100, 200, 400, 401, 403, 404, 405, 429, 500, 1000],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          enforceConst: true,
        },
      ],
    },
  },

  // 4. General rules for all project files in src
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    ignores: ['scripts/**/*', '.storybook/**/*', 'e2e/**/*', 'dist/**/*'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: {
      react: { version: '18.3' },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,

      // ==================== CRITICAL RULES ====================
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-alert': 'error',
      'no-restricted-globals': ['error', 'alert', 'confirm', 'prompt'],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ==================== CODE QUALITY ====================
      'react/prop-types': ['error', { skipUndeclared: true }],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      'no-magic-numbers': [
        'warn',
        {
          ignore: [0, 1, -1, 2, 10, 100, 1000],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          enforceConst: true,
        },
      ],
      'consistent-return': 'error',
      'no-empty-function': 'warn',

      // ==================== BEST PRACTICES ====================
      curly: ['error', 'all'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-with': 'error',
      radix: 'error',
      'no-useless-concat': 'error',
      'prefer-template': 'warn',
      'no-nested-ternary': 'warn',
      'max-depth': ['warn', 4],
      'max-lines-per-function': ['warn', { max: 150, skipBlankLines: true, skipComments: true }],
      'max-params': ['warn', 5],

      // ==================== REACT SPECIFIC ====================
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/no-array-index-key': 'warn',
      'react/no-danger': 'warn',
      'react/no-deprecated': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/jsx-key': ['error', { checkFragmentShorthand: true }],
      'react/boolean-prop-naming': [
        'warn',
        { rule: '^(is|has|should|can|will|did)[A-Z]([A-Za-z0-9]?)+' },
      ],
      'react/self-closing-comp': 'warn',
      'react/no-unused-prop-types': 'warn',
      'react/void-dom-elements-no-children': 'error',

      // ==================== SECURITY ====================
      'no-new-func': 'error',
      'no-script-url': 'error',
      'react/jsx-no-target-blank': 'error',

      // ==================== MIGRATION OVERRIDES ====================
      'no-undef': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },

  // 5. Test files - relax some rules
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/__tests__/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'max-lines-per-function': 'off',
      'no-magic-numbers': 'off',
    },
  },
]);
