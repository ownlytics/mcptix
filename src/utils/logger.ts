/**
 * mcptix Logger
 * A centralized logging system with console and file output
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

/**
 * Environment detection for MCP server mode
 * Using a function instead of a constant ensures we always have the latest value,
 * even if the environment variable is set after this module is initialized
 */
function isMcpMode(): boolean {
  return process.env.MCPTIX_MCP_MODE === 'true';
}

/**
 * Log levels with corresponding colors
 */
enum LogLevel {
  INFO = 'info',
  SUCCESS = 'success',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
  REQUEST = 'request',
}

/**
 * Transport types for logging
 */
enum LogTransport {
  CONSOLE = 'console',
  FILE = 'file',
  BOTH = 'both',
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
export class Logger {
  private static config: LoggerConfig = {
    enableColors: true,
    showTimestamp: true,
    logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    logTransport: isMcpMode() ? LogTransport.FILE : LogTransport.CONSOLE,
    logDirectory: process.env.MCPTIX_HOME_DIR
      ? path.join(process.env.MCPTIX_HOME_DIR, 'logs')
      : path.join(process.cwd(), '.mcptix', 'logs'),
    logFilename: 'mcptix.log',
  };

  private static logFilePath: string | null = null;

  /**
   * Initialize the logger
   * Creates log directory if it doesn't exist
   */
  public static initialize(): void {
    // Create log directory if it doesn't exist and file logging is enabled
    if ([LogTransport.FILE, LogTransport.BOTH].includes(Logger.config.logTransport)) {
      try {
        if (!fs.existsSync(Logger.config.logDirectory)) {
          fs.mkdirSync(Logger.config.logDirectory, { recursive: true });
        }

        Logger.logFilePath = path.join(Logger.config.logDirectory, Logger.config.logFilename);

        // Initialize log file with header
        const timestamp = new Date().toISOString();
        const header = `\n\n==== MCPTIX LOG STARTED AT ${timestamp} ====\n`;
        fs.appendFileSync(Logger.logFilePath, header);

        // Log to stderr in MCP mode that we've initialized file logging
        if (isMcpMode()) {
          console.error(`[LOGGER] Initialized file logging at ${Logger.logFilePath}`);
        }
      } catch (error) {
        // Log to stderr that file logging failed
        console.error(
          `[LOGGER] Failed to initialize file logging: ${error instanceof Error ? error.message : String(error)}`,
        );

        // Fallback to console logging
        Logger.config.logTransport = LogTransport.CONSOLE;
      }
    }
  }

  /**
   * Configure the logger
   * @param config Configuration options
   */
  public static configure(config: Partial<LoggerConfig>): void {
    const oldConfig = { ...Logger.config };
    Logger.config = { ...Logger.config, ...config };

    // Reinitialize if transport or directory changed
    if (
      oldConfig.logTransport !== Logger.config.logTransport ||
      oldConfig.logDirectory !== Logger.config.logDirectory ||
      oldConfig.logFilename !== Logger.config.logFilename
    ) {
      Logger.initialize();
    }
  }

  /**
   * Set the base directory for logs
   * @param baseDir Base directory for all mcptix files
   */
  public static setBaseDirectory(baseDir: string): void {
    Logger.configure({
      logDirectory: path.join(baseDir, 'logs'),
    });
  }

  /**
   * Log an informational message
   * @param component Component name
   * @param message Message to log
   */
  public static info(component: string, message: string): void {
    Logger.log(LogLevel.INFO, component, message);
  }

  /**
   * Log a success message
   * @param component Component name
   * @param message Message to log
   */
  public static success(component: string, message: string): void {
    Logger.log(LogLevel.SUCCESS, component, message);
  }

  /**
   * Log a warning message
   * @param component Component name
   * @param message Message to log
   */
  public static warn(component: string, message: string): void {
    Logger.log(LogLevel.WARN, component, message);
  }

  /**
   * Log an error message
   * @param component Component name
   * @param message Message to log
   * @param error Optional error object
   */
  public static error(component: string, message: string, error?: unknown): void {
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
  public static debug(component: string, message: string): void {
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
  public static request(method: string, path: string, status?: number, time?: number): void {
    const methodColor = Logger.getMethodColor(method);
    const statusColor = status ? Logger.getStatusColor(status) : (text: string) => text;

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
  private static log(level: LogLevel, component: string, message: string): void {
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
  private static logToTransport(message: string, level: LogLevel): void {
    // Initialize logger if not already done
    if ([LogTransport.FILE, LogTransport.BOTH].includes(Logger.config.logTransport) && !Logger.logFilePath) {
      Logger.initialize();
    }

    // Get color function for the log level
    const colorFn = Logger.getColor(level);

    // MCP mode check - must be evaluated at log time, not just initialization time
    const inMcpMode = isMcpMode();

    // In MCP mode, always log to stderr to avoid interfering with stdout MCP protocol
    if (inMcpMode) {
      console.error(Logger.config.enableColors ? message : message);
      // Exit early - in MCP mode we don't want to risk logging to stdout
      return;
    }

    // For non-MCP mode, log to console if configured
    if ([LogTransport.CONSOLE, LogTransport.BOTH].includes(Logger.config.logTransport)) {
      if (level === LogLevel.ERROR || level === LogLevel.WARN) {
        // Use console.error for errors/warnings
        console.error(Logger.config.enableColors ? message : message);
      } else {
        // Use console.log for other messages
        console.log(Logger.config.enableColors ? message : message);
      }
    }

    // Log to file if configured and initialized
    if ([LogTransport.FILE, LogTransport.BOTH].includes(Logger.config.logTransport) && Logger.logFilePath) {
      try {
        // Remove color codes for file logging
        const plainMessage = message.replace(/\u001b\[\d+m/g, '');
        fs.appendFileSync(Logger.logFilePath, `${plainMessage}\n`);
      } catch (error) {
        // Log to stderr if file logging fails
        console.error(
          `[LOGGER] Failed to write to log file: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  /**
   * Check if a message at the given level should be logged
   * @param level Log level to check
   * @returns Whether the message should be logged
   */
  private static shouldLog(level: LogLevel): boolean {
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
  private static getColor(level: LogLevel): (text: string) => string {
    if (!Logger.config.enableColors) {
      return (text: string) => text;
    }

    switch (level) {
      case LogLevel.INFO:
        return (text: string) => chalk.blue(text);
      case LogLevel.SUCCESS:
        return (text: string) => chalk.green(text);
      case LogLevel.WARN:
        return (text: string) => chalk.yellow(text);
      case LogLevel.ERROR:
        return (text: string) => chalk.red(text);
      case LogLevel.DEBUG:
        return (text: string) => chalk.gray(text);
      case LogLevel.REQUEST:
        return (text: string) => chalk.cyan(text);
      default:
        return (text: string) => chalk.white(text);
    }
  }

  /**
   * Get color function for HTTP method
   * @param method HTTP method
   * @returns Chalk color function
   */
  private static getMethodColor(method: string): (text: string) => string {
    if (!Logger.config.enableColors) {
      return (text: string) => text;
    }

    switch (method.toUpperCase()) {
      case 'GET':
        return (text: string) => chalk.green(text);
      case 'POST':
        return (text: string) => chalk.blue(text);
      case 'PUT':
        return (text: string) => chalk.yellow(text);
      case 'DELETE':
        return (text: string) => chalk.red(text);
      case 'PATCH':
        return (text: string) => chalk.magenta(text);
      default:
        return (text: string) => chalk.white(text);
    }
  }

  /**
   * Get color function for HTTP status code
   * @param status HTTP status code
   * @returns Function that colors text
   */
  private static getStatusColor(status: number): (text: string) => string {
    if (!Logger.config.enableColors) {
      return (text: string) => text;
    }

    if (status >= 500) {
      return (text: string) => chalk.red(text);
    } else if (status >= 400) {
      return (text: string) => chalk.yellow(text);
    } else if (status >= 300) {
      return (text: string) => chalk.cyan(text);
    } else if (status >= 200) {
      return (text: string) => chalk.green(text);
    } else {
      return (text: string) => chalk.white(text);
    }
  }
}

// Initialize the logger
Logger.initialize();
