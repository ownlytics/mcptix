import request from 'supertest';
import { ApiServer } from '../server';
import { TicketQueries } from '../../db/queries';
/**
 * Creates a test server for API testing
 * @param ticketQueries The TicketQueries instance to use
 * @returns An object with the Express app, server instance, and a request function
 */
export declare function createTestServer(ticketQueries: TicketQueries): {
    app: import("express").Application;
    server: ApiServer;
    request: () => import("supertest/lib/agent")<request.SuperTestStatic.Test>;
};
