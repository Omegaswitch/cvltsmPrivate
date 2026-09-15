const browserGlobals = [
  'window', 'document', 'performance', 'requestAnimationFrame', 'setTimeout', 'clearTimeout',
  'console', 'fetch', 'AbortController', 'sessionStorage', 'localStorage', 'globalThis',
  'navigator', 'CustomEvent', 'Event', 'WheelEvent',
];

export default [
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: Object.fromEntries(browserGlobals.map((g) => [g, 'readonly'])),
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { args: 'none' }],
      'no-dupe-keys': 'error',
      'no-unreachable': 'error',
      'no-const-assign': 'error',
    },
  },
];
