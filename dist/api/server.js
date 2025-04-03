"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const path_1 = __importDefault(require("path"));
const routes_1 = require("./routes");
const middleware_1 = require("./middleware");
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
        // Serve index.html for all routes not handled by the API
        this.app.get('*', (req, res, next) => {
            // Skip if the request is for an API endpoint
            if (req.path.startsWith('/api/')) {
                return next();
            }
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
    start(port = 3000) {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(port, () => {
                    console.log(`API server running on port ${port}`);
                    resolve();
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Stop the API server
     * @returns A promise that resolves when the server is stopped
     */
    stop() {
        return new Promise((resolve, reject) => {
            if (!this.server) {
                resolve();
                return;
            }
            this.server.close((err) => {
                if (err) {
                    reject(err);
                }
                else {
                    this.server = null;
                    resolve();
                }
            });
        });
    }
}
exports.ApiServer = ApiServer;
//# sourceMappingURL=server.js.map