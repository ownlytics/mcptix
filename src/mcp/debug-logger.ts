/**
 * Debug logger for the MCP server
 * Writes logs to a file for later inspection
 */

import fs from 'fs';
import path from 'path';

// Create a singleton debug logger
export class DebugLogger {
  private static instance: DebugLogger | null = null;
  private logFile: string;
  private enabled: boolean = true;

  private constructor() {
    // Check if we're in development mode
    const isDevMode = process.env.EPIC_TRACKER_DEV_MODE === 'true';

    // Try to find a writable location for logs
    const locations = [
      // Try project directory first
      path.join(process.cwd(), '.epic-tracker', 'debug'),
      // In dev mode, try the test directory
      ...(isDevMode ? [path.join(process.cwd(), 'test-data', 'debug')] : []),
      // Fall back to home directory
      path.join(process.env.HOME || process.env.USERPROFILE || '/tmp', '.epic-tracker-debug'),
      // Last resort
      '/tmp',
    ];

    console.log(`[DebugLogger] Searching for writable log directory...`);
    let logDir = '';
    for (const dir of locations) {
      try {
        console.log(`[DebugLogger] Trying directory: ${dir}`);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        // Test if we can write to this directory
        const testFile = path.join(dir, 'test.txt');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        logDir = dir;
        console.log(`[DebugLogger] Found writable directory: ${dir}`);
        break;
      } catch (error) {
        console.log(
          `[DebugLogger] Cannot write to directory ${dir}: ${error instanceof Error ? error.message : String(error)}`,
        );

        // In dev mode, try to create the directory
        if (isDevMode) {
          try {
            console.log(`[DebugLogger] Attempting to create directory: ${dir}`);
            fs.mkdirSync(dir, { recursive: true });
            // Try writing again
            const testFile = path.join(dir, 'test.txt');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            logDir = dir;
            console.log(`[DebugLogger] Successfully created and wrote to directory: ${dir}`);
            break;
          } catch (createError) {
            console.log(
              `[DebugLogger] Failed to create directory: ${createError instanceof Error ? createError.message : String(createError)}`,
            );
          }
        }

        // Try next location
        continue;
      }
    }

    if (!logDir) {
      console.error('[DebugLogger] Could not find a writable location for debug logs');
      this.enabled = false;
      this.logFile = '';
      return;
    }

    this.logFile = path.join(logDir, 'mcp-debug.log');
    console.log(`[DebugLogger] Created log file at: ${this.logFile}`);
    this.log('==== MCP SERVER DEBUG LOG ====');
    this.log(`Process ID: ${process.pid}`);
    this.log(`Current working directory: ${process.cwd()}`);
    this.log(`Node version: ${process.version}`);
    this.log(`Command line args: ${process.argv.join(' ')}`);
  }

  /**
   * Find parent directories up to the filesystem root
   * @param startDir The starting directory
   * @returns Array of parent directory paths
   */
  private findParentDirectories(startDir: string): string[] {
    const parents: string[] = [];
    let dir = startDir;

    while (dir !== path.dirname(dir)) {
      dir = path.dirname(dir);
      parents.push(dir);
    }

    return parents;
  }

  public static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  public log(message: string): void {
    if (!this.enabled) return;

    try {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message}\n`;
      fs.appendFileSync(this.logFile, logMessage);
    } catch (error) {
      // If we can't write to the log file, disable logging
      console.error('Error writing to debug log:', error);
      this.enabled = false;
    }
  }

  public getLogPath(): string {
    return this.logFile;
  }
}
