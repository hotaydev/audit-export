#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");
const dayjs = require("dayjs");
const ejs = require("ejs");

const OUTPUT_FILE_NAME = "audit-report.html";
const TEMPLATE = fs.readFileSync(path.join(__dirname, "template.ejs"), "utf-8");

/**
 * Reads data from stdin and writes it to the specified file or folder.
 * @param {string} folderPath - Path to the folder.
 * @param {string} filePath - Path to the file within the folder (optional).
 * @param {string} inputData - Data read from stdin.
 */
function processInput(folderPath, filePath, inputData) {
  let finalPath;

  if (folderPath) {
    finalPath = filePath ? path.join(folderPath, filePath) : path.join(folderPath, OUTPUT_FILE_NAME);
  } else {
    finalPath = path.join(process.cwd(), OUTPUT_FILE_NAME);
  }

  writeIfFolderExists(folderPath ?? process.cwd(), finalPath, inputData);
}

/**
 * Checks if the provided folder exists and calls the writeOutput function.
 * @param {string} folderPath - Path to the folder.
 * @param {string} path - Final path to write the output.
 * @param {string} data - Data to be written to the file.
 */
function writeIfFolderExists(folderPath, path, data) {
  fs.access(folderPath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error("Error: The provided folder does not exist.");
      process.exit(1);
    }
    writeOutput(path, data);
  });
}

/**
 * Writes the given data to the specified file.
 * @param {string} path - Path to the file.
 * @param {string} data - Data to be written to the file.
 */
function writeOutput(path, data) {
  const output = generateHtmlTemplateContent(data);
  fs.writeFile(path, output, (err) => {
    if (err) {
      console.error("Error: Unable to write to file.", err);
      process.exit(1);
    }
    
    console.log("Audit exported successfully!");
    process.exit(0);
  });
}

function generateHtmlTemplateContent(data) {
  data = JSON.parse(data);

  const templateData = {
    vulnsFound: data.metadata.vulnerabilities.total,
    totalDependencies: data.metadata.dependencies.total,
    currentDate: dayjs().format("DD [of] MMMM, YYYY - HH:mm:ss"),
    criticalVulns: data.metadata.vulnerabilities.total,
    highVulns: data.metadata.vulnerabilities.critical,
    moderateVulns: data.metadata.vulnerabilities.high,
    lowVulns: data.metadata.vulnerabilities.low,
    infoVulns: data.metadata.vulnerabilities.info,
  };

  return ejs.render(TEMPLATE, templateData);
}

// Command-line arguments
const folderPath = process.argv[2];
const filePath = process.argv[3];

// Set encoding for stdin
process.stdin.setEncoding("utf8");

// Read data from stdin
process.stdin.on("data", (data) => {
  processInput(folderPath, filePath, data);
});
