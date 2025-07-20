import eslint from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: { sourceType: 'module' }
    },
    plugins: { '@typescript-eslint': ts },
    rules: {
      ...eslint.configs.recommended.rules,
      ...ts.configs.recommended.rules
    }
  }
];
