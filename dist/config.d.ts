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
export declare const defaultConfig: EpicTrackerConfig;
/**
 * Merge user configuration with defaults
 * @param userConfig Partial configuration provided by the user
 * @returns Complete configuration with defaults applied
 */
export declare function mergeConfig(userConfig?: Partial<EpicTrackerConfig>): EpicTrackerConfig;
/**
 * Validate configuration
 * @param config Configuration to validate
 * @throws Error if configuration is invalid
 */
export declare function validateConfig(config: EpicTrackerConfig): void;
//# sourceMappingURL=config.d.ts.map