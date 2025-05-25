const express = require('express');
const { spawn } = require('child_process');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 10000;

// Check for required environment variables
if (!process.env.BRAVE_API_KEY) {
  console.error('Error: BRAVE_API_KEY environment variable is required');
  process.exit(1);
}

// Middleware
app.use(bodyParser.json());

// Start MCP server with environment variables
const mcpServer = spawn('node', ['./node_modules/@modelcontextprotocol/server-brave-search/dist/index.js'], {
  env: {
    ...process.env,
    BRAVE_API_KEY: process.env.BRAVE_API_KEY
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Main endpoint
app.post('/search', async (req, res) => {
  try {
    const requestData = {
      type: 'request',
      data: {
        ...req.body,
        apiKey: process.env.BRAVE_API_KEY
      }
    };

    mcpServer.stdin.write(JSON.stringify(requestData) + '\n');

    // Handle response from MCP server
    const responseHandler = (data) => {
      try {
        const response = JSON.parse(data.toString());
        res.json(response);
        mcpServer.stdout.removeListener('data', responseHandler);
      } catch (error) {
        console.error('Error parsing MCP response:', error);
      }
    };

    mcpServer.stdout.on('data', responseHandler);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling
mcpServer.stderr.on('data', (data) => {
  console.error('MCP Server Error:', data.toString());
});

mcpServer.on('error', (error) => {
  console.error('MCP Server Process Error:', error);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
}); 