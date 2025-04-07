#!/usr/bin/env node

/**
 * mcptix Development Build Script
 *
 * This script compiles all TypeScript code to JavaScript in the dist-dev directory
 * for use with Claude Desktop and other environments that can't run TypeScript directly.
 *
 * It preserves the database configuration and path resolution logic.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const rimraf = require('rimraf');

// Constants
const PROJECT_ROOT = process.cwd();
const DIST_DEV_DIR = path.join(PROJECT_ROOT, 'dist-dev');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const TSCONFIG_DEV = path.join(PROJECT_ROOT, 'tsconfig.dev.json');

// Simple console logger with colors
const logger = {
  info: message => console.log(`\x1b[34m[INFO]\x1b[0m ${message}`),
  success: message => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`),
  warn: message => console.log(`\x1b[33m[WARNING]\x1b[0m ${message}`),
  error: message => console.log(`\x1b[31m[ERROR]\x1b[0m ${message}`),
};

/**
 * Clean dist-dev directory without touching data
 */
function cleanDistDev() {
  logger.info('Cleaning dist-dev directory...');

  // Ensure the directory exists before cleaning
  if (fs.existsSync(DIST_DEV_DIR)) {
    try {
      rimraf.sync(DIST_DEV_DIR);
      logger.success('Cleaned dist-dev directory');
    } catch (error) {
      logger.error(`Failed to clean dist-dev directory: ${error.message}`);
      process.exit(1);
    }
  } else {
    logger.info('dist-dev directory does not exist yet, will create it');
  }

  // Create the directory
  fs.mkdirSync(DIST_DEV_DIR, { recursive: true });
}

/**
 * Compile TypeScript to JavaScript
 */
function compileTypeScript() {
  logger.info('Compiling TypeScript to JavaScript...');

  try {
    // Use the TypeScript compiler with tsconfig.dev.json
    execSync(`npx tsc -p ${TSCONFIG_DEV}`, { stdio: 'inherit' });
    logger.success('TypeScript compilation completed successfully');
  } catch (error) {
    logger.error('TypeScript compilation failed');
    process.exit(1);
  }
}

/**
 * Copy non-TypeScript files (if needed)
 */
function copyNonTypeScriptFiles() {
  logger.info('Copying non-TypeScript files...');

  // List of file extensions to copy
  const extensionsToCopy = ['.json', '.js', '.txt'];

  // Function to recursively copy files
  function copyFilesRecursively(sourceDir, targetDir) {
    // Create the target directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Read all files and directories in the source directory
    const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = path.join(sourceDir, entry.name);
      const targetPath = path.join(targetDir, entry.name);

      if (entry.isDirectory()) {
        // Skip test directories
        if (entry.name === 'test' || entry.name === 'tests') continue;

        // Recursively copy subdirectories
        copyFilesRecursively(sourcePath, targetPath);
      } else {
        // Copy only specific file types
        const ext = path.extname(entry.name).toLowerCase();
        if (extensionsToCopy.includes(ext)) {
          fs.copyFileSync(sourcePath, targetPath);
          logger.info(`Copied: ${sourcePath} -> ${targetPath}`);
        }
      }
    }
  }

  // Start copying from the src directory
  copyFilesRecursively(SRC_DIR, DIST_DEV_DIR);
  logger.success('Non-TypeScript files copied successfully');
}

/**
 * Main function
 */
function main() {
  logger.info('Starting development build process...');

  // Check if tsconfig.dev.json exists
  if (!fs.existsSync(TSCONFIG_DEV)) {
    logger.error('tsconfig.dev.json not found. Please create it first.');
    process.exit(1);
  }

  try {
    // Clean the dist-dev directory
    cleanDistDev();

    // Compile TypeScript to JavaScript
    compileTypeScript();

    // Copy non-TypeScript files
    copyNonTypeScriptFiles();

    logger.success('Development build completed successfully!');
    logger.info('');
    logger.info('You can now run the compiled code with:');
    logger.info('- API server: node dist-dev/index.js --api --db-path=.mcptix-dev/data/mcptix.db --port=3030');
    logger.info('- MCP server: node dist-dev/mcp/index.js');
    logger.info('');
    logger.info('For Claude Desktop, point directly to:');
    logger.info(`  node ${path.resolve(DIST_DEV_DIR, 'mcp/index.js')}`);
    logger.info('with environment variable:');
    logger.info(`  MCPTIX_DB_PATH=${path.resolve(PROJECT_ROOT, '.mcptix-dev/data/mcptix.db')}`);
  } catch (error) {
    logger.error(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();
