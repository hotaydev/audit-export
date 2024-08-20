# Contributing Guide for audit-export

🎉 Thank you for considering contributing to the audit-export project! 🌟 We appreciate your efforts and support. Please follow the guidelines below to contribute effectively. 🚀

## Local Testing

To test the project locally, follow these steps:

1. Install the tool globally using npm (on this package folder):

    ```bash
    npm install -g
    ```

2. Run the tool with `npm audit` (on another project, to test):

    ```bash
    npm audit --json | audit-export
    ```

3. 🧹 It's recommended to clean up after testing (also on this package folder):

    ```bash
    npm remove -g
    ```

## Node.js Version Compatibility

The tool is designed to work with different versions of Node.js. Specifically:

- For Node.js v10 to v14.
- For Node.js v16 and higher.

<sub>odd versions aren't listed, but work also.</sub>

So make sure to test the tool in both version ranges to ensure compatibility. 🔄

## Thank You! 🙌

We would like to extend our heartfelt gratitude to all contributors who have helped improve this project. Your time and effort are highly appreciated. If you encounter any issues or have suggestions, please open an issue or submit a pull request. Together, we can make audit-export even more awesome! 💪

Happy coding! 🚀