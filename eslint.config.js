// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // .expo holds generated router types; node_modules and build output are
    // not ours to lint.
    ignores: ["dist/*", ".expo/*", "node_modules/*", "ios/*", "android/*"],
  }
]);
