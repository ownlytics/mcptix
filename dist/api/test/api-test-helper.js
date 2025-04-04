"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestServer = createTestServer;
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../server");
/**
 * Creates a test server for API testing
 * @param ticketQueries The TicketQueries instance to use
 * @returns An object with the Express app, server instance, and a request function
 */
function createTestServer(ticketQueries) {
    const apiServer = new server_1.ApiServer(ticketQueries);
    return {
        app: apiServer.getApp(),
        server: apiServer,
        request: () => (0, supertest_1.default)(apiServer.getApp()),
    };
}
//# sourceMappingURL=api-test-helper.js.map