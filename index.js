#!/usr/bin/env node

const http = require('http');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 3000;

console.log(`Starting server on port ${PORT}`);

// Start the MCP server as a child process
const mcpServer = spawn('node', ['./node_modules/@modelcontextprotocol/server-brave-search/dist/index.js']);

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
    return;
  }

  // Forward other requests to MCP server
  mcpServer.stdin.write(JSON.stringify({
    type: 'request',
    data: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body
    }
  }) + '\n');
});

// Handle MCP server output
mcpServer.stdout.on('data', (data) => {
  console.log(`MCP Server: ${data}`);
});

mcpServer.stderr.on('data', (data) => {
  console.error(`MCP Server Error: ${data}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`HTTP Server running on port ${PORT}`);
}); 