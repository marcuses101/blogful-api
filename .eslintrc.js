module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
    mocha: true
  },
  globals: {
    supertest: true,
    expect: true,
  },
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: 12
  },
  rules: {}
};
