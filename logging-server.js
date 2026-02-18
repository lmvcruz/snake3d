/**
 * Simple Node.js logging server for Snake3D frontend
 * 
 * Receives log entries from the frontend and appends them to a log file.
 * Run this server with: node logging-server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = 3001;
const LOG_DIR = path.join(require('os').homedir(), '.snake3d');
const LOG_FILE = path.join(LOG_DIR, 'frontend.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // Set CORS headers to allow requests from frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle POST requests to /logs endpoint
  if (req.method === 'POST' && req.url === '/logs') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const logEntries = JSON.parse(body);
        
        // Format and append log entries to file
        const formattedLogs = logEntries
          .map(entry => `[${entry.timestamp}] ${entry.level}: ${entry.message}` + 
                       (entry.context ? ` ${JSON.stringify(entry.context)}` : ''))
          .join('\n') + '\n';

        fs.appendFileSync(LOG_FILE, formattedLogs);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: logEntries.length }));
      } catch (error) {
        console.error('Error processing logs:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Snake3D logging server running on http://localhost:${PORT}`);
  console.log(`Logging to: ${LOG_FILE}`);
  console.log('\nTo enable logging from the frontend, add this to your game initialization:');
  console.log(`  import { logger } from './utils/logger'`);
  console.log(`  logger.setApiEndpoint('http://localhost:${PORT}/logs')`);
});
