# Npm Audit Export 🕵️‍♂️

[![npm version](https://img.shields.io/npm/v/audit-export?style=flat-square)](https://www.npmjs.com/package/audit-export)
[![npm downloads](https://img.shields.io/npm/dy/audit-export?style=flat-square)](https://www.npmjs.com/package/audit-export)

A convenient tool to **export npm audit results** to a comprehensive **offline HTML page**, providing a clear overview of your project's vulnerabilities.

<div align="center" width="100%">
    <img src="https://raw.githubusercontent.com/hotaydev/audit-export/refs/heads/main/.github/images/screenshot.jpg" alt="Screenshot of the output of audit-export"/><br/>
    <sub align="center">Example of the output file from audit-export</sub>
</div><br/><br/>

> Inspired by [npm-audit-html](https://www.npmjs.com/package/npm-audit-html), but with more Node.js versions supported, offline support and lightweight ⚡

## Main Features
* Lightweight & Efficient
* Fully Offline Functionality
* Advanced Filters, Search, and Ordering
* Tags Filtering Supported
* Supports projects since Node v10
* Download results as CSV or JSON

## Compatibility

**This package is compatible with Node.js versions 10 through 22, as well as future versions.**

The syntax remains consistent with the earlier version 1.0.0; however, it's advisable to always use the latest version, as it offers numerous new features and enhancements.

## Installation

Install globally using npm:

```bash
npm install -g audit-export
```

## Usage

The tool is packed with a help function to see the usage ways. To see it, just pass the `--help` option.

There are some breaking changes in the usage syntax between versions <=3 and >=4. [See the upgrading guide](#usage-syntax-breaking-changes).

The simplest usage is as the following:

```
npm audit --json | audit-export
```

But with more customizations you can use it in two different main ways:

```
npm audit --json | audit-export --path <path> --title <HTML_file_title>
```

or:

```
npm audit --json | audit-export <path>
```

For all options you can pass the `--open` parameter to automatically open the report in the default browser.
The `<path>` part can be just a folder, just a file, or a folder with file path. Can be relative or full. It will work using the defaults when needed.

<sub><strong>All parameters are optional.</strong><br/>By default it will use <i>the current folder</i>, <i>"audit-report.html"</i> as file name, and <i>"NPM Audit Report"</i> as title.</sub>

## Usage syntax breaking changes

In versions **lower or equal than 3**, folder and file where separated parameters. **After version 4** both were merged into a single `--path` parameter, that can be the folder, the file, or both. Previously it was `--folder` and `--file`, now removed parameters.

## Contributing

We welcome contributions from the community! Feel free to open issues and submit pull requests on our [GitHub Issues page](https://github.com/hotaydev/audit-export/issues). Your feedback and suggestions are highly appreciated.

## Download

You can download the package from [npm](https://www.npmjs.com/package/audit-export).

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/hotaydev/audit-export/blob/main/LICENSE) file for details.

Happy auditing! 🛡️🚀
