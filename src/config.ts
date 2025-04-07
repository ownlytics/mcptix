/**
 * Configuration module for McpTix
 * Provides types and utilities for configuring the McpTix package
 */

/**
 * Configuration interface for mcptix
 */
export interface McpTixConfig {
  /**
   * Base directory for all mcptix files (logs, database, etc)
   * Default: './.mcptix'
   */
  homeDir?: string;

  /**
   * Path to the SQLite database file
   * Default: '{homeDir}/data/mcptix.db'
   */
  dbPath?: string;

  /**
   * Port for the API server
   * Default: 3000
   */
  apiPort?: number;

  /**
   * Host for the API server
   * Default: 'localhost'
   */
  apiHost?: string;

  /**
   * Whether to enable the MCP server
   * Default: true
   */
  mcpEnabled?: boolean;

  /**
   * Whether to enable the API server
   * Default: true
   */
  apiEnabled?: boolean;

  /**
   * Path to the log directory
   * Default: '{homeDir}/logs'
   */
  logDir?: string;

  /**
   * Name of the log file
   * Default: 'mcptix.log'
   */
  logFile?: string;

  /**
   * Log level for the application
   * Default: 'info'
   */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';

  /**
   * Whether to clear existing data on initialization
   * Default: false
   */
  clearDataOnInit?: boolean;
}

/**
 * Default configuration values
 */
export const defaultConfig: McpTixConfig = {
  homeDir: './.mcptix',
  dbPath: undefined, // Will be derived from homeDir if not explicitly set
  apiPort: 3000,
  apiHost: 'localhost',
  mcpEnabled: false, // Disabled by default - MCP server should be started by the LLM agent
  apiEnabled: true,
  logLevel: 'info',
  logDir: undefined, // Will be derived from homeDir if not explicitly set
  logFile: 'mcptix.log',
  clearDataOnInit: false,
};

/**
 * Merge user configuration with defaults
 * @param userConfig Partial configuration provided by the user
 * @returns Complete configuration with defaults applied
 */
export function mergeConfig(userConfig: Partial<McpTixConfig> = {}): McpTixConfig {
  // Start with default config
  const config = { ...defaultConfig, ...userConfig };

  // Set derived paths if not explicitly provided
  if (config.homeDir) {
    const path = require('path');

    // Set dbPath if not provided
    if (!userConfig.dbPath) {
      config.dbPath = path.join(config.homeDir, 'data', 'mcptix.db');
    }

    // Set logDir if not provided
    if (!userConfig.logDir) {
      config.logDir = path.join(config.homeDir, 'logs');
    }

    // Set environment variable for logger
    process.env.MCPTIX_HOME_DIR = config.homeDir;
  }

  return config;
}

/**
 * Validate configuration
 * @param config Configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateConfig(config: McpTixConfig): void {
  // Validate port number
  if (config.apiPort !== undefined && (config.apiPort < 0 || config.apiPort > 65535)) {
    throw new Error(`Invalid API port: ${config.apiPort}. Must be between 0 and 65535.`);
  }

  // Validate log level
  if (config.logLevel && !['debug', 'info', 'warn', 'error'].includes(config.logLevel)) {
    throw new Error(`Invalid log level: ${config.logLevel}. Must be one of: debug, info, warn, error.`);
  }

  // Make sure home directory is set
  if (!config.homeDir) {
    throw new Error('Home directory must be specified');
  }

  // Ensure dbPath is set
  if (!config.dbPath) {
    throw new Error('Database path must be specified or derived from homeDir');
  }
}

/**
 * Ensure the home directory exists
 * @param config Configuration to use
 */
export function ensureHomeDirectory(config: McpTixConfig): void {
  if (!config.homeDir) {
    throw new Error('Home directory must be specified');
  }

  const fs = require('fs');
  const path = require('path');

  // Create home directory
  if (!fs.existsSync(config.homeDir)) {
    fs.mkdirSync(config.homeDir, { recursive: true });
  }

  // Create data directory
  const dataDir = path.join(config.homeDir, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Create logs directory
  const logDir = config.logDir || path.join(config.homeDir, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}
