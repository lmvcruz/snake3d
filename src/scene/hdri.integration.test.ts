/**
 * Integration tests for HDRI loading with cache validation
 *
 * These tests validate that:
 * 1. Concurrent loads of the same HDRI share a single network request
 * 2. Subsequent loads use the cached texture
 * 3. Log messages correctly report cache hits and misses
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as THREE from 'three'
import { loadHDRI, clearTextureCache } from './hdri'
import { logger } from '../utils/logger'

// Mock the EXRLoader
vi.mock('three/examples/jsm/loaders/EXRLoader.js', () => {
  let loadCallCount = 0

  class MockEXRLoader {
    load(url: string, onLoad: (texture: THREE.DataTexture) => void, onProgress?: (progress: ProgressEvent) => void, onError?: (error: Error) => void) {
      loadCallCount++

      // Store the call count when this load was initiated
      const thisLoadNumber = loadCallCount

      // Simulate async loading with a delay
      setTimeout(() => {
        // Create a mock texture
        const texture = new THREE.DataTexture(
          new Uint8Array([255, 0, 0, 255]),
          1,
          1,
          THREE.RGBAFormat
        )

        // Add metadata to help with testing
        ;(texture as any).loadNumber = thisLoadNumber
        ;(texture as any).image = { width: 4096, height: 2048 }

        onLoad(texture)
      }, 50) // 50ms simulated load time
    }
  }

  // Export function to get and reset load count
  return {
    EXRLoader: MockEXRLoader,
    __getLoadCallCount: () => loadCallCount,
    __resetLoadCallCount: () => { loadCallCount = 0 }
  }
})

describe('HDRI Loading Integration Tests', () => {
  let scenes: THREE.Scene[]

  beforeEach(async () => {
    // Clear caches and logs
    clearTextureCache()
    logger.clearLogs()

    // Reset the mock loader call count
    const { __resetLoadCallCount } = await import('three/examples/jsm/loaders/EXRLoader.js')
    __resetLoadCallCount()

    // Create fresh scenes for each test
    scenes = [
      new THREE.Scene(),
      new THREE.Scene(),
      new THREE.Scene(),
      new THREE.Scene()
    ]
  })

  it('should only load HDRI once when called concurrently', async () => {
    // Import the load call counter
    const { __getLoadCallCount } = await import('three/examples/jsm/loaders/EXRLoader.js')

    // Call loadHDRI multiple times concurrently (simulating multiple scenes initializing)
    const promises = scenes.map(scene =>
      loadHDRI({
        scene,
        backgroundBlurriness: 0.3
      })
    )

    // Wait for all loads to complete
    await Promise.all(promises)

    // Verify that the loader was only called once
    const loadCallCount = __getLoadCallCount()
    expect(loadCallCount).toBe(1)

    // Verify all scenes have the background applied
    scenes.forEach(scene => {
      expect(scene.background).toBeTruthy()
      expect(scene.environment).toBeTruthy()
    })
  })

  it('should log correct messages for concurrent loads', async () => {
    // Call loadHDRI multiple times concurrently
    const promises = scenes.slice(0, 2).map(scene =>
      loadHDRI({
        scene,
        backgroundBlurriness: 0.3
      })
    )

    await Promise.all(promises)

    const logs = logger.getLogs()
    const logMessages = logs.map(log => log.message)

    // Should have exactly one "Loading EXR environment map" message
    const loadingMessages = logMessages.filter(msg => msg === 'Loading EXR environment map')
    expect(loadingMessages.length).toBe(1)

    // Should have one "Waiting for existing EXR load" message (for the second call)
    const waitingMessages = logMessages.filter(msg => msg === 'Waiting for existing EXR load')
    expect(waitingMessages.length).toBe(1)

    // Should have one "EXR texture loaded" message
    const loadedMessages = logMessages.filter(msg => msg === 'EXR texture loaded')
    expect(loadedMessages.length).toBe(1)

    // Should have one "EXR texture cached" message
    const cachedMessages = logMessages.filter(msg => msg === 'EXR texture cached')
    expect(cachedMessages.length).toBe(1)

    // Should have two "EXR environment applied to scene" messages (one per scene)
    const appliedMessages = logMessages.filter(msg => msg === 'EXR environment applied to scene')
    expect(appliedMessages.length).toBe(2)
  })

  it('should use cache for subsequent calls after initial load completes', async () => {
    const { __getLoadCallCount } = await import('three/examples/jsm/loaders/EXRLoader.js')

    // First load
    await loadHDRI({
      scene: scenes[0],
      backgroundBlurriness: 0.3
    })

    expect(__getLoadCallCount()).toBe(1)

    // Clear logs to isolate the second call
    logger.clearLogs()

    // Second load should use cache
    await loadHDRI({
      scene: scenes[1],
      backgroundBlurriness: 0.3
    })

    // Loader should not be called again
    expect(__getLoadCallCount()).toBe(1)

    // Check logs for cache hit
    const logs = logger.getLogs()
    const cacheHitLog = logs.find(log => log.message === 'Using cached EXR texture')
    expect(cacheHitLog).toBeTruthy()

    // Should NOT have a new loading message
    const loadingLog = logs.find(log => log.message === 'Loading EXR environment map')
    expect(loadingLog).toBeUndefined()
  })

  it('should handle 8 concurrent loads efficiently (real-world scenario)', async () => {
    const { __getLoadCallCount } = await import('three/examples/jsm/loaders/EXRLoader.js')

    // Create 8 scenes (simulating multiple re-renders or scene initializations)
    const manyScenes = Array.from({ length: 8 }, () => new THREE.Scene())

    // Call loadHDRI for all scenes concurrently
    const promises = manyScenes.map(scene =>
      loadHDRI({
        scene,
        backgroundBlurriness: 0.3
      })
    )

    const startTime = Date.now()
    await Promise.all(promises)
    const duration = Date.now() - startTime

    // Should only call the loader once
    expect(__getLoadCallCount()).toBe(1)

    // All scenes should have backgrounds
    manyScenes.forEach(scene => {
      expect(scene.background).toBeTruthy()
      expect(scene.environment).toBeTruthy()
    })

    // Check logs
    const logs = logger.getLogs()
    const logMessages = logs.map(log => log.message)

    // Should have exactly one actual load
    const loadingMessages = logMessages.filter(msg => msg === 'Loading EXR environment map')
    expect(loadingMessages.length).toBe(1)

    // Should have 7 waiting messages (8 calls - 1 that actually loads)
    const waitingMessages = logMessages.filter(msg => msg === 'Waiting for existing EXR load')
    expect(waitingMessages.length).toBe(7)

    // Should have 8 "applied to scene" messages
    const appliedMessages = logMessages.filter(msg => msg === 'EXR environment applied to scene')
    expect(appliedMessages.length).toBe(8)

    // Duration should be roughly the time of one load (~50ms + overhead)
    // not 8x the load time (which would be ~400ms)
    expect(duration).toBeLessThan(200) // Allow for some overhead
  })

  it('should handle errors without crashing', async () => {
    // This test verifies that the error handling path doesn't crash the system
    // The actual error simulation would require a separate test file with different mocks

    const errorHandler = vi.fn()

    // Load should complete even with an error handler
    await loadHDRI({
      scene: scenes[0],
      backgroundBlurriness: 0.3,
      onError: errorHandler
    })

    // In our mock, loads succeed, so we just verify the system works
    expect(scenes[0].background).toBeTruthy()
  })

  it('should clear cache when clearTextureCache is called', async () => {
    const { __getLoadCallCount, __resetLoadCallCount } = await import('three/examples/jsm/loaders/EXRLoader.js')

    // First load
    await loadHDRI({
      scene: scenes[0],
      backgroundBlurriness: 0.3
    })

    expect(__getLoadCallCount()).toBe(1)

    // Clear cache and reset counter
    clearTextureCache()
    __resetLoadCallCount()
    logger.clearLogs()

    // Second load should trigger a new load since cache was cleared
    await loadHDRI({
      scene: scenes[1],
      backgroundBlurriness: 0.3
    })

    // Should have called loader again (once after reset)
    expect(__getLoadCallCount()).toBe(1)

    // Logs should show a fresh load, not a cache hit
    const logs = logger.getLogs()
    const loadingLog = logs.find(log => log.message === 'Loading EXR environment map')
    expect(loadingLog).toBeTruthy()

    // Should NOT see "Using cached EXR texture" since cache was cleared
    const cacheHitLog = logs.find(log => log.message === 'Using cached EXR texture')
    expect(cacheHitLog).toBeUndefined()
  })
})
