# Comprehensive Test Coverage Improvement Plan

Based on analysis of the codebase and the coverage report, this is a detailed plan to increase test coverage above 90% for all components. This plan is organized by component and prioritizes files with 0% coverage first, followed by those with low coverage.

## Overview of Current Coverage

```
--------------------------|---------|----------|---------|---------|-------------------------------------------
File                      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------------|---------|----------|---------|---------|-------------------------------------------
All files                 |   30.42 |    28.86 |   38.84 |   30.54 |
 src                      |       0 |        0 |       0 |       0 |
  config.ts               |       0 |        0 |       0 |       0 | 56-88
  index.ts                |       0 |        0 |       0 |       0 | 6-171
 src/api                  |   50.81 |    25.71 |      60 |   50.81 |
  middleware.ts           |   76.19 |       40 |   66.66 |   76.19 | 9,21-29
  routes.ts               |   36.95 |    26.53 |      40 |   36.95 | ...55-168,174-187,196-222,232-260,267-272
  server.ts               |   66.03 |    15.38 |      90 |   66.03 | 44,87-88,104-106,113-119,129-135
  validation.ts           |   47.05 |    33.33 |      25 |   47.05 | 25,34-40,49-55
 src/api/test             |   94.87 |    33.33 |     100 |   94.87 |
  api-test-helper.ts      |     100 |      100 |     100 |     100 |
  fixtures.ts             |     100 |      100 |     100 |     100 |
  test-utils.ts           |      92 |    33.33 |     100 |      92 | 17,22
 src/db                   |   55.15 |    45.58 |   65.21 |   55.25 |
  queries.ts              |    90.9 |    53.21 |     100 |   91.66 | 269-280,333-372,475
  schema.ts               |   55.93 |    22.72 |      80 |   55.93 | 18-34,39,83-84,89-90,159-162,175,186-205
  service.ts              |       0 |        0 |       0 |       0 | 1-214
 src/mcp                  |   24.52 |    48.06 |   32.35 |   24.52 |
  debug-logger.ts         |    6.34 |        0 |       0 |    6.45 | 13-130
  index.ts                |       0 |        0 |       0 |       0 | 1-198
  resources.ts            |       0 |        0 |       0 |       0 | 2-196
  server.ts               |       0 |        0 |       0 |       0 | 1-131
  tools.ts                |     100 |    96.87 |     100 |     100 | 326,406
 src/utils                |   47.95 |    27.16 |   37.14 |   53.94 |
  complexityCalculator.ts |      30 |        0 |       0 |      30 | 58-120
  logger.ts               |      50 |    43.13 |   38.23 |   57.57 | ...68-172,176,187,196-202,213,217,221,225
--------------------------|---------|----------|---------|---------|-------------------------------------------
```

## Testing Approach

- We'll use mocks and stubs for all external dependencies to keep tests fast and reliable
- We'll focus on unit tests first to quickly increase coverage
- We'll prioritize files with 0% coverage, then move to those with low coverage
- We'll ensure all components reach at least 90% coverage

## 1. MCP Components (Partially Covered)

The MCP components represent a critical part of the application. We've made progress with tools.ts, but several files still need test coverage:

### 1.1. src/mcp/index.ts (✅ 100% Line Coverage)

This file contains the standalone MCP server initialization logic.

**Implementation Status: COMPLETED**

A comprehensive test suite has been implemented for this file covering:

- Database path resolution strategy with different environment variables and file structures
- Database initialization and error handling
- MCP server creation and startup
- Signal handling (SIGINT, SIGTERM) for graceful shutdown
- Helper functions like findFileInParents

### 1.2. src/mcp/server.ts (✅ 100% Line Coverage, 100% Branch Coverage)

This file contains the McpTixServer class that handles MCP protocol interactions.

**Implementation Status: COMPLETED**

A comprehensive test suite has been implemented for this file with 16 test cases covering:

- Server initialization with proper configuration
- Server startup and connection with StdioServerTransport
- Server shutdown and cleanup
- Error handling for both startup and shutdown
- Handling of both Error objects and non-Error values in error scenarios
- Server state tracking via isServerRunning
- Proper logging of server activities

### 1.3. src/mcp/tools.ts (✅ 100% Line Coverage, 96.87% Branch Coverage)

This file contains tool definitions for the MCP server.

**Implementation Status: COMPLETED**

A comprehensive test suite has been implemented for this file with 30 test cases covering:

- All tool handlers (list_tickets, get_ticket, create_ticket, update_ticket, delete_ticket, add_comment, search_tickets, get_stats)
- Success and error paths for each handler
- Input validation and edge cases
- Error handling for unknown tools and unexpected errors

The only uncovered branches are at lines 326 and 406, which are edge cases in the error handling logic.

### 1.4. src/mcp/resources.ts (✅ 100% Line Coverage, 100% Branch Coverage)

This file contains resource definitions for the MCP server.

**Implementation Status: COMPLETED**

A comprehensive test suite has been implemented for this file with 15 test cases covering:

- All resource handlers (list_resources, list_resource_templates, read_resource)
- All resource URI patterns (tickets://all, tickets://status/{status}, tickets://id/{id})
- Success and error paths for each handler
- Input validation and edge cases
- Error handling for invalid URIs, unknown protocols, and unexpected errors
- Both Error and non-Error object error handling

### 1.5. src/mcp/debug-logger.ts (✅ 98.38% Line Coverage, 64.28% Branch Coverage)

This file contains logging functionality specific to MCP.

**Implementation Status: COMPLETED**

A comprehensive test suite has been implemented for this file with 10 test cases covering:

- Singleton pattern via `getInstance()`
- Constructor logic for finding writable directories
- Fallback behavior when primary directories aren't writable
- Dev mode behavior
- The `findParentDirectories` utility method
- Logging functionality
- Error handling when writing logs fails
- Path retrieval via `getLogPath()`

Only line 64 remains uncovered, which is an edge case in the dev mode directory creation logic.

## 2. Core Components with 0% Coverage

### 2.1. src/config.ts

This file contains configuration loading and management.

**Testing Strategy:**

- Test configuration loading from different sources (env vars, files)
- Test default values
- Test validation logic
- Test error handling

### 2.2. src/index.ts

This is the main entry point of the application.

**Testing Strategy:**

- Mock dependencies (ApiServer, McpTixServer, etc.)
- Test command-line argument parsing
- Test initialization logic for different modes (API, MCP)
- Test error handling

### 2.3. src/db/service.ts (✅ 100% Line Coverage, 82.14% Branch Coverage)

This file contains the DatabaseService singleton for managing database connections.

**Implementation Status: COMPLETED**

A comprehensive test suite has been implemented for this file with 16 test cases covering:

- Singleton pattern via `getInstance()`
- Database initialization with different path types (string, config object)
- Path safety checks and redirection of unsafe paths
- Directory creation and fallback mechanisms
- Database operations including connection reuse
- Error handling for invalid paths, permissions, and initialization failures
- Connection closing and cleanup

The only uncovered branches are at lines 66, 89, and 139, which are edge cases in the directory creation and error handling logic.

## 3. API Components with Low Coverage

### 3.1. src/api/routes.ts (36.95% coverage)

This file sets up the API routes and handlers.

**Testing Strategy:**

- Test each route handler individually
- Test error handling in each route
- Test validation middleware integration
- Test query parameter handling
- Test response formatting

### 3.2. src/api/validation.ts (✅ 100% Coverage)

This file contains validation functions for API requests.

**Implementation Status: COMPLETED**

A comprehensive test suite has been implemented for this file with 10 test cases covering:

- All validation functions (validateCreateTicket, validateUpdateTicket, validateCreateComment, validateSearch)
- Valid inputs for each function
- Invalid inputs including missing required fields
- Edge cases with empty values

### 3.3. src/api/server.ts (66.03% coverage)

This file contains the ApiServer class.

**Testing Strategy:**

- Test server initialization with different configurations
- Test middleware setup
- Test error handling
- Test start and stop methods with various scenarios
- Test static file serving

### 3.4. src/api/middleware.ts (76.19% coverage)

This file contains Express middleware functions.

**Testing Strategy:**

- Test each middleware function individually
- Test error handling middleware with various error types
- Test request logging with different request types
- Test validation middleware with valid and invalid requests

## 4. Database Components with Low Coverage

### 4.1. src/db/schema.ts (55.93% coverage)

This file contains database schema initialization.

**Testing Strategy:**

- Test schema creation with various options
- Test index creation
- Test foreign key constraints
- Test error handling for invalid paths or permissions

### 4.2. src/db/queries.ts (90.9% coverage)

This file has good coverage but still needs improvement.

**Testing Strategy:**

- Test remaining uncovered query methods
- Test edge cases and error handling
- Test with various filter combinations
- Test with invalid inputs

## 5. Utility Components with Low Coverage

### 5.1. src/utils/complexityCalculator.ts (30% coverage)

This file contains the complexity score calculation logic.

**Testing Strategy:**

- Test the calculateComplexityScore function with various inputs
- Test edge cases (empty metrics, extreme values)
- Test normalization logic
- Test weighting logic
- Test score calculation with different combinations of metrics

### 5.2. src/utils/logger.ts (50% coverage)

This file contains the logging functionality.

**Testing Strategy:**

- Test each log level method
- Test configuration options
- Test color formatting
- Test timestamp formatting
- Test error logging with different error types
- Test HTTP request logging with different methods and status codes

## Implementation Plan

I propose implementing this test coverage improvement in phases:

### Phase 1: Core Components (Weeks 1-2)

- Create tests for src/db/service.ts
- Create tests for src/config.ts
- Create tests for src/index.ts

### Phase 2: MCP Components (Weeks 3-4)

- ✅ Create tests for src/mcp/tools.ts
- ✅ Create tests for src/mcp/debug-logger.ts
- ✅ Create tests for src/mcp/index.ts
- ✅ Create tests for src/mcp/resources.ts
- Create tests for src/mcp/server.ts
- Focus on mocking external dependencies

### Phase 3: API Components (Weeks 5-6)

- Improve coverage for src/api/routes.ts
- Improve coverage for src/api/validation.ts
- Improve coverage for src/api/server.ts
- Improve coverage for src/api/middleware.ts

### Phase 4: Utilities and Remaining Components (Weeks 7-8)

- Improve coverage for src/utils/complexityCalculator.ts
- Improve coverage for src/utils/logger.ts
- Improve coverage for src/db/schema.ts
- Address any remaining gaps

## Test Structure and Patterns

For consistency across the project, I recommend the following test structure:

```typescript
describe('Component Name', () => {
  // Setup and teardown
  beforeEach(() => {
    // Initialize mocks and test data
  });

  afterEach(() => {
    // Clean up
  });

  describe('Function or Method Name', () => {
    test('should handle successful case', () => {
      // Test happy path
    });

    test('should handle error case', () => {
      // Test error handling
    });

    test('should handle edge cases', () => {
      // Test edge cases
    });
  });
});
```

## Mocking Strategy

For external dependencies, we'll use Jest's mocking capabilities:

1. **Module Mocks**: For external modules like the MCP SDK

   ```typescript
   jest.mock('@modelcontextprotocol/sdk', () => ({
     // Mock implementation
   }));
   ```

2. **Function Mocks**: For specific functions

   ```typescript
   const mockFunction = jest.fn();
   mockFunction.mockReturnValue(expectedValue);
   ```

3. **Class Mocks**: For classes like DatabaseService
   ```typescript
   jest.mock('../db/service', () => ({
     DatabaseService: {
       getInstance: jest.fn().mockReturnValue({
         initialize: jest.fn(),
         getDatabase: jest.fn(),
         close: jest.fn(),
       }),
     },
   }));
   ```

## Continuous Integration and Monitoring

To ensure we maintain high coverage as the codebase evolves:

1. Update the Jest configuration to enforce coverage thresholds:

   ```javascript
   coverageThreshold: {
     global: {
       branches: 90,
       functions: 90,
       lines: 90,
       statements: 90,
     },
   },
   ```

2. Add a pre-commit hook to run tests and check coverage
3. Add coverage reporting to CI/CD pipeline

## Example Test Implementation

Here's an example of how we might implement tests for the DatabaseService:

```typescript
import fs from 'fs';
import path from 'path';
import { DatabaseService } from './service';

// Mock external dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('better-sqlite3');
jest.mock('../utils/logger');

describe('DatabaseService', () => {
  let dbService: DatabaseService;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Reset singleton
    (DatabaseService as any).instance = null;

    // Get instance
    dbService = DatabaseService.getInstance();
  });

  describe('getInstance', () => {
    test('should return singleton instance', () => {
      const instance1 = DatabaseService.getInstance();
      const instance2 = DatabaseService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    test('should initialize database with path string', () => {
      const mockDb = {};
      (require('better-sqlite3') as jest.Mock).mockReturnValue(mockDb);

      const result = dbService.initialize('/test/path.db');

      expect(result).toBe(mockDb);
      expect(require('better-sqlite3')).toHaveBeenCalledWith('/test/path.db');
    });

    // More tests for different scenarios...
  });

  // More test cases for other methods...
});
```

## Summary

This comprehensive plan addresses all components of the mcptix package, with a focus on increasing test coverage above 90% across the board. By following this structured approach:

1. We'll start with completely uncovered components
2. We'll use mocks and stubs for external dependencies
3. We'll test both happy paths and error scenarios
4. We'll ensure all edge cases are covered
5. We'll implement continuous monitoring to maintain coverage

## Progress Update (2025-04-04)

- ✅ Completed comprehensive test suite for src/mcp/tools.ts with 100% line coverage and 96.87% branch coverage
- ✅ Completed comprehensive test suite for src/mcp/debug-logger.ts with 98.38% line coverage and 64.28% branch coverage
- ✅ Completed comprehensive test suite for src/mcp/index.ts with tests covering:
  - Database path resolution strategy with different environment variables and file structures
  - Database initialization and error handling
  - MCP server creation and startup
  - Signal handling (SIGINT, SIGTERM) for graceful shutdown
  - Helper functions like findFileInParents
- ✅ Completed comprehensive test suite for src/mcp/resources.ts with 100% line coverage and 100% branch coverage, covering:
  - All resource handlers and URI patterns
  - Success and error paths
  - Input validation and edge cases
  - Error handling for various scenarios
- ✅ Completed comprehensive test suite for src/mcp/server.ts with 100% line coverage and 100% branch coverage, covering:
  - Server initialization with proper configuration
  - Server startup and connection with StdioServerTransport
  - Server shutdown and cleanup
  - Error handling for both startup and shutdown
  - Handling of both Error objects and non-Error values in error scenarios
  - Server state tracking via isServerRunning
  - Proper logging of server activities
- ✅ Completed comprehensive test suite for src/db/service.ts with 100% line coverage and 82.14% branch coverage, covering:
  - Singleton pattern via getInstance()
  - Database initialization with different path types
  - Path safety checks and redirection of unsafe paths
  - Directory creation and fallback mechanisms
  - Database operations including connection reuse
  - Error handling for invalid paths, permissions, and initialization failures
  - Connection closing and cleanup
- ✅ Completed comprehensive test suite for src/api/validation.ts with 100% line coverage and 100% branch coverage, covering:
  - All validation functions (validateCreateTicket, validateUpdateTicket, validateCreateComment, validateSearch)
  - Valid inputs for each function
  - Invalid inputs including missing required fields
  - Edge cases with empty values
- Overall MCP component coverage is now complete with all five MCP components having comprehensive test coverage
- API component coverage is improving with validation.ts now fully covered
- Next focus area:
  - src/config.ts (0% coverage)
  - src/index.ts (0% coverage)
  - Improving coverage for remaining API components

The result will be a robust test suite that gives confidence in the reliability of the package as it moves toward release.
