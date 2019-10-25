module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    // broken https://github.com/eslint/eslint/issues?utf8=%E2%9C%93&q=is%3Aissue+is%3Aopen+require-atomic-updates
    'require-atomic-updates': 0,
    'no-unused-vars': [
      'error',
      { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
    ],
  },
  // https://stackoverflow.com/a/49211283/710693
  overrides: [
    {
      files: [
        '**/*.test.js',
        '**/*.spec.js',
        'src/jestUtils/customMatchers.js',
        'src/jestUtils/setup.js',
      ],
      env: {
        jest: true, // now **/*.test.js files' env has both es6 *and* jest
      },
      extends: ['plugin:jest/recommended'],
    },
    {
      files: ['src/testPresets.js'],
      globals: {
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
  ],
}
