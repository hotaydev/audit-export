#!/usr/bin/env node

const fs = require("fs-extra");
const ejs = require("ejs");
const packageJson = require("../package.json");

// biome-ignore lint/style/useNodejsImportProtocol: The node: protocol doesn't work on NodeJS v10 and v12, so it's not added to make the compatibility possible.
const os = require("os");
// biome-ignore lint/style/useNodejsImportProtocol: The node: protocol doesn't work on NodeJS v10 and v12, so it's not added to make the compatibility possible.
const child_process = require("child_process");

const OUTPUT_FILE_NAME = "audit-report.html";
const OPTIONS = {
	path: undefined,
	title: "NPM Audit Report",
	open: false,
};

const HELP_TEXT =
	'\n  Usage:\n\n    $ npm audit --json | audit-export [--path <output_path>] [--title <report_title>] [--open]\n\n    Supported package managers:\n    $ npm/pnpm/yarn audit --json | audit-export\n\n    Parameters:\n    --path    Output file or directory path (default: ./audit-report.html)\n    --title   HTML report title (default: NPM Audit Report)\n    --open    Automatically open the report in your default browser\n\n    Examples:\n    $ npm audit --json | audit-export\n    $ npm audit --json | audit-export --path ./reports/security.html\n    $ npm audit --json | audit-export --title "Project Security Report" --open\n';

/**
 * Processes the input data and writes it to the specified file or folder.
 * @param {object} options - App options
 * @param {string} inputData - Data read from stdin.
 */
function processInput(options, inputData) {
	const finalPath = getFinalPath(options.path);
	writeIfFolderExists(options, finalPath, inputData);
	if (options.open) {
		openReport(finalPath);
	}
}

/**
 * Constructs the final path based on the folder and file paths.
 * @param {string} path - Path to the folder and/or file.
 * @returns {string} - The final path to write the output.
 */
function getFinalPath(path) {
	if (path.includes(".html")) return path;
	return join([path, OUTPUT_FILE_NAME]);
}

/**
 * Checks if the provided folder exists and calls the writeOutput function.
 * @param {object} options - App options
 * @param {string} finalPath - Final path to write the output.
 * @param {string} data - Data to be written to the file.
 */
function writeIfFolderExists(options, finalPath, data) {
	const folderPath = finalPath.replace(/[\/\\][^\/\\]+\.html$/, ""); // Remove the file name part
	fs.access(folderPath, fs.constants.F_OK, (err) => {
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
	// Handling yarn audit data - that is jsonl, not json
	let tool;
	let jsonData;
	try {
		jsonData = JSON.parse(data);
		tool = data.advisories
			? "pnpm"
			: Object.values(jsonData)[0][0]?.id
				? "bun"
				: "npm";
	} catch (error) {
		// Data couldn't be parsed as JSON, so it's a jsonl file
		jsonData = JSON.parse(
			`[${data
				.split("\n")
				.filter((line) => line.trim())
				.join(",")}]`,
		);

		tool = "yarn";
	}

	const TEMPLATE = fs.readFileSync(join([__dirname, "template.ejs"]), "utf-8");
	const vulnerabilities = getVulnerabilities(jsonData);
	const packageJson = fs.readFileSync(
		join([__dirname, "..", "package.json"]),
		"utf-8",
	);

	const templateData = {
		npmReportTitle: options.title,
		vulnsFound: vulnerabilities.length,
		vulnerableDependencies: [
			...new Set(vulnerabilities.map((vuln) => vuln.package)),
		].length,
		currentDate: getCurrentDate(),
		totals: {
			critical: countVulnerabilities(vulnerabilities, "critical"),
			high: countVulnerabilities(vulnerabilities, "high"),
			moderate: countVulnerabilities(vulnerabilities, "moderate"),
			low: countVulnerabilities(vulnerabilities, "low"),
			info: countVulnerabilities(vulnerabilities, "info"),
		},
		vulnerabilities: vulnerabilities,
		version: JSON.parse(packageJson).version || "Unknown",
		packageLockLocation: join([process.cwd(), "package-lock.json"]),
		tool: tool,
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

	if (Array.isArray(data)) {
		allVulns = getVulnerabilitiesFromYarnAudit(data);
	} else if (data.vulnerabilities) {
		allVulns = getVulnerabilitiesFromNpmAudit(data);
	} else if (data.advisories) {
		allVulns = getVulnerabilitiesFromPnpmAudit(data);
	} else if (Object.values(data)[0][0]?.id) {
		allVulns = getVulnerabilitiesFromBunAudit(data);
	}

	return deduplicateEntries(
		allVulns.map((vuln) => processVulnerability(vuln)).filter((vuln) => vuln),
	);
}

/**
 * Extracts and processes vulnerability data from bun audit report.
 *
 * @param {Object} data - The bun audit report data.
 * @returns {Array} - An array of processed vulnerability objects.
 */
function getVulnerabilitiesFromBunAudit(data) {
	const allVulns = [];

	for (const [name, vulnerabilities] of Object.entries(data)) {
		for (const vuln of vulnerabilities) {
			allVulns.push({
				...vuln,
				name,
			});
		}
	}

	return allVulns;
}

/**
 * Extracts and processes vulnerability data from npm audit report.
 *
 * @param {Object} data - The npm audit report data.
 * @returns {Array} - An array of processed vulnerability objects.
 */
function getVulnerabilitiesFromNpmAudit(data) {
	const allVulns = [];

	for (const pkg in data.vulnerabilities) {
		for (const vulnerability of data.vulnerabilities[pkg].via) {
			if (typeof vulnerability !== "string") {
				allVulns.push({
					...vulnerability,
					isDirect: data.vulnerabilities[pkg].isDirect,
					fixAvailable: data.vulnerabilities[pkg].fixAvailable,
				});
			}
		}
	}

	return allVulns;
}

/**
 * Extracts and processes vulnerability data from pnpm audit report.
 *
 * @param {Object} data - The pnpm audit report data.
 * @returns {Array} - An array of processed vulnerability objects.
 */
function getVulnerabilitiesFromPnpmAudit(data) {
	const allVulns = [];

	for (const vuln in data.advisories) {
		const vulnerability = data.advisories[vuln];

		allVulns.push({
			...vulnerability,
			fixAvailable:
				vulnerability.recommendation && vulnerability.patched_versions,
			isDirect: vulnerability.findings.some((finding) =>
				finding.paths.some((path) => (path.match(/>/g) || []).length === 1),
			),
		});
	}

	return allVulns;
}

/**
 * Extracts and processes vulnerability data from yarn audit report.
 *
 * @param {Array} data - The yarn audit report data.
 * @returns {Array} - An array of processed vulnerability objects.
 */
function getVulnerabilitiesFromYarnAudit(data) {
	const allVulns = [];

	for (const arrayItem of data) {
		if (arrayItem.type === "auditAdvisory") {
			const vulnerability = arrayItem.data.advisory;

			allVulns.push({
				...vulnerability,
				fixAvailable:
					vulnerability.recommendation && vulnerability.patched_versions,
				isDirect: vulnerability.findings.some((finding) =>
					finding.paths.some((path) => (path.match(/>/g) || []).length === 1),
				),
			});
		}
	}

	return allVulns;
}

/**
 * Processes a single vulnerability object and returns a standardized format.
 * @param {Object} vuln - Raw vulnerability object.
 * @returns {Object} - Processed vulnerability object.
 */
function processVulnerability(vuln) {
	const tags = [];
	const cvesAndCwes = (vuln.cwe || [])
		.concat(vuln.cves || [])
		.filter((cwe) => cwe)
		.join(", ");

	if ("fixAvailable" in vuln) {
		tags.push(vuln.fixAvailable ? "Fix Available" : "No Fix");
	}

	if ("isDirect" in vuln) {
		tags.push(vuln.isDirect ? "Direct" : "Indirect");
	}

	if (vuln.title) {
		return {
			link: vuln.url,
			name: vuln.title,
			tags: tags,
			package: vuln.name || vuln.module_name,
			severity: vuln.severity,
			severity_number: getNumberOfSeverity(vuln.severity),
			cwes: cvesAndCwes,
		};
	}
}
/**
 * Removes duplicate entries from an array of objects based on their keys and values.
 *
 * @param {Array} array - The array of objects to deduplicate.
 * @returns {Array} - A new array with duplicate entries removed.
 */
function deduplicateEntries(array) {
	return array.filter((item, index, self) => {
		return (
			index ===
			self.findIndex((other) => {
				const keys1 = Object.keys(item);
				const keys2 = Object.keys(other);
				if (keys1.length !== keys2.length) return false;

				return keys1.every((key) => {
					const val1 = item[key];
					const val2 = other[key];

					// Compare arrays
					if (Array.isArray(val1) && Array.isArray(val2)) {
						return (
							val1.length === val2.length && val1.every((v, i) => v === val2[i])
						);
					}

					return val1 === val2;
				});
			})
		);
	});
}

/**
 * Turn a string severity into the correspondent number
 * @param {string} severity - Severity string name
 * @returns {number} - Number of the severity, from 0 to 5
 */
function getNumberOfSeverity(severity) {
	switch (severity) {
		case "critical":
			return 5;
		case "high":
			return 4;
		case "moderate":
			return 3;
		case "low":
			return 2;
		case "info":
			return 1;
		case "none":
			return 0;
		default:
			return 0;
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
	}

	return paths.join("/");
}

/**
 * Gets the current date in a formatted string.
 * @returns {string} - Formatted current date string.
 */
function getCurrentDate() {
	const months = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];
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
 * Opens the generated report in the default browser.
 * @param {string} finalPath - Final path of the generated report.
 */
function openReport(finalPath) {
	const start =
		process.platform === "darwin"
			? "open"
			: process.platform === "win32"
				? "start"
				: "xdg-open";
	child_process.exec(`${start} ${finalPath}`);
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
		} else if (!OPTIONS.path) {
			OPTIONS.path = arg;
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
	let param;
	let value;

	const argumentName = arg.slice(2);

	if (arg.includes("=")) {
		[param, value] = argumentName.split(/=(.+)/);
	} else if (
		args[index + 1] &&
		!args[index + 1].startsWith("--") &&
		argumentName !== "help" &&
		argumentName !== "version"
	) {
		param = argumentName;
		value = args[index + 1];
	} else if (
		argumentName !== "help" &&
		argumentName !== "version" &&
		argumentName !== "open"
	) {
		console.error(`Error: Missing value for parameter '${argumentName}'.`);
		process.exit(1);
	} else {
		param = argumentName;
	}

	switch (param) {
		case "path":
		case "title":
			handleParameter(param, value);
			break;
		case "open":
			OPTIONS.open = true;
			break;
		case "help":
			showMessageAndExit(HELP_TEXT);
			break;
		case "version":
			showMessageAndExit(`v${packageJson.version}`);
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
function showMessageAndExit(msg) {
	console.log(msg);
	process.exit(0);
}

if (process.argv.length > 2) {
	processArgument();
}

if (!OPTIONS.path) {
	OPTIONS.path = process.cwd();
}

// Set encoding for stdin
process.stdin.setEncoding("utf8");

// Support chunked input
let inputData = "";

// Read data from stdin
process.stdin.on("data", (chunk) => {
	inputData += chunk;
});

// Read data from stdin
process.stdin.on("end", () => {
	processInput(OPTIONS, inputData);
});
