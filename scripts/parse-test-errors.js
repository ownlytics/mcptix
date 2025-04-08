#!/usr/bin/env node

/**
 * A script that runs Jest tests and captures only the errors,
 * grouped by their file, showing only the most relevant information.
 * This makes it easier for LLMs to process test failures.
 */

import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

// Main function to run tests and parse errors
function runTestsAndParseErrors(testCommand = 'npm test', args = [], skipPrint = false) {
  console.log(`${colors.cyan}Running tests with command: ${testCommand} ${args.join(' ')}${colors.reset}`);

  let testOutput;
  try {
    // Use spawn instead of exec to handle large outputs better
    const cmdParts = testCommand.split(' ');
    const result = spawnSync(cmdParts[0], [...cmdParts.slice(1), ...args], {
      encoding: 'utf8',
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer to handle large outputs
    });

    testOutput = result.stdout + '\n' + result.stderr;

    if (result.status === 0) {
      console.log(`${colors.green}All tests passed!${colors.reset}`);
      return null;
    }
  } catch (error) {
    console.error(`${colors.red}Error executing test command: ${error.message}${colors.reset}`);
    return null;
  }

  // Parse the test output to extract errors
  const errorsByFile = parseTestErrors(testOutput);

  // Store the results globally for potential use by other processes
  global.lastErrorsByFile = errorsByFile;

  // Only print the summary if not skipping
  if (!skipPrint) {
    printErrorSummary(errorsByFile);
  }

  return errorsByFile;
}

// Parse the test output to extract errors grouped by file
function parseTestErrors(output) {
  const lines = output.split('\n');
  const errorsByFile = {};

  let currentFile = null;
  let currentTest = null;
  let currentError = null;
  let collectingStack = false;
  let stackLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Detect test file being run (FAIL marker)
    if (line.match(/FAIL\s+(.+\.ts[x]?)/)) {
      const match = line.match(/FAIL\s+(.+\.ts[x]?)/);
      currentFile = match[1];
      if (!errorsByFile[currentFile]) {
        errorsByFile[currentFile] = [];
      }
      continue;
    }

    // Detect start of a test case error (Jest uses the bullet point character)
    if (line.match(/[●]\s+(.+)/)) {
      // Save the previous error if there is one
      if (currentFile && currentTest && currentError) {
        if (!errorsByFile[currentFile]) {
          errorsByFile[currentFile] = [];
        }
        errorsByFile[currentFile].push({
          test: currentTest,
          error: currentError,
          stack: stackLines,
        });
      }

      const match = line.match(/[●]\s+(.+)/);
      currentTest = match[1].trim();
      currentError = null;
      stackLines = [];
      collectingStack = false;
      continue;
    }

    // Capture the main error message after test name (first non-'at' line)
    if (currentTest && !currentError && !line.startsWith('at ')) {
      currentError = line;
      collectingStack = true;
      continue;
    }

    // Capture stack trace
    if (collectingStack) {
      // Include lines that start with "at" and contain source file references
      if (line.startsWith('at ')) {
        // Only include lines from our source code, not from node_modules
        if ((line.includes('/src/') || line.includes('src/')) && !line.includes('node_modules/')) {
          stackLines.push(line);
        }
      }
      // Include specific error lines
      else if (line.includes('Error:') || line.includes('TypeError:') || line.includes('ReferenceError:')) {
        stackLines.push(line);
      }
      // Include expectation information as it's useful for debugging
      else if (line.startsWith('Expected:') || line.startsWith('Received:')) {
        stackLines.push(line);
      }
    }
  }

  // Add the last error if there is one
  if (currentFile && currentTest && currentError) {
    if (!errorsByFile[currentFile]) {
      errorsByFile[currentFile] = [];
    }
    errorsByFile[currentFile].push({
      test: currentTest,
      error: currentError,
      stack: stackLines,
    });
  }

  // Deduplicate errors - sometimes Jest reports the same error multiple times
  for (const file in errorsByFile) {
    const uniqueErrors = [];
    const seen = new Set();

    for (const error of errorsByFile[file]) {
      // Create a unique key for each error based on test name and error message
      const errorKey = `${error.test}::${error.error}`;

      if (!seen.has(errorKey)) {
        seen.add(errorKey);
        uniqueErrors.push(error);
      }
    }

    errorsByFile[file] = uniqueErrors;
  }

  return errorsByFile;
}

// Group errors by their type for a more categorized view
function groupErrorsByType(errorsByFile) {
  const errorsByType = {};

  for (const file in errorsByFile) {
    for (const error of errorsByFile[file]) {
      // Extract the error type from the error message
      let errorType = 'Other';

      if (error.error.includes('SqliteError')) {
        const match = error.error.match(/SqliteError:\s+(.+?)$/);
        errorType = match ? `SQLite: ${match[1]}` : 'SQLite Error';
      } else if (error.error.includes('Cannot nest a describe')) {
        errorType = 'Test Structure: Nested describe';
      } else if (error.error.includes('Hooks cannot be defined inside tests')) {
        errorType = 'Test Structure: Hooks in tests';
      } else if (error.error.includes('Tests cannot be nested')) {
        errorType = 'Test Structure: Nested tests';
      } else if (error.error.startsWith('expect(')) {
        errorType = 'Assertion Error';
      }

      if (!errorsByType[errorType]) {
        errorsByType[errorType] = [];
      }
      errorsByType[errorType].push({
        file,
        test: error.test,
        error: error.error,
        location: extractLocationInfo(findMostRelevantStackLine(error.stack)),
      });
    }
  }

  return errorsByType;
}

// Print a summary of the errors
function printErrorSummary(errorsByFile) {
  const fileCount = Object.keys(errorsByFile).length;
  const totalErrors = Object.values(errorsByFile).reduce((sum, errors) => sum + errors.length, 0);

  // Group similar errors by type
  const errorsByType = groupErrorsByType(errorsByFile);

  console.log(
    `\n${colors.bold}${colors.yellow}Test Error Summary: ${totalErrors} errors in ${fileCount} files${colors.reset}\n`,
  );

  // First, print a categorized summary of error types
  console.log(`${colors.bold}${colors.blue}Error Categories:${colors.reset}`);
  for (const errorType in errorsByType) {
    const count = errorsByType[errorType].length;
    console.log(`  ${colors.yellow}${errorType}${colors.reset}: ${count} occurrences`);
  }
  console.log('');

  // Then print details by file
  for (const file in errorsByFile) {
    console.log(`${colors.bold}${colors.magenta}File: ${file}${colors.reset}`);

    errorsByFile[file].forEach((error, index) => {
      console.log(`  ${colors.bold}${index + 1}. Test: ${error.test}${colors.reset}`);
      console.log(`     ${colors.red}Error: ${error.error}${colors.reset}`);

      // Get the most relevant line from the stack trace
      if (error.stack.length > 0) {
        const mostRelevantLine = findMostRelevantStackLine(error.stack);
        console.log(`     ${colors.yellow}Location: ${extractLocationInfo(mostRelevantLine)}${colors.reset}`);
      }
    });

    console.log(''); // Empty line between files
  }

  console.log(`${colors.bold}${colors.yellow}Total: ${totalErrors} errors in ${fileCount} files${colors.reset}`);
}

// Extract the most useful information from a stack trace line
function extractLocationInfo(stackLine) {
  if (!stackLine) return 'Unknown location';

  // Check if it's an error message first
  if (stackLine.includes('Error:')) {
    return stackLine;
  }

  // Extract file path and line number
  const fileMatch = stackLine.match(/\(([^:]+):(\d+):(\d+)\)/) || stackLine.match(/at\s+([^:]+):(\d+):(\d+)/);

  if (fileMatch) {
    const [_, filePath, line, column] = fileMatch;
    const fileName = path.basename(filePath);
    return `${fileName}:${line}:${column}`;
  }

  return stackLine;
}

// Find the most relevant line in the stack trace
function findMostRelevantStackLine(stackLines) {
  if (!stackLines || stackLines.length === 0) return null;

  // First, look for lines that contain specific error information
  for (const line of stackLines) {
    if (line.includes('SqliteError:') || line.includes('TypeError:') || line.includes('ReferenceError:')) {
      return line;
    }
  }

  // Second, prioritize lines that are test assertions
  const assertionLine = stackLines.find(
    line => line.includes('expect(') || line.includes('.toBe') || line.includes('.toEqual'),
  );

  if (assertionLine) return assertionLine;

  // Look for the first line that points to our source code
  const srcLine = stackLines.find(line => line.includes('/src/'));
  if (srcLine) return srcLine;

  // Otherwise return the first line
  return stackLines[0];
}

// Save error data to a JSON file
function saveErrorsToJson(errorsByFile, outputPath) {
  const outputData = {
    summary: {
      fileCount: Object.keys(errorsByFile).length,
      totalErrors: Object.values(errorsByFile).reduce((sum, errors) => sum + errors.length, 0),
    },
    errorsByFile: {},
    errorsByType: {},
  };

  // Group similar errors by type
  const errorsByType = groupErrorsByType(errorsByFile);

  // Add errors by file
  for (const file in errorsByFile) {
    outputData.errorsByFile[file] = errorsByFile[file].map(error => ({
      test: error.test,
      error: error.error,
      location:
        error.stack.length > 0 ? extractLocationInfo(findMostRelevantStackLine(error.stack)) : 'Unknown location',
    }));
  }

  // Add errors by type
  for (const errorType in errorsByType) {
    outputData.errorsByType[errorType] = errorsByType[errorType].map(error => ({
      file: error.file,
      test: error.test,
      error: error.error,
      location: error.location,
    }));
  }

  const jsonOutput = JSON.stringify(outputData, null, 2);

  if (outputPath) {
    try {
      fs.writeFileSync(outputPath, jsonOutput);
      console.log(`${colors.green}Error data saved to ${outputPath}${colors.reset}`);
    } catch (err) {
      console.error(`${colors.red}Error writing to file: ${err.message}${colors.reset}`);
    }
  } else {
    // If no output path is specified, just print to stdout
    console.log(jsonOutput);
  }
}

// Show help message
function showHelp() {
  console.log(`
${colors.bold}Jest Test Error Parser${colors.reset}
A tool to run Jest tests and capture only the errors, grouped by file and error type.

${colors.bold}Usage:${colors.reset}
  node scripts/parse-test-errors.js [options] [test-command]

${colors.bold}Options:${colors.reset}
  --help, -h         Show this help message
  --json, -j         Output results in JSON format
  --output, -o FILE  Save results to the specified file
  --filter, -f TYPE  Filter results by error type (e.g., "SQLite", "Test Structure")

${colors.bold}Examples:${colors.reset}
  # Run all tests and show errors in console
  node scripts/parse-test-errors.js
  
  # Run specific tests and save errors to a file
  node scripts/parse-test-errors.js "npm test src/api" --output errors.json
  
  # Output JSON to console
  node scripts/parse-test-errors.js --json
  
  # Run tests and filter errors by type
  node scripts/parse-test-errors.js --filter "SQLite"
`);
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let testCommand = 'npm test';
  let testArgs = [];
  let outputJson = false;
  let outputPath = null;
  let filterType = null;
  let showHelpFlag = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--help' || args[i] === '-h') {
      showHelpFlag = true;
      continue;
    }

    if (args[i] === '--json' || args[i] === '-j') {
      outputJson = true;
      continue;
    }

    if (args[i] === '--output' || args[i] === '-o') {
      if (i + 1 < args.length) {
        outputPath = args[i + 1];
        i++; // Skip the next argument since we've used it
        continue;
      }
    }

    if (args[i] === '--filter' || args[i] === '-f') {
      if (i + 1 < args.length) {
        filterType = args[i + 1];
        i++; // Skip the next argument since we've used it
        continue;
      }
    }

    // If this is the first non-option argument, use it as the test command
    if (!args[i].startsWith('-') && testCommand === 'npm test') {
      testCommand = args[i];
    } else {
      testArgs.push(args[i]);
    }
  }

  return { testCommand, testArgs, outputJson, outputPath, filterType, showHelpFlag };
}

// Run the main function
const { testCommand, testArgs, outputJson, outputPath, filterType, showHelpFlag } = parseArgs();

// Show help if requested
if (showHelpFlag) {
  showHelp();
  process.exit(0);
}

// Run tests and parse errors
let errorsByFile = runTestsAndParseErrors(testCommand, testArgs);

// If no errors were found or the tests passed, exit
if (!errorsByFile) {
  process.exit(0);
}

// Filter errors by type if requested
if (filterType) {
  console.log(`\n${colors.cyan}Filtering errors by type: "${filterType}"${colors.reset}`);

  const filteredErrorsByFile = {};

  for (const file in errorsByFile) {
    const filteredErrors = errorsByFile[file].filter(error =>
      error.error.toLowerCase().includes(filterType.toLowerCase()),
    );

    if (filteredErrors.length > 0) {
      filteredErrorsByFile[file] = filteredErrors;
    }
  }

  // Replace the original errors with the filtered ones
  errorsByFile = filteredErrorsByFile;
}

// Output JSON if requested
if (outputJson) {
  saveErrorsToJson(errorsByFile, outputPath);
} else {
  // Print summary of errors (filtered if a filter was applied)
  printErrorSummary(errorsByFile);
}

// If this script is being run directly, handle the process exit
if (require.main === module) {
  process.on('exit', code => {
    // Exit with a non-zero code if we found errors
    // This makes the script useful in CI environments
    if (code === 0 && Object.keys(global.lastErrorsByFile || {}).length > 0) {
      process.exitCode = 1;
    }
  });
}
