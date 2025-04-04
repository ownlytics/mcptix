"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiServer = void 0;
const path_1 = __importDefault(require("path"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const middleware_1 = require("./middleware");
const routes_1 = require("./routes");
/**
 * API Server class for the Epic Tracker MCP
 */
class ApiServer {
    /**
     * Creates a new API server instance
     * @param ticketQueries The TicketQueries instance to use
     */
    constructor(ticketQueries) {
        this.server = null;
        this.ticketQueries = ticketQueries;
        this.app = (0, express_1.default)();
        // Configure middleware
        this.app.use((0, cors_1.default)());
        this.app.use(body_parser_1.default.json());
        this.app.use(middleware_1.requestLogger);
        // Set up routes
        (0, routes_1.setupRoutes)(this.app, this.ticketQueries);
        // Serve static files from the public directory
        const publicPath = path_1.default.join(__dirname, '../../public');
        this.app.use(express_1.default.static(publicPath));
        // Serve index.html for the root route
        this.app.get('/', (req, res) => {
            res.sendFile(path_1.default.join(publicPath, 'index.html'));
        });
        // Error handling
        this.app.use(middleware_1.notFoundHandler);
        this.app.use(middleware_1.errorHandler);
    }
    /**
     * Get the Express application instance
     * @returns The Express application
     */
    getApp() {
        return this.app;
    }
    /**
     * Check if the server is running
     * @returns True if the server is running, false otherwise
     */
    isRunning() {
        return this.server !== null;
    }
    /**
     * Start the API server
     * @param port The port to listen on (default: 3000)
     * @returns A promise that resolves when the server is started
     */
    /**
     * Start the API server
     * @param port The port to listen on (default: 3000)
     * @param host The host to listen on (default: 'localhost')
     * @returns A promise that resolves when the server is started
     */
    start(port = 3000, host = 'localhost') {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(port, host, () => {
                    console.log(`API server running at http://${host}:${port}`);
                    resolve();
                });
            }
            catch (error) {
                console.error(`Error starting API server: ${error instanceof Error ? error.message : String(error)}`);
                reject(error);
            }
        });
    }
    /**
     * Stop the API server
     * @returns A promise that resolves when the server is stopped
     */
    /**
     * Stop the API server
     * @returns A promise that resolves when the server is stopped
     */
    stop() {
        return new Promise((resolve, reject) => {
            if (!this.server) {
                console.log('API server is not running');
                resolve();
                return;
            }
            this.server.close(err => {
                if (err) {
                    console.error(`Error stopping API server: ${err.message}`);
                    reject(err);
                }
                else {
                    this.server = null;
                    console.log('API server stopped');
                    resolve();
                }
            });
        });
    }
}
exports.ApiServer = ApiServer;
//# sourceMappingURL=server.js.map