// 共享的 ESLint 规则，前后端都继承
/** @type {import('eslint').Linter.RulesRecord} */
export const sharedRules = {
  semi: 'off',
  quotes: ['error', 'single', { avoidEscape: true }],
  'import/order': [
    'error',
    {
      groups: [
        'builtin',
        'external',
        'internal',
        ['parent', 'sibling'],
        'index',
        'type',
      ],
      'newlines-between': 'always',
      alphabetize: { order: 'asc' },
    },
  ],
};
