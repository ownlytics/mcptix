"use strict";
/**
 * Configuration module for Epic Tracker
 * Provides types and utilities for configuring the Epic Tracker package
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
exports.mergeConfig = mergeConfig;
exports.validateConfig = validateConfig;
/**
 * Default configuration values
 */
exports.defaultConfig = {
    dbPath: './data/epic-tracker.db',
    apiPort: 3000,
    apiHost: 'localhost',
    mcpEnabled: true,
    apiEnabled: true,
    logLevel: 'info',
    clearDataOnInit: false
};
/**
 * Merge user configuration with defaults
 * @param userConfig Partial configuration provided by the user
 * @returns Complete configuration with defaults applied
 */
function mergeConfig(userConfig = {}) {
    return { ...exports.defaultConfig, ...userConfig };
}
/**
 * Validate configuration
 * @param config Configuration to validate
 * @throws Error if configuration is invalid
 */
function validateConfig(config) {
    // Validate port number
    if (config.apiPort !== undefined && (config.apiPort < 0 || config.apiPort > 65535)) {
        throw new Error(`Invalid API port: ${config.apiPort}. Must be between 0 and 65535.`);
    }
    // Validate log level
    if (config.logLevel && !['debug', 'info', 'warn', 'error'].includes(config.logLevel)) {
        throw new Error(`Invalid log level: ${config.logLevel}. Must be one of: debug, info, warn, error.`);
    }
}
//# sourceMappingURL=config.js.map