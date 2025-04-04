/**
 * Debug logger for the MCP server
 * Writes logs to a file for later inspection
 */
export declare class DebugLogger {
    private static instance;
    private logFile;
    private enabled;
    private constructor();
    /**
     * Find parent directories up to the filesystem root
     * @param startDir The starting directory
     * @returns Array of parent directory paths
     */
    private findParentDirectories;
    static getInstance(): DebugLogger;
    log(message: string): void;
    getLogPath(): string;
}
//# sourceMappingURL=debug-logger.d.ts.map