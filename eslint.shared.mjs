// 共享的 ESLint 规则，前后端都继承
/** @type {import('eslint').Linter.RulesRecord} */
export const sharedRules = {
  semi: 'off',
  quotes: ['error', 'single', { avoidEscape: true }],
  '@typescript-eslint/quotes': ['error', 'single', { avoidEscape: true }],
};
