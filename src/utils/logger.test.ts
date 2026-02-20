import { describe, it, expect, beforeEach } from 'vitest'
import { Logger, LogLevel, logger } from './logger'

describe('Logger', () => {
  let testLogger: Logger

  beforeEach(() => {
    testLogger = new Logger()
    testLogger.clearLogs()
  })

  it('should create log entries with correct structure', () => {
    testLogger.info('Test message', { key: 'value' })

    const logs = testLogger.getLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0]).toMatchObject({
      level: LogLevel.INFO,
      message: 'Test message',
      context: { key: 'value' },
    })
    expect(logs[0].timestamp).toBeDefined()
  })

  it('should log different levels correctly', () => {
    testLogger.trace('Trace message')
    testLogger.debug('Debug message')
    testLogger.info('Info message')
    testLogger.warn('Warning message')
    testLogger.error('Error message')

    const logs = testLogger.getLogs()
    expect(logs).toHaveLength(5)
    expect(logs[0].level).toBe(LogLevel.TRACE)
    expect(logs[1].level).toBe(LogLevel.DEBUG)
    expect(logs[2].level).toBe(LogLevel.INFO)
    expect(logs[3].level).toBe(LogLevel.WARN)
    expect(logs[4].level).toBe(LogLevel.ERROR)
  })

  it('should maintain max logs in memory', () => {
    // Create more than maxLogsInMemory logs
    for (let i = 0; i < 1100; i++) {
      testLogger.info(`Message ${i}`)
    }

    const logs = testLogger.getLogs()
    expect(logs.length).toBeLessThanOrEqual(1000)
    // Should have the most recent logs
    expect(logs[logs.length - 1].message).toBe('Message 1099')
  })

  it('should clear logs', () => {
    testLogger.info('Message 1')
    testLogger.info('Message 2')
    expect(testLogger.getLogs()).toHaveLength(2)

    testLogger.clearLogs()
    expect(testLogger.getLogs()).toHaveLength(0)
  })

  it('should export logs as JSON', () => {
    testLogger.info('Test message')
    const exported = testLogger.exportLogs()

    expect(exported).toBeTruthy()
    const parsed = JSON.parse(exported)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed[0].message).toBe('Test message')
  })

  it('should set API endpoint', () => {
    testLogger.setApiEndpoint('https://api.example.com/logs')
    // No error should be thrown
    expect(true).toBe(true)
  })

  it('should toggle console logging', () => {
    testLogger.setConsoleLogging(false)
    testLogger.setConsoleLogging(true)
    // No error should be thrown
    expect(true).toBe(true)
  })

  it('should provide singleton instance', () => {
    logger.info('Test from singleton')
    expect(logger.getLogs().length).toBeGreaterThan(0)
  })
})
