/**
 * mcptix Logger
 * A centralized logging system with color-coded output
 */

import chalk from 'chalk';

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
export class Logger {
  private static config: LoggerConfig = {
    enableColors: true,
    showTimestamp: true,
    logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  };

  /**
   * Configure the logger
   * @param config Configuration options
   */
  public static configure(config: Partial<LoggerConfig>): void {
    Logger.config = { ...Logger.config, ...config };
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

      const errorStack =
        error instanceof Error && error.stack ? error.stack.split('\n').slice(1).join('\n') : '';

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
  private static log(level: LogLevel, component: string, message: string): void {
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
