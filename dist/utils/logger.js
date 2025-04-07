"use strict";
/**
 * mcptix Logger
 * A centralized logging system with console and file output
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
/**
 * Environment detection for MCP server mode
 */
const isMcpMode = process.env.MCPTIX_MCP_MODE === 'true';
/**
 * Log levels with corresponding colors
 */
var LogLevel;
(function (LogLevel) {
    LogLevel["INFO"] = "info";
    LogLevel["SUCCESS"] = "success";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
    LogLevel["DEBUG"] = "debug";
    LogLevel["REQUEST"] = "request";
})(LogLevel || (LogLevel = {}));
/**
 * Transport types for logging
 */
var LogTransport;
(function (LogTransport) {
    LogTransport["CONSOLE"] = "console";
    LogTransport["FILE"] = "file";
    LogTransport["BOTH"] = "both";
})(LogTransport || (LogTransport = {}));
/**
 * Centralized logger for mcptix
 * Provides consistent, color-coded logging across all components
 * with support for file-based logging for MCP mode
 */
class Logger {
    /**
     * Initialize the logger
     * Creates log directory if it doesn't exist
     */
    static initialize() {
        // Create log directory if it doesn't exist and file logging is enabled
        if ([LogTransport.FILE, LogTransport.BOTH].includes(Logger.config.logTransport)) {
            try {
                if (!fs_1.default.existsSync(Logger.config.logDirectory)) {
                    fs_1.default.mkdirSync(Logger.config.logDirectory, { recursive: true });
                }
                Logger.logFilePath = path_1.default.join(Logger.config.logDirectory, Logger.config.logFilename);
                // Initialize log file with header
                const timestamp = new Date().toISOString();
                const header = `\n\n==== MCPTIX LOG STARTED AT ${timestamp} ====\n`;
                fs_1.default.appendFileSync(Logger.logFilePath, header);
                // Log to stderr in MCP mode that we've initialized file logging
                if (isMcpMode) {
                    console.error(`[LOGGER] Initialized file logging at ${Logger.logFilePath}`);
                }
            }
            catch (error) {
                // Log to stderr that file logging failed
                console.error(`[LOGGER] Failed to initialize file logging: ${error instanceof Error ? error.message : String(error)}`);
                // Fallback to console logging
                Logger.config.logTransport = LogTransport.CONSOLE;
            }
        }
    }
    /**
     * Configure the logger
     * @param config Configuration options
     */
    static configure(config) {
        const oldConfig = { ...Logger.config };
        Logger.config = { ...Logger.config, ...config };
        // Reinitialize if transport or directory changed
        if (oldConfig.logTransport !== Logger.config.logTransport ||
            oldConfig.logDirectory !== Logger.config.logDirectory ||
            oldConfig.logFilename !== Logger.config.logFilename) {
            Logger.initialize();
        }
    }
    /**
     * Set the base directory for logs
     * @param baseDir Base directory for all mcptix files
     */
    static setBaseDirectory(baseDir) {
        Logger.configure({
            logDirectory: path_1.default.join(baseDir, 'logs'),
        });
    }
    /**
     * Log an informational message
     * @param component Component name
     * @param message Message to log
     */
    static info(component, message) {
        Logger.log(LogLevel.INFO, component, message);
    }
    /**
     * Log a success message
     * @param component Component name
     * @param message Message to log
     */
    static success(component, message) {
        Logger.log(LogLevel.SUCCESS, component, message);
    }
    /**
     * Log a warning message
     * @param component Component name
     * @param message Message to log
     */
    static warn(component, message) {
        Logger.log(LogLevel.WARN, component, message);
    }
    /**
     * Log an error message
     * @param component Component name
     * @param message Message to log
     * @param error Optional error object
     */
    static error(component, message, error) {
        Logger.log(LogLevel.ERROR, component, message);
        if (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error && error.stack ? error.stack.split('\n').slice(1).join('\n') : '';
            const formattedErrorDetail = `  Error details: ${errorMessage}`;
            const formattedStackTrace = '  Stack trace:';
            // Log error details
            Logger.logToTransport(formattedErrorDetail, LogLevel.ERROR);
            // Log stack trace if available
            if (errorStack) {
                Logger.logToTransport(formattedStackTrace, LogLevel.ERROR);
                Logger.logToTransport(errorStack, LogLevel.ERROR);
            }
        }
    }
    /**
     * Log a debug message (only in debug mode)
     * @param component Component name
     * @param message Message to log
     */
    static debug(component, message) {
        if (Logger.config.logLevel === 'debug') {
            Logger.log(LogLevel.DEBUG, component, message);
        }
    }
    /**
     * Log an HTTP request
     * @param method HTTP method
     * @param path Request path
     * @param status HTTP status code
     * @param time Request processing time in ms
     */
    static request(method, path, status, time) {
        const methodColor = Logger.getMethodColor(method);
        const statusColor = status ? Logger.getStatusColor(status) : (text) => text;
        const methodStr = Logger.config.enableColors ? methodColor(method.padEnd(7)) : method.padEnd(7);
        const statusStr = status ? (Logger.config.enableColors ? statusColor(status.toString()) : status.toString()) : '';
        const timeStr = time ? `${time}ms` : '';
        const message = `${methodStr} ${path} ${statusStr} ${timeStr}`.trim();
        Logger.log(LogLevel.REQUEST, 'API', message);
    }
    /**
     * Internal logging method
     * @param level Log level
     * @param component Component name
     * @param message Message to log
     */
    static log(level, component, message) {
        // Skip if log level is higher than configured level
        if (!Logger.shouldLog(level)) {
            return;
        }
        const timestamp = Logger.config.showTimestamp ? `[${new Date().toISOString()}] ` : '';
        const colorFn = Logger.getColor(level);
        const componentStr = `[${component}]`;
        const formattedComponent = Logger.config.enableColors ? colorFn(componentStr) : componentStr;
        const logMessage = `${timestamp}${formattedComponent} ${message}`;
        // Log to appropriate transport
        Logger.logToTransport(logMessage, level);
    }
    /**
     * Log to the configured transport
     * @param message Formatted message to log
     * @param level Log level
     */
    static logToTransport(message, level) {
        // Initialize logger if not already done
        if ([LogTransport.FILE, LogTransport.BOTH].includes(Logger.config.logTransport) && !Logger.logFilePath) {
            Logger.initialize();
        }
        // Get color function for the log level
        const colorFn = Logger.getColor(level);
        // Log to console if configured
        if ([LogTransport.CONSOLE, LogTransport.BOTH].includes(Logger.config.logTransport)) {
            if (isMcpMode || level === LogLevel.ERROR || level === LogLevel.WARN) {
                // Use console.error in MCP mode or for errors/warnings
                console.error(Logger.config.enableColors ? message : message);
            }
            else {
                // Use console.log for other messages
                console.log(Logger.config.enableColors ? message : message);
            }
        }
        // Log to file if configured and initialized
        if ([LogTransport.FILE, LogTransport.BOTH].includes(Logger.config.logTransport) && Logger.logFilePath) {
            try {
                // Remove color codes for file logging
                const plainMessage = message.replace(/\u001b\[\d+m/g, '');
                fs_1.default.appendFileSync(Logger.logFilePath, `${plainMessage}\n`);
            }
            catch (error) {
                // Log to stderr if file logging fails
                console.error(`[LOGGER] Failed to write to log file: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
    /**
     * Check if a message at the given level should be logged
     * @param level Log level to check
     * @returns Whether the message should be logged
     */
    static shouldLog(level) {
        const levels = ['debug', 'info', 'warn', 'error'];
        const configLevelIndex = levels.indexOf(Logger.config.logLevel);
        const messageLevelIndex = levels.indexOf(level.toLowerCase());
        // Special case for 'success' and 'request' - treat as 'info'
        const effectiveMessageLevelIndex = messageLevelIndex >= 0 ? messageLevelIndex : levels.indexOf('info');
        return effectiveMessageLevelIndex >= configLevelIndex;
    }
    /**
     * Get color function for log level
     * @param level Log level
     * @returns Function that colors text
     */
    static getColor(level) {
        if (!Logger.config.enableColors) {
            return (text) => text;
        }
        switch (level) {
            case LogLevel.INFO:
                return (text) => chalk_1.default.blue(text);
            case LogLevel.SUCCESS:
                return (text) => chalk_1.default.green(text);
            case LogLevel.WARN:
                return (text) => chalk_1.default.yellow(text);
            case LogLevel.ERROR:
                return (text) => chalk_1.default.red(text);
            case LogLevel.DEBUG:
                return (text) => chalk_1.default.gray(text);
            case LogLevel.REQUEST:
                return (text) => chalk_1.default.cyan(text);
            default:
                return (text) => chalk_1.default.white(text);
        }
    }
    /**
     * Get color function for HTTP method
     * @param method HTTP method
     * @returns Chalk color function
     */
    static getMethodColor(method) {
        if (!Logger.config.enableColors) {
            return (text) => text;
        }
        switch (method.toUpperCase()) {
            case 'GET':
                return (text) => chalk_1.default.green(text);
            case 'POST':
                return (text) => chalk_1.default.blue(text);
            case 'PUT':
                return (text) => chalk_1.default.yellow(text);
            case 'DELETE':
                return (text) => chalk_1.default.red(text);
            case 'PATCH':
                return (text) => chalk_1.default.magenta(text);
            default:
                return (text) => chalk_1.default.white(text);
        }
    }
    /**
     * Get color function for HTTP status code
     * @param status HTTP status code
     * @returns Function that colors text
     */
    static getStatusColor(status) {
        if (!Logger.config.enableColors) {
            return (text) => text;
        }
        if (status >= 500) {
            return (text) => chalk_1.default.red(text);
        }
        else if (status >= 400) {
            return (text) => chalk_1.default.yellow(text);
        }
        else if (status >= 300) {
            return (text) => chalk_1.default.cyan(text);
        }
        else if (status >= 200) {
            return (text) => chalk_1.default.green(text);
        }
        else {
            return (text) => chalk_1.default.white(text);
        }
    }
}
exports.Logger = Logger;
Logger.config = {
    enableColors: true,
    showTimestamp: true,
    logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    logTransport: isMcpMode ? LogTransport.FILE : LogTransport.CONSOLE,
    logDirectory: process.env.MCPTIX_HOME_DIR
        ? path_1.default.join(process.env.MCPTIX_HOME_DIR, 'logs')
        : path_1.default.join(process.cwd(), '.mcptix', 'logs'),
    logFilename: 'mcptix.log',
};
Logger.logFilePath = null;
// Initialize the logger
Logger.initialize();
//# sourceMappingURL=logger.js.map