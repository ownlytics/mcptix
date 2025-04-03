"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
// Run the server
const server = new server_1.EpicTrackerMcpServer();
server.run().catch(console.error);
//# sourceMappingURL=index.js.map