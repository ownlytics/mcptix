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
    agent_context:
      '# API Server Implementation Notes\n\n## Requirements\n- RESTful design\n- Express.js framework\n- Proper error handling\n- Authentication middleware\n\n## Implementation Steps\n1. Set up Express server\n2. Define routes\n3. Implement controllers\n4. Add middleware\n5. Test endpoints',
  },
  {
    id: 'ticket-2',
    title: 'Add WebSocket support',
    description: 'Implement WebSocket for real-time updates',
    priority: 'medium',
    status: 'backlog',
    created: '2025-04-01T12:30:00Z',
    updated: '2025-04-01T12:30:00Z',
    agent_context:
      '# WebSocket Implementation\n\n## Libraries to Consider\n- Socket.IO\n- ws (WebSocket)\n- SockJS\n\n## Key Features\n- Real-time updates\n- Connection management\n- Error handling\n- Reconnection logic',
  },
  {
    id: 'ticket-3',
    title: 'Enhance error handling',
    description: 'Add comprehensive error handling to the API',
    priority: 'low',
    status: 'up-next',
    created: '2025-04-01T13:00:00Z',
    updated: '2025-04-01T13:00:00Z',
    agent_context:
      '# Error Handling Strategy\n\n## Approach\n- Centralized error middleware\n- Custom error classes\n- Consistent error response format\n- Logging integration\n\n## Error Categories\n1. Validation errors\n2. Authentication errors\n3. Authorization errors\n4. Resource not found\n5. Server errors',
  },
  {
    id: 'ticket-4',
    title: 'Write API documentation',
    description: 'Create documentation for the API endpoints',
    priority: 'medium',
    status: 'completed',
    created: '2025-04-01T13:30:00Z',
    updated: '2025-04-01T14:00:00Z',
    agent_context:
      '# API Documentation Plan\n\n## Documentation Tools\n- Swagger/OpenAPI\n- Postman Collections\n- Markdown files\n\n## Documentation Structure\n- Authentication\n- Endpoints by resource\n- Request/response examples\n- Error codes\n- Rate limiting',
  },
  {
    id: 'ticket-5',
    title: 'Implement search functionality',
    description: 'Add search endpoint to the API',
    priority: 'high',
    status: 'in-review',
    created: '2025-04-01T14:30:00Z',
    updated: '2025-04-01T14:30:00Z',
    agent_context:
      '# Search Implementation\n\n## Search Features\n- Full-text search\n- Filtering by fields\n- Sorting options\n- Pagination\n\n## Implementation Approach\n- Use SQLite FTS extension\n- Create search index\n- Implement query parsing\n- Add relevance scoring',
  },
];

// Sample comments for testing
export const sampleComments: Comment[] = [
  {
    id: 'comment-1',
    ticket_id: 'ticket-1',
    content: 'This is a test comment',
    author: 'developer',
    timestamp: '2025-04-01T12:30:00Z',
  },
  {
    id: 'comment-2',
    ticket_id: 'ticket-1',
    content: 'We should use Express for this',
    author: 'agent',
    timestamp: '2025-04-01T12:45:00Z',
  },
  {
    id: 'comment-3',
    ticket_id: 'ticket-2',
    content: 'Consider using Socket.IO',
    author: 'developer',
    timestamp: '2025-04-01T13:00:00Z',
  },
  {
    id: 'comment-4',
    ticket_id: 'ticket-3',
    content: 'We need to handle all edge cases',
    author: 'agent',
    timestamp: '2025-04-01T13:15:00Z',
  },
  {
    id: 'comment-5',
    ticket_id: 'ticket-4',
    content: 'Documentation looks good',
    author: 'developer',
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
  // Generate a unique test run ID to avoid ID conflicts
  const testRunId = Date.now();

  // Insert sample tickets with complexity metrics and unique IDs
  sampleTickets.forEach((ticket, index) => {
    // Create ticket with a unique ID for this test run
    const uniqueTicket = {
      ...ticket,
      id: `${ticket.id}-${testRunId}`, // Make ID unique for this test run
      complexity_metadata: sampleComplexityMetrics[index]
        ? {
            ...sampleComplexityMetrics[index],
            ticket_id: `${ticket.id}-${testRunId}`, // Update the ticket_id reference
          }
        : undefined,
    };

    ticketQueries.createTicket(uniqueTicket);
  });

  // Insert sample comments with updated ticket_ids
  sampleComments.forEach(comment => {
    const uniqueComment = {
      ...comment,
      id: `${comment.id}-${testRunId}`, // Make comment ID unique
      ticket_id: `${comment.ticket_id}-${testRunId}`, // Reference the unique ticket ID
    };

    ticketQueries.addComment(uniqueComment.ticket_id, uniqueComment);
  });
}
