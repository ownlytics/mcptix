import request from 'supertest';
import { ApiServer } from '../server';
import { TicketQueries } from '../../db/queries';

/**
 * Creates a test server for API testing
 * @param ticketQueries The TicketQueries instance to use
 * @returns An object with the Express app, server instance, and a request function
 */
export function createTestServer(ticketQueries: TicketQueries) {
  const apiServer = new ApiServer(ticketQueries);
  return {
    app: apiServer.getApp(),
    server: apiServer,
    request: () => request(apiServer.getApp())
  };
}