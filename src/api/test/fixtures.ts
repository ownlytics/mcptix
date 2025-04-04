import { Ticket, Comment, ComplexityMetadata } from '../../types';

// Sample tickets for testing
export const sampleTickets: Ticket[] = [
  {
    id: 'ticket-1',
    title: 'Implement API server',
    description: 'Create a RESTful API server for mcptix',
    priority: 'high',
    status: 'in-progress',
    created: '2025-04-01T12:00:00Z',
    updated: '2025-04-01T12:00:00Z',
  },
  {
    id: 'ticket-2',
    title: 'Add WebSocket support',
    description: 'Implement WebSocket for real-time updates',
    priority: 'medium',
    status: 'backlog',
    created: '2025-04-01T12:30:00Z',
    updated: '2025-04-01T12:30:00Z',
  },
  {
    id: 'ticket-3',
    title: 'Enhance error handling',
    description: 'Add comprehensive error handling to the API',
    priority: 'low',
    status: 'up-next',
    created: '2025-04-01T13:00:00Z',
    updated: '2025-04-01T13:00:00Z',
  },
  {
    id: 'ticket-4',
    title: 'Write API documentation',
    description: 'Create documentation for the API endpoints',
    priority: 'medium',
    status: 'completed',
    created: '2025-04-01T13:30:00Z',
    updated: '2025-04-01T14:00:00Z',
  },
  {
    id: 'ticket-5',
    title: 'Implement search functionality',
    description: 'Add search endpoint to the API',
    priority: 'high',
    status: 'in-review',
    created: '2025-04-01T14:30:00Z',
    updated: '2025-04-01T14:30:00Z',
  },
];

// Sample comments for testing
export const sampleComments: Comment[] = [
  {
    id: 'comment-1',
    ticket_id: 'ticket-1',
    content: 'This is a test comment',
    type: 'comment',
    author: 'developer',
    status: 'open',
    timestamp: '2025-04-01T12:30:00Z',
  },
  {
    id: 'comment-2',
    ticket_id: 'ticket-1',
    content: 'We should use Express for this',
    type: 'comment',
    author: 'agent',
    status: 'open',
    timestamp: '2025-04-01T12:45:00Z',
  },
  {
    id: 'comment-3',
    ticket_id: 'ticket-2',
    content: 'Consider using Socket.IO',
    type: 'comment',
    author: 'developer',
    status: 'open',
    timestamp: '2025-04-01T13:00:00Z',
  },
  {
    id: 'comment-4',
    ticket_id: 'ticket-3',
    content: 'We need to handle all edge cases',
    type: 'request_changes',
    author: 'agent',
    status: 'open',
    timestamp: '2025-04-01T13:15:00Z',
  },
  {
    id: 'comment-5',
    ticket_id: 'ticket-4',
    content: 'Documentation looks good',
    type: 'comment',
    author: 'developer',
    status: 'resolved',
    timestamp: '2025-04-01T14:15:00Z',
  },
];

// Sample complexity metrics for testing
export const sampleComplexityMetrics: ComplexityMetadata[] = [
  {
    ticket_id: 'ticket-1',
    files_touched: 5,
    modules_crossed: 2,
    stack_layers_involved: 1,
    dependencies: 3,
    shared_state_touches: 2,
    cascade_impact_zones: 1,
    subjectivity_rating: 0.5,
    loc_added: 100,
    loc_modified: 50,
    test_cases_written: 10,
    edge_cases: 3,
    mocking_complexity: 2,
    coordination_touchpoints: 1,
    review_rounds: 1,
    blockers_encountered: 0,
    cie_score: 45.5,
  },
  {
    ticket_id: 'ticket-2',
    files_touched: 3,
    modules_crossed: 1,
    stack_layers_involved: 2,
    dependencies: 2,
    shared_state_touches: 1,
    cascade_impact_zones: 0,
    subjectivity_rating: 0.3,
    loc_added: 50,
    loc_modified: 20,
    test_cases_written: 5,
    edge_cases: 2,
    mocking_complexity: 1,
    coordination_touchpoints: 0,
    review_rounds: 1,
    blockers_encountered: 0,
    cie_score: 30.0,
  },
  {
    ticket_id: 'ticket-3',
    files_touched: 8,
    modules_crossed: 3,
    stack_layers_involved: 2,
    dependencies: 4,
    shared_state_touches: 3,
    cascade_impact_zones: 2,
    subjectivity_rating: 0.7,
    loc_added: 150,
    loc_modified: 80,
    test_cases_written: 15,
    edge_cases: 5,
    mocking_complexity: 3,
    coordination_touchpoints: 2,
    review_rounds: 2,
    blockers_encountered: 1,
    cie_score: 60.0,
  },
  {
    ticket_id: 'ticket-4',
    files_touched: 2,
    modules_crossed: 0,
    stack_layers_involved: 0,
    dependencies: 0,
    shared_state_touches: 0,
    cascade_impact_zones: 0,
    subjectivity_rating: 0.2,
    loc_added: 30,
    loc_modified: 0,
    test_cases_written: 0,
    edge_cases: 0,
    mocking_complexity: 0,
    coordination_touchpoints: 0,
    review_rounds: 1,
    blockers_encountered: 0,
    cie_score: 15.0,
  },
  {
    ticket_id: 'ticket-5',
    files_touched: 4,
    modules_crossed: 2,
    stack_layers_involved: 1,
    dependencies: 2,
    shared_state_touches: 1,
    cascade_impact_zones: 1,
    subjectivity_rating: 0.4,
    loc_added: 80,
    loc_modified: 30,
    test_cases_written: 8,
    edge_cases: 3,
    mocking_complexity: 2,
    coordination_touchpoints: 1,
    review_rounds: 1,
    blockers_encountered: 0,
    cie_score: 40.0,
  },
];

// Helper to seed the database with test data
export function seedTestData(ticketQueries: any): void {
  // Insert sample tickets with complexity metrics
  sampleTickets.forEach((ticket, index) => {
    // Create ticket
    ticketQueries.createTicket({
      ...ticket,
      complexity_metadata: sampleComplexityMetrics[index],
    });
  });

  // Insert sample comments
  sampleComments.forEach(comment => {
    ticketQueries.addComment(comment.ticket_id, comment);
  });
}
