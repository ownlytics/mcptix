"use strict";
/**
 * Epic Tracker Logger
 * A centralized logging system with color-coded output
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const chalk_1 = __importDefault(require("chalk"));
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
 * Centralized logger for Epic Tracker
 * Provides consistent, color-coded logging across all components
 */
class Logger {
    /**
     * Configure the logger
     * @param config Configuration options
     */
    static configure(config) {
        Logger.config = { ...Logger.config, ...config };
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
            console.error(Logger.getColor(LogLevel.ERROR)('  Error details:'), errorMessage);
            if (errorStack) {
                console.error(Logger.getColor(LogLevel.ERROR)('  Stack trace:'));
                console.error(errorStack);
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
        const statusStr = status
            ? Logger.config.enableColors
                ? statusColor(status.toString())
                : status.toString()
            : '';
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
        const timestamp = Logger.config.showTimestamp ? `[${new Date().toISOString()}] ` : '';
        const colorFn = Logger.getColor(level);
        const componentStr = `[${component}]`;
        const formattedComponent = Logger.config.enableColors ? colorFn(componentStr) : componentStr;
        console.log(`${timestamp}${formattedComponent} ${message}`);
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
};
//# sourceMappingURL=logger.js.map