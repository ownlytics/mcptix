# Logging Cleanup Plan

## Overview

This plan outlines the steps to remove all logging from the MCP server and database components while ensuring the API logging remains intact. This is necessary because MCP cannot have anything logged to the console as it interferes with stdio/stdout communication.

## Files to Remove Completely

1. **`src/mcp/mcp-logger.ts`**

   - MCP-specific logger with functions like mcpLog, mcpSuccess, mcpWarn, mcpError, mcpDebug
   - All console output is redirected to stderr

2. **`src/mcp/debug-logger.ts`**

   - Writes logs to a file
   - Used by both MCP and DB loggers

3. **`src/db/db-logger.ts`**
   - Database-specific logger with functions like dbLog, dbQuery, dbError
   - Redirects output to stderr in MCP mode

## Files to Modify

### 1. `src/mcp/server.ts`

- Remove imports:
  ```typescript
  import { DebugLogger } from './debug-logger';
  import { McpLogger, mcpLog, mcpSuccess, mcpError, mcpWarn } from './mcp-logger';
  ```
- Remove logger initialization and all logging calls
- Remove references to `this.logger`

### 2. `src/mcp/tools.ts`

- Remove imports:
  ```typescript
  import { DebugLogger } from './debug-logger';
  import { mcpLog, mcpWarn, mcpError, mcpDebug } from './mcp-logger';
  ```
- Remove logger initialization and all logging calls

### 3. `src/mcp/resources.ts`

- Remove import:
  ```typescript
  import { DebugLogger } from './debug-logger';
  ```
- Remove logger initialization and all logging calls

### 4. `src/mcp/index.ts`

- Remove import:
  ```typescript
  import { mcpLog, mcpWarn, mcpError, mcpDebug } from './mcp-logger';
  ```
- Remove all mcpLog, mcpWarn, mcpError, mcpDebug calls

### 5. `src/db/service.ts`

- Remove import:
  ```typescript
  import { dbLog } from './db-logger';
  ```
- Remove all dbLog calls
- Keep general Logger imports and calls for now

### 6. `src/db/queries.ts`

- Remove import:
  ```typescript
  import { dbLog, dbQuery, dbError } from './db-logger';
  ```
- Remove all dbLog, dbQuery, dbError calls

## Tests to Update

### 1. `src/mcp/test/debug-logger.test.ts`

- This test should be removed as it tests a file we're removing

### 2. Other test files

- Check and update any tests that might be using these loggers

## Future Considerations

After removing all MCP and DB logging, we will:

1. Create a centralized logger that properly handles MCP mode
2. Re-implement logging where needed, ensuring no interference with stdio/stdout in MCP mode
3. Ensure all components use the centralized logger consistently

## Implementation Steps

1. Remove the three logger files
2. Remove logger imports and calls from all affected files
3. Add comments where appropriate to indicate future logging points
4. Remove or update tests related to the removed loggers
5. Verify that MCP server and database no longer output anything to stdout
