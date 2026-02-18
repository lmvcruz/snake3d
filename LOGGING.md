# Logging Setup

This document explains how to use the logging system in the Snake3D project.

## Overview

The logging system consists of two parts:
1. **Frontend Logger** (`src/utils/logger.ts`) - Collects logs in the browser
2. **Backend Server** (`logging-server.js`) - Receives logs and writes them to a file

## Frontend Logger Usage

```typescript
import { logger } from './utils/logger'

// Basic logging
logger.debug('Debug message', { data: 'optional context' })
logger.info('Info message')
logger.warn('Warning message')
logger.error('Error message')

// Get all logs
const logs = logger.getLogs()

// Export logs as JSON string
const json = logger.exportLogs()

// Download logs as a file (browser download)
logger.downloadLogs('my-logs.json')

// Clear logs from memory
logger.clearLogs()
```

## Logging to File (Backend Required)

Since browser applications cannot directly write to the file system, we provide a simple Node.js backend service.

### Step 1: Start the Logging Server

```bash
node logging-server.js
```

This will:
- Start an HTTP server on `http://localhost:3001`
- Create the log directory at `C:\Users\l-cruz\.snake3d\`
- Write logs to `C:\Users\l-cruz\.snake3d\frontend.log`

### Step 2: Configure Frontend to Use the Server

In your game initialization code:

```typescript
import { logger } from './utils/logger'

// Enable logging to the backend server
logger.setApiEndpoint('http://localhost:3001/logs')
```

Now all logs will automatically be sent to the backend and written to the file.

## Console Logging

By default, the logger outputs to the browser console. You can disable this:

```typescript
logger.setConsoleLogging(false)
```

## Log Levels

- `DEBUG` - Detailed information for debugging
- `INFO` - General informational messages
- `WARN` - Warning messages
- `ERROR` - Error messages

## Log Structure

Each log entry contains:
```typescript
{
  timestamp: string,      // ISO 8601 format
  level: LogLevel,        // DEBUG | INFO | WARN | ERROR
  message: string,        // Log message
  context?: object        // Optional context data
}
```

## Memory Management

The logger keeps a maximum of 1000 log entries in memory. When this limit is reached, the oldest entries are automatically removed.

## Testing

Tests for the logger are in `src/utils/logger.test.ts`. Run them with:

```bash
npm test
```

## Production Considerations

For production use, consider:
1. Setting up a proper logging service (e.g., Sentry, LogRocket)
2. Implementing log sampling to reduce volume
3. Adding authentication to the logging endpoint
4. Using environment variables for configuration
