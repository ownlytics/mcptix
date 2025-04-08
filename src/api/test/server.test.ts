import { ApiServer } from '../server';
import { initTestDatabase, cleanupTestDatabase } from './test-utils';

describe('API Server', () => {
  let db: any;
  let ticketQueries: any;
  let apiServer: ApiServer;

  beforeAll(() => {
    const testEnv = initTestDatabase();
    db = testEnv.db;
    ticketQueries = testEnv.ticketQueries;
  });

  afterAll(() => {
    cleanupTestDatabase(db);
  });

  test('should initialize correctly', () => {
    apiServer = new ApiServer(ticketQueries);
    expect(apiServer).toBeDefined();
    expect(apiServer.getApp()).toBeDefined();
    expect(apiServer.isRunning()).toBe(false);
  });

  test('should start and stop the server', async () => {
    apiServer = new ApiServer(ticketQueries);

    // Start the server
    await apiServer.start(3001);
    expect(apiServer.isRunning()).toBe(true);

    // Stop the server
    await apiServer.stop();
    expect(apiServer.isRunning()).toBe(false);
  });
});
