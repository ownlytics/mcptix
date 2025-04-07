/**
 * mcptix Logger
 * A centralized logging system with console and file output
 */
/**
 * Transport types for logging
 */
declare enum LogTransport {
    CONSOLE = "console",
    FILE = "file",
    BOTH = "both"
}
/**
 * Logger configuration
 */
interface LoggerConfig {
    enableColors: boolean;
    showTimestamp: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    logTransport: LogTransport;
    logDirectory: string;
    logFilename: string;
}
/**
 * Centralized logger for mcptix
 * Provides consistent, color-coded logging across all components
 * with support for file-based logging for MCP mode
 */
export declare class Logger {
    private static config;
    private static logFilePath;
    /**
     * Initialize the logger
     * Creates log directory if it doesn't exist
     */
    static initialize(): void;
    /**
     * Configure the logger
     * @param config Configuration options
     */
    static configure(config: Partial<LoggerConfig>): void;
    /**
     * Set the base directory for logs
     * @param baseDir Base directory for all mcptix files
     */
    static setBaseDirectory(baseDir: string): void;
    /**
     * Log an informational message
     * @param component Component name
     * @param message Message to log
     */
    static info(component: string, message: string): void;
    /**
     * Log a success message
     * @param component Component name
     * @param message Message to log
     */
    static success(component: string, message: string): void;
    /**
     * Log a warning message
     * @param component Component name
     * @param message Message to log
     */
    static warn(component: string, message: string): void;
    /**
     * Log an error message
     * @param component Component name
     * @param message Message to log
     * @param error Optional error object
     */
    static error(component: string, message: string, error?: unknown): void;
    /**
     * Log a debug message (only in debug mode)
     * @param component Component name
     * @param message Message to log
     */
    static debug(component: string, message: string): void;
    /**
     * Log an HTTP request
     * @param method HTTP method
     * @param path Request path
     * @param status HTTP status code
     * @param time Request processing time in ms
     */
    static request(method: string, path: string, status?: number, time?: number): void;
    /**
     * Internal logging method
     * @param level Log level
     * @param component Component name
     * @param message Message to log
     */
    private static log;
    /**
     * Log to the configured transport
     * @param message Formatted message to log
     * @param level Log level
     */
    private static logToTransport;
    /**
     * Check if a message at the given level should be logged
     * @param level Log level to check
     * @returns Whether the message should be logged
     */
    private static shouldLog;
    /**
     * Get color function for log level
     * @param level Log level
     * @returns Function that colors text
     */
    private static getColor;
    /**
     * Get color function for HTTP method
     * @param method HTTP method
     * @returns Chalk color function
     */
    private static getMethodColor;
    /**
     * Get color function for HTTP status code
     * @param status HTTP status code
     * @returns Function that colors text
     */
    private static getStatusColor;
}
export {};
//# sourceMappingURL=logger.d.ts.map