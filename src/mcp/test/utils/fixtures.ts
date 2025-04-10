// Reuse the existing fixtures or create new ones here
import { sampleTickets, sampleComments, sampleComplexityMetrics } from '../../../api/test/fixtures';

export { sampleTickets, sampleComments, sampleComplexityMetrics };

// Add any additional fixtures needed specifically for tools tests
export const sampleTicketWithOrderValue = {
  ...sampleTickets[0],
  order_value: 1000,
};

export const sampleTicketWithAgentContext = {
  ...sampleTickets[0],
  agent_context: '# Agent Workspace\nThis contains some important notes.',
};
