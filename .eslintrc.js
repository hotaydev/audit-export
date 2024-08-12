module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true
  },
  extends: "eslint:recommended",
  overrides: [
    {
      env: {
        node: true
      },
      files: [
        ".eslintrc.js"
      ],
      parserOptions: {
        sourceType: "script"
      }
    }
  ],
  parserOptions: {
    ecmaVersion: "latest"
  },
  rules: {
    indent: [
      "error",
      2,
      {
        "SwitchCase": 1
      }
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
};
