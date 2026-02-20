/**
 * Logger utility for the Snake3D application
 *
 * Note: Browser-based applications cannot directly write to the file system
 * due to security restrictions. This logger provides:
 * - Console output for development
 * - In-memory storage of logs
 * - API endpoint support for sending logs to a backend service
 */

export enum LogLevel {
  TRACE = 'TRACE',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogsInMemory = 1000
  private logToConsole = true
  private apiEndpoint: string | null = null

  /**
   * Set the API endpoint for remote logging
   * Backend service should accept POST requests with LogEntry[]
   */
  setApiEndpoint(endpoint: string) {
    this.apiEndpoint = endpoint
  }

  /**
   * Enable or disable console logging
   */
  setConsoleLogging(enabled: boolean) {
    this.logToConsole = enabled
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    }

    // Store in memory
    this.logs.push(entry)
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs.shift() // Remove oldest log
    }

    // Console output
    if (this.logToConsole) {
      const logFn = level === LogLevel.ERROR ? console.error :
                    level === LogLevel.WARN ? console.warn :
                    console.log

      logFn(`[${entry.timestamp}] ${level}: ${message}`, context || '')
    }

    // Send to API if configured
    if (this.apiEndpoint) {
      this.sendToApi([entry]).catch(err => {
        console.error('Failed to send log to API:', err)
      })
    }
  }

  trace(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.TRACE, message, context)
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.WARN, message, context)
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.ERROR, message, context)
  }

  /**
   * Get all logs from memory
   */
  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  /**
   * Clear all logs from memory
   */
  clearLogs() {
    this.logs = []
  }

  /**
   * Export logs as JSON string
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * Download logs as a file (browser download)
   */
  downloadLogs(filename = 'snake3d-logs.json') {
    const blob = new Blob([this.exportLogs()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Send logs to backend API
   */
  private async sendToApi(entries: LogEntry[]): Promise<void> {
    if (!this.apiEndpoint) return

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entries),
      })

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`)
      }
    } catch (error) {
      // Don't use this.error to avoid infinite loop
      console.error('Logger API error:', error)
    }
  }

  /**
   * Flush all in-memory logs to the API
   */
  async flushToApi(): Promise<void> {
    if (!this.apiEndpoint || this.logs.length === 0) return

    const logsToSend = [...this.logs]
    await this.sendToApi(logsToSend)
  }
}

// Singleton instance
export const logger = new Logger()

// For testing purposes
export { Logger }
