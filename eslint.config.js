/**
 * Migration guide: https://eslint.org/docs/latest/use/configure/migration-guide
 */
const globals = require("globals");
const js = require("@eslint/js");

/**
 * Using FlatCompat to convert the .eslintrc.js file to .eslintrc.cjs
 * https://eslint.org/docs/latest/use/configure/migration-guide#using-eslintrc-configs-in-flat-config
 */

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.node,
        ...globals.commonjs
      },
    },
    rules: {
      indent: [
        "error",
        2
      ],
      "linebreak-style": [
        "error",
        "unix"
      ],
      quotes: [
        "error",
        "double"
      ],
      semi: [
        "error",
        "always"
      ]    
    }
  }
];
