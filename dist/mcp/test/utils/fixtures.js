"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sampleTicketWithAgentContext = exports.sampleTicketWithOrderValue = exports.sampleComplexityMetrics = exports.sampleComments = exports.sampleTickets = void 0;
// Reuse the existing fixtures or create new ones here
const fixtures_1 = require("../../../api/test/fixtures");
Object.defineProperty(exports, "sampleTickets", { enumerable: true, get: function () { return fixtures_1.sampleTickets; } });
Object.defineProperty(exports, "sampleComments", { enumerable: true, get: function () { return fixtures_1.sampleComments; } });
Object.defineProperty(exports, "sampleComplexityMetrics", { enumerable: true, get: function () { return fixtures_1.sampleComplexityMetrics; } });
// Add any additional fixtures needed specifically for tools tests
exports.sampleTicketWithOrderValue = {
    ...fixtures_1.sampleTickets[0],
    order_value: 1000,
};
exports.sampleTicketWithAgentContext = {
    ...fixtures_1.sampleTickets[0],
    agent_context: '# Agent Workspace\nThis contains some important notes.',
};
//# sourceMappingURL=fixtures.js.map