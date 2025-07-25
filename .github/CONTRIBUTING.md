# Contributing Guide for audit-export

🎉 Thank you for considering contributing to the audit-export project! 🌟 We appreciate your efforts and support. Please follow the guidelines below to contribute effectively. 🚀

## Local Testing

To test the project locally, you use one of the test audits as input to this script, as shown below:

1. To test with a NodeJS v16+ audit:

```bash
cat .playwright/fixtures/npm-audit-node-v16.json | node ./src/index.js <parameters>
```

2. To test with a NodeJS v10 to v15 audits:

```bash
cat .playwright/fixtures/npm-audit-node-v10.json | node ./src/index.js <parameters>
```

3. To test with pnpm audits:

```bash
cat .playwright/fixtures/pnpm-audit-v10.json | node ./src/index.js <parameters>
```

4. To test with yarn audits:

```bash
cat .playwright/fixtures/yarn-audit.jsonl | node ./src/index.js <parameters>
```

5. To test with bun audits:

```bash
cat .playwright/fixtures/bun-audit.json | node ./src/index.js <parameters>
```

## Node.js Version Compatibility

The tool is designed to work with different versions of Node.js. Specifically:

- For Node.js v10 to v14.
- For Node.js v16 and higher.

<sub>It also works with <code>npm</code>, <code>pnpm</code>, <code>yarn</code> and <code>bun</code></sub><br/>
<sub>Odd versions aren't listed, but also works.</sub>

So make sure to test the tool in both version ranges and tools to ensure compatibility. 🔄

## Thank You! 🙌

We would like to extend our heartfelt gratitude to all contributors who have helped improve this project. Your time and effort are highly appreciated. If you encounter any issues or have suggestions, please open an issue or submit a pull request. Together, we can make audit-export even more awesome! 💪

Happy coding! 🚀
