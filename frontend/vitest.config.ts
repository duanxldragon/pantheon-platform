module.exports = {
  // TypeScript plugin can't automatically detect JSX in .tsx files
  extensions: ['.ts', '.tsx'],
  // The default root directory
  root: '.',
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  // Module resolution
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Coverage
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    exclude: [
      'node_modules/',
      'src/**/*.d.ts',
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'src/**/*.spec.ts',
      'src/**/*.spec.tsx',
    ],
  },
};
