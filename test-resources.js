const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Path to the MCP server
const serverPath = path.join(__dirname, 'dist', 'mcp', 'index.js');

// Start the MCP server
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', process.stderr]
});

// Wait for the server to start
setTimeout(() => {
  console.log('Sending requests to MCP server...');

  // Test listing tools
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  };
  
  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

  // Test listing resources
  const listResourcesRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'resources/list',
    params: {}
  };
  
  setTimeout(() => {
    server.stdin.write(JSON.stringify(listResourcesRequest) + '\n');
  }, 500);

  // Test listing resource templates
  const listResourceTemplatesRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'resources/templates/list',
    params: {}
  };
  
  setTimeout(() => {
    server.stdin.write(JSON.stringify(listResourceTemplatesRequest) + '\n');
  }, 1000);

  // Test reading a resource (all tickets)
  const readAllResourceRequest = {
    jsonrpc: '2.0',
    id: 4,
    method: 'resources/read',
    params: {
      uri: 'tickets://all'
    }
  };
  setTimeout(() => {
    server.stdin.write(JSON.stringify(readAllResourceRequest) + '\n');
  }, 1500);

  // Test reading a resource (tickets by status)
  const readStatusResourceRequest = {
    jsonrpc: '2.0',
    id: 5,
    method: 'resources/read',
    params: {
      uri: 'tickets://status/backlog'
    }
  };
  
  setTimeout(() => {
    server.stdin.write(JSON.stringify(readStatusResourceRequest) + '\n');
  }, 2000);

  // Test reading a resource (ticket by ID)
  const readIdResourceRequest = {
    jsonrpc: '2.0',
    id: 6,
    method: 'resources/read',
    params: {
      uri: 'tickets://id/ticket-1743576826231'
    }
  };
  
  setTimeout(() => {
    server.stdin.write(JSON.stringify(readIdResourceRequest) + '\n');
  }, 2500);

  // Process server output
  let responseCount = 0;
  server.stdout.on('data', (data) => {
    const responses = data.toString().trim().split('\n');
    
    for (const response of responses) {
      try {
        const parsedResponse = JSON.parse(response);
        console.log('Received response:', JSON.stringify(parsedResponse, null, 2));
        
        responseCount++;
        
        // If we've received all responses, exit
        if (responseCount === 6) {
          console.log('Test complete, shutting down...');
          server.kill();
          process.exit(0);
        }
      } catch (error) {
        console.error('Error parsing response:', error);
      }
    }
  });

}, 1000);

// Handle server exit
server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  server.kill();
  process.exit(0);
});