#!/usr/bin/env node

const fs = require("fs-extra");
const os = require("os");
const ejs = require("ejs");

const OUTPUT_FILE_NAME = "audit-report.html";
const OPTIONS = {
  folder: undefined,
  file: undefined,
  title: "NPM Audit Report",
  template: join([__dirname, "template.ejs"])
};
const HELP_TEXT = `
  Usage:

    // Option 1
    $ npm audit --json | audit-export

    // Option 2
    $ npm audit --json | audit-export <path> <file_name>

    // Option 3
    $ npm audit --json | audit-export --folder <folder_path> --file <file_name.html> --title <HTML_file_title>

    // All parameters are optional
`;

/**
 * Processes the input data and writes it to the specified file or folder.
 * @param {object} options - App options
 * @param {string} inputData - Data read from stdin.
 */
function processInput(options, inputData) {
  const finalPath = getFinalPath(options.folder, options.file);
  writeIfFolderExists(options, finalPath, inputData);
}

/**
 * Constructs the final path based on the folder and file paths.
 * @param {string} folderPath - Path to the folder.
 * @param {string} filePath - Path to the file within the folder (optional).
 * @returns {string} - The final path to write the output.
 */
function getFinalPath(folderPath, filePath) {
  return filePath ? join([folderPath, filePath]) : join([folderPath, OUTPUT_FILE_NAME]);
}

/**
 * Checks if the provided folder exists and calls the writeOutput function.
 * @param {object} options - App options
 * @param {string} finalPath - Final path to write the output.
 * @param {string} data - Data to be written to the file.
 */
function writeIfFolderExists(options, finalPath, data) {
  fs.access(options.folder, fs.constants.F_OK, (err) => {
    if (err) {
      console.error("Error: The provided folder does not exist.");
      process.exit(1);
    }
    writeOutput(options, finalPath, data);
  });
}

/**
 * Writes the given data to the specified file.
 * @param {object} options - App options
 * @param {string} path - Path to the file.
 * @param {string} data - Data to be written to the file.
 */
function writeOutput(options, path, data) {
  const output = generateHtmlTemplateContent(options, data);
  fs.writeFile(path, output, (err) => {
    if (err) {
      console.error("Error: Unable to write to file.", err);
      process.exit(1);
    }

    console.log("Audit exported successfully!");
    process.exit(0);
  });
}

/**
 * Generates HTML template content based on the provided data.
 * @param {object} options - App options
 * @param {string} data - JSON string containing vulnerability data.
 * @returns {string} - HTML content generated from the template.
 */
function generateHtmlTemplateContent(options, data) {
  const TEMPLATE = fs.readFileSync(options.template, "utf-8");

  const vulnerabilities = getVulnerabilities(JSON.parse(data));

  const templateData = {
    npmReportTitle: options.title,
    vulnsFound: vulnerabilities.length,
    vulnerableDependencies: [...new Set(vulnerabilities.map((vuln) => vuln.package))].length,
    currentDate: getCurrentDate(),
    criticalVulns: countVulnerabilities(vulnerabilities, "critical"),
    highVulns: countVulnerabilities(vulnerabilities, "high"),
    moderateVulns: countVulnerabilities(vulnerabilities, "moderate"),
    lowVulns: countVulnerabilities(vulnerabilities, "low"),
    infoVulns: countVulnerabilities(vulnerabilities, "info"),
    vulnerabilities: vulnerabilities,
  };

  return ejs.render(TEMPLATE, templateData);
}

/**
 * Counts the number of vulnerabilities with the specified severity.
 * @param {Array} vulnerabilities - Array of vulnerability objects.
 * @param {string} severity - Severity level to count.
 * @returns {number} - Number of vulnerabilities with the specified severity.
 */
function countVulnerabilities(vulnerabilities, severity) {
  return vulnerabilities.filter((vuln) => vuln.severity === severity).length;
}

/**
 * Extracts and processes vulnerability data from the provided JSON data.
 * @param {string} data - JSON string containing vulnerability data.
 * @returns {Array} - Array of processed vulnerability objects.
 */
function getVulnerabilities(data) {
  let allVulns = [];

  if (data.vulnerabilities) {
    for (const pkg in data.vulnerabilities) {
      allVulns.push(...data.vulnerabilities[pkg].via);
    }
  } else if (data.advisories) {
    for (const vuln in data.advisories) {
      allVulns.push(data.advisories[vuln]);
    }
  }

  return allVulns.map((vuln) => processVulnerability(vuln)).filter(vuln => vuln);
}

/**
 * Processes a single vulnerability object and returns a standardized format.
 * @param {Object} vuln - Raw vulnerability object.
 * @returns {Object} - Processed vulnerability object.
 */
function processVulnerability(vuln) {
  if (vuln.title) {
    return {
      link: vuln.url,
      name: vuln.title,
      package: vuln.name || vuln.module_name,
      severity: vuln.severity,
      cwes: (vuln.cwe || []).concat(vuln.cves).join(", "),
    };
  }
}

/**
 * Joins array elements into a path string based on the operating system.
 * @param {Array} paths - Array of path elements.
 * @returns {string} - The joined path string.
 */
function join(paths) {
  if (os.platform() === "win32") {
    return paths.join("\\");
  } else {
    return paths.join("/");
  }
}

/**
 * Gets the current date in a formatted string.
 * @returns {string} - Formatted current date string.
 */
function getCurrentDate() {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const d = new Date();

  return `${checkNumLength(str(d.getDate()))} of ${months[d.getMonth()]}, ${d.getFullYear()} - ${checkNumLength(str(d.getHours()))}:${checkNumLength(str(d.getMinutes()))}:${checkNumLength(str(d.getSeconds()))}`;
}

/**
 * Converts a value to a string.
 * @param {any} string - Value to be converted to a string.
 * @returns {string} - The converted string.
 */
function str(string) {
  return string.toString();
}

/**
 * Ensures a two-digit format for numbers by adding a leading zero if necessary.
 * @param {string} number - Number to check and possibly add a leading zero.
 * @returns {string} - Number with a leading zero if necessary.
 */
function checkNumLength(number) {
  if (number.length === 2) return number;
  return `0${number}`;
}

/**
 * Processes command line arguments passed to the script.
 * If a parameter is provided, it invokes the processParameter function to handle it.
 * If folder or file parameters are provided as positional arguments, it assigns them to the OPTIONS object.
 */
function processArgument() {
  const args = process.argv.slice(2);

  args.forEach((arg, index) => {
    if (arg.startsWith("--")) {
      processParameter(arg, args, index);
    } else if (!OPTIONS.folder) {
      OPTIONS.folder = arg;
    } else if (!OPTIONS.file) {
      OPTIONS.file = arg;
    }
  });
}

/**
 * Processes a single command line parameter.
 * Determines the parameter and its value if applicable, then performs the appropriate action.
 *
 * @param {string} arg - The command line argument to process.
 * @param {string[]} args - The array of command line arguments.
 * @param {number} index - The index of the current argument in the args array.
 */
function processParameter(arg, args, index) {
  let param, value;
  if (arg.includes("=")) {
    [param, value] = arg.slice(2).split(/=(.+)/);
  } else if (args[index + 1] && !args[index + 1].startsWith("--") && arg.slice(2) !== "help") {
    param = arg.slice(2);
    value = args[index + 1];
  } else if (arg.slice(2) !== "help") {
    console.error(`Error: Missing value for parameter '${arg.slice(2)}'.`);
    process.exit(1);
  } else {
    param = arg.slice(2);
  }

  switch (param) {
  case "folder":
  case "file":
  case "title":
    handleParameter(param, value);
    break;
  case "help":
    showHelp();
    break;
  default:
    console.error(`Error: Unknown parameter '${param}'.`);
    process.exit(1);
  }
}

/**
 * Handles a parameter with its corresponding value.
 * Assigns the value to the OPTIONS object if it is required.
 *
 * @param {string} param - The parameter to handle.
 * @param {string} value - The value associated with the parameter.
 */
function handleParameter(param, value) {
  if (!value) {
    console.error(`Error: ${param} parameter requires a value.`);
    process.exit(1);
  }
  OPTIONS[param] = value;
}

/**
 * Displays the help text and exits the script with a success status code.
 */
function showHelp() {
  console.log(HELP_TEXT);
  process.exit(0);
}

if (process.argv.length > 2) {
  processArgument();
}

if (!OPTIONS.folder) {
  OPTIONS.folder = process.cwd();
}

// Set encoding for stdin
process.stdin.setEncoding("utf8");

// Support chunked input
let inputData = "";

// Read data from stdin
process.stdin.on("data", chunk => {
  inputData += chunk;
});

// Read data from stdin
process.stdin.on("end", () => {
  processInput(OPTIONS, inputData);
});
