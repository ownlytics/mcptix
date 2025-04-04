/**
 * Configuration module for Epic Tracker
 * Provides types and utilities for configuring the Epic Tracker package
 */

/**
 * Configuration interface for Epic Tracker
 */
export interface EpicTrackerConfig {
  /**
   * Path to the SQLite database file
   * Default: './data/epic-tracker.db'
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
export const defaultConfig: EpicTrackerConfig = {
  dbPath: './data/epic-tracker.db',
  apiPort: 3000,
  apiHost: 'localhost',
  mcpEnabled: false, // Disabled by default - MCP server should be started by the LLM agent
  apiEnabled: true,
  logLevel: 'info',
  clearDataOnInit: false
};

/**
 * Merge user configuration with defaults
 * @param userConfig Partial configuration provided by the user
 * @returns Complete configuration with defaults applied
 */
export function mergeConfig(userConfig: Partial<EpicTrackerConfig> = {}): EpicTrackerConfig {
  return { ...defaultConfig, ...userConfig };
}

/**
 * Validate configuration
 * @param config Configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateConfig(config: EpicTrackerConfig): void {
  // Validate port number
  if (config.apiPort !== undefined && (config.apiPort < 0 || config.apiPort > 65535)) {
    throw new Error(`Invalid API port: ${config.apiPort}. Must be between 0 and 65535.`);
  }
  
  // Validate log level
  if (config.logLevel && !['debug', 'info', 'warn', 'error'].includes(config.logLevel)) {
    throw new Error(`Invalid log level: ${config.logLevel}. Must be one of: debug, info, warn, error.`);
  }
}