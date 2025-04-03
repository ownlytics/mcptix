import { EpicTrackerMcpServer } from './server';

// Run the server
const server = new EpicTrackerMcpServer();
server.run().catch(console.error);