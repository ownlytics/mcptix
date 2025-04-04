"use strict";
/**
 * Debug logger for the MCP server
 * Writes logs to a file for later inspection
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugLogger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Create a singleton debug logger
class DebugLogger {
    constructor() {
        this.enabled = true;
        // Check if we're in development mode
        const isDevMode = process.env.EPIC_TRACKER_DEV_MODE === 'true';
        // Try to find a writable location for logs
        const locations = [
            // Try project directory first
            path_1.default.join(process.cwd(), '.mcptix', 'debug'),
            // In dev mode, try the test directory
            ...(isDevMode ? [path_1.default.join(process.cwd(), 'test-data', 'debug')] : []),
            // Fall back to home directory
            path_1.default.join(process.env.HOME || process.env.USERPROFILE || '/tmp', '.mcptix-debug'),
            // Last resort
            '/tmp',
        ];
        console.log(`[DebugLogger] Searching for writable log directory...`);
        let logDir = '';
        for (const dir of locations) {
            try {
                console.log(`[DebugLogger] Trying directory: ${dir}`);
                if (!fs_1.default.existsSync(dir)) {
                    fs_1.default.mkdirSync(dir, { recursive: true });
                }
                // Test if we can write to this directory
                const testFile = path_1.default.join(dir, 'test.txt');
                fs_1.default.writeFileSync(testFile, 'test');
                fs_1.default.unlinkSync(testFile);
                logDir = dir;
                console.log(`[DebugLogger] Found writable directory: ${dir}`);
                break;
            }
            catch (error) {
                console.log(`[DebugLogger] Cannot write to directory ${dir}: ${error instanceof Error ? error.message : String(error)}`);
                // In dev mode, try to create the directory
                if (isDevMode) {
                    try {
                        console.log(`[DebugLogger] Attempting to create directory: ${dir}`);
                        fs_1.default.mkdirSync(dir, { recursive: true });
                        // Try writing again
                        const testFile = path_1.default.join(dir, 'test.txt');
                        fs_1.default.writeFileSync(testFile, 'test');
                        fs_1.default.unlinkSync(testFile);
                        logDir = dir;
                        console.log(`[DebugLogger] Successfully created and wrote to directory: ${dir}`);
                        break;
                    }
                    catch (createError) {
                        console.log(`[DebugLogger] Failed to create directory: ${createError instanceof Error ? createError.message : String(createError)}`);
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
        this.logFile = path_1.default.join(logDir, 'mcp-debug.log');
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
    findParentDirectories(startDir) {
        const parents = [];
        let dir = startDir;
        while (dir !== path_1.default.dirname(dir)) {
            dir = path_1.default.dirname(dir);
            parents.push(dir);
        }
        return parents;
    }
    static getInstance() {
        if (!DebugLogger.instance) {
            DebugLogger.instance = new DebugLogger();
        }
        return DebugLogger.instance;
    }
    log(message) {
        if (!this.enabled)
            return;
        try {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] ${message}\n`;
            fs_1.default.appendFileSync(this.logFile, logMessage);
        }
        catch (error) {
            // If we can't write to the log file, disable logging
            console.error('Error writing to debug log:', error);
            this.enabled = false;
        }
    }
    getLogPath() {
        return this.logFile;
    }
}
exports.DebugLogger = DebugLogger;
DebugLogger.instance = null;
//# sourceMappingURL=debug-logger.js.map