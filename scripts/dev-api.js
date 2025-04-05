#!/usr/bin/env node

/**
 * mcptix Development API Server Script
 *
 * This script starts the mcptix API server in development mode:
 * 1. Uses the development configuration from .mcptix-dev
 * 2. Sets up environment variables for development
 * 3. Starts the API server using ts-node
 *
 * Usage: npm run dev:api
 */

const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const { spawn } = require('child_process');

// Constants
const PROJECT_ROOT = process.cwd();
const DEV_DIR = path.join(PROJECT_ROOT, '.mcptix-dev');
const DEV_CONFIG_PATH = path.join(DEV_DIR, 'mcptix.config.js');
const DEV_DB_CONFIG_PATH = path.join(DEV_DIR, 'db-config.json');

// Simple logger
const logger = {
  info: message => console.log(chalk.blue(`[API-DEV] ${message}`)),
  success: message => console.log(chalk.green(`[API-DEV] ${message}`)),
  warn: message => console.log(chalk.yellow(`[API-DEV] ${message}`)),
  error: message => console.log(chalk.red(`[API-DEV] ${message}`)),
};

/**
 * Check if development environment is set up
 */
function checkDevEnvironment() {
  if (!fs.existsSync(DEV_DIR)) {
    logger.error('Development environment not found.');
    logger.error('Please run "npm run dev:setup" first.');
    process.exit(1);
  }

  if (!fs.existsSync(DEV_CONFIG_PATH)) {
    logger.error('Development configuration not found.');
    logger.error('Please run "npm run dev:setup" to create it.');
    process.exit(1);
  }

  if (!fs.existsSync(DEV_DB_CONFIG_PATH)) {
    logger.error('Development database configuration not found.');
    logger.error('Please run "npm run dev:setup" to create it.');
    process.exit(1);
  }
}

/**
 * Load development configuration
 */
function loadDevConfig() {
  try {
    // Clear require cache to ensure we get the latest version
    if (require.cache[DEV_CONFIG_PATH]) {
      delete require.cache[DEV_CONFIG_PATH];
    }

    const devConfig = require(DEV_CONFIG_PATH);
    logger.info('Loaded development configuration');
    return devConfig;
  } catch (error) {
    logger.error(`Failed to load development configuration: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Load development database configuration
 */
function loadDevDbConfig() {
  try {
    const dbConfigContent = fs.readFileSync(DEV_DB_CONFIG_PATH, 'utf8');
    const dbConfig = JSON.parse(dbConfigContent);
    logger.info(`Using development database at: ${dbConfig.dbPath}`);
    return dbConfig;
  } catch (error) {
    logger.error(`Failed to load development database configuration: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Start the API server in development mode
 */
function startApiServer(devConfig, dbConfig) {
  logger.info('Starting API server in development mode...');

  // Set environment variables for development
  const env = {
    ...process.env,
    MCPTIX_DEV_MODE: 'true',
    MCPTIX_DB_PATH: dbConfig.dbPath,
    MCPTIX_API_PORT: devConfig.apiPort,
    MCPTIX_API_HOST: devConfig.apiHost,
    MCPTIX_LOG_LEVEL: devConfig.logLevel,
  };

  // Start the API server using ts-node
  const tsNodeBin = path.join(PROJECT_ROOT, 'node_modules', '.bin', 'ts-node');
  const indexPath = path.join(PROJECT_ROOT, 'src', 'index.ts');

  logger.info(`Using ts-node: ${tsNodeBin}`);
  logger.info(`Entry point: ${indexPath}`);
  logger.info(`API server will run at: http://${devConfig.apiHost}:${devConfig.apiPort}`);
  logger.info(`Development database path: ${dbConfig.dbPath}`);

  // Spawn the process - explicitly set the database path and port
  const apiProcess = spawn(
    tsNodeBin,
    [
      indexPath,
      '--api',
      `--db-path=${dbConfig.dbPath}`,
      `--port=${devConfig.apiPort}`,
      `--host=${devConfig.apiHost}`,
    ],
    {
      env,
      stdio: 'inherit',
    },
  );

  // Handle process events
  apiProcess.on('error', error => {
    logger.error(`Failed to start API server: ${error.message}`);
    process.exit(1);
  });

  apiProcess.on('exit', code => {
    if (code !== 0) {
      logger.error(`API server exited with code ${code}`);
      process.exit(code);
    }
  });

  // Handle termination signals
  process.on('SIGINT', () => {
    logger.info('Shutting down API server...');
    apiProcess.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    logger.info('Shutting down API server...');
    apiProcess.kill('SIGTERM');
  });
}

/**
 * Main function
 */
function main() {
  logger.info('Starting mcptix API server in development mode');

  // Check development environment
  checkDevEnvironment();

  // Load configurations
  const devConfig = loadDevConfig();
  const dbConfig = loadDevDbConfig();

  // Start API server
  startApiServer(devConfig, dbConfig);
}

// Run main function
main();
