"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
exports.mergeConfig = mergeConfig;
exports.validateConfig = validateConfig;
exports.ensureHomeDirectory = ensureHomeDirectory;
/**
 * Configuration module for McpTix
 * Provides types and utilities for configuring the McpTix package
 */
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
/**
 * Default configuration values
 */
exports.defaultConfig = {
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
function mergeConfig(userConfig = {}) {
    // Start with default config
    const config = { ...exports.defaultConfig, ...userConfig };
    // Set derived paths if not explicitly provided
    if (config.homeDir) {
        // Use the imported path module
        // Set dbPath if not provided
        if (!userConfig.dbPath) {
            config.dbPath = path_1.default.join(config.homeDir, 'data', 'mcptix.db');
        }
        // Set logDir if not provided
        if (!userConfig.logDir) {
            config.logDir = path_1.default.join(config.homeDir, 'logs');
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
function validateConfig(config) {
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
function ensureHomeDirectory(config) {
    if (!config.homeDir) {
        throw new Error('Home directory must be specified');
    }
    // Use the imported fs and path modules
    // Create home directory
    if (!fs_1.default.existsSync(config.homeDir)) {
        fs_1.default.mkdirSync(config.homeDir, { recursive: true });
    }
    // Create data directory
    const dataDir = path_1.default.join(config.homeDir, 'data');
    if (!fs_1.default.existsSync(dataDir)) {
        fs_1.default.mkdirSync(dataDir, { recursive: true });
    }
    // Create logs directory
    const logDir = config.logDir || path_1.default.join(config.homeDir, 'logs');
    if (!fs_1.default.existsSync(logDir)) {
        fs_1.default.mkdirSync(logDir, { recursive: true });
    }
}
//# sourceMappingURL=config.js.map