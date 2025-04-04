/**
 * mcptix Logger
 * A centralized logging system with color-coded output
 */
/**
 * Logger configuration
 */
interface LoggerConfig {
    enableColors: boolean;
    showTimestamp: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
}
/**
 * Centralized logger for mcptix
 * Provides consistent, color-coded logging across all components
 */
export declare class Logger {
    private static config;
    /**
     * Configure the logger
     * @param config Configuration options
     */
    static configure(config: Partial<LoggerConfig>): void;
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