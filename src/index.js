#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");

const OUTPUT_FILE_NAME = "audit-report.log";

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
  fs.writeFile(path, data, (err) => {
    if (err) {
      console.error("Error: Unable to write to file.", err);
      process.exit(1);
    }
    
    console.log("Audit exported successfully!");
    process.exit(0);
  });
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
