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
export declare const defaultConfig: McpTixConfig;
/**
 * Merge user configuration with defaults
 * @param userConfig Partial configuration provided by the user
 * @returns Complete configuration with defaults applied
 */
export declare function mergeConfig(userConfig?: Partial<McpTixConfig>): McpTixConfig;
/**
 * Validate configuration
 * @param config Configuration to validate
 * @throws Error if configuration is invalid
 */
export declare function validateConfig(config: McpTixConfig): void;
/**
 * Ensure the home directory exists
 * @param config Configuration to use
 */
export declare function ensureHomeDirectory(config: McpTixConfig): void;
//# sourceMappingURL=config.d.ts.map