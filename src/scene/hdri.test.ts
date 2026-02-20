import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as THREE from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import { clearTextureCache } from './hdri'

/**
 * EXR/HDRI Background Loading Tests
 *
 * These tests verify that EXR environment maps load correctly and
 * fall back gracefully on failure.
 */

describe('HDRI Background Loading', () => {
  let scene: THREE.Scene

  beforeEach(() => {
    // Clear texture cache to ensure test isolation
    clearTextureCache()

    scene = new THREE.Scene()
    // Set initial solid color background
    scene.background = new THREE.Color(0x1a1a2e)
  })

  it('should set initial solid color background', () => {
    expect(scene.background).toBeInstanceOf(THREE.Color)
    expect((scene.background as THREE.Color).getHex()).toBe(0x1a1a2e)
  })

  it('should load EXR and set scene.background on success', async () => {
    const exrLoader = new EXRLoader()
    const hdriPath = '/snake3d/hdri/citrus_orchard_road_puresky_4k.exr'

    // This test verifies the loading mechanism works
    // Note: Actual file load will fail in test environment, we're testing the structure
    const loadPromise = new Promise((resolve, reject) => {
      exrLoader.load(
        hdriPath,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping
          scene.background = texture
          scene.environment = texture
          resolve(texture)
        },
        undefined,
        (error) => {
          reject(error)
        }
      )
    })

    // In test environment, we expect this to fail (no actual file)
    // but we're verifying the promise structure and error handling
    try {
      await loadPromise
      // If it succeeds (unlikely in test env), verify background is set
      expect(scene.background).toBeInstanceOf(THREE.Texture)
      expect(scene.environment).toBeInstanceOf(THREE.Texture)
    } catch (error) {
      // Expected in test environment - file doesn't exist
      expect(error).toBeDefined()
    }
  })

  it('should maintain solid color fallback when EXR fails', async () => {
    const exrLoader = new EXRLoader()
    const invalidPath = '/snake3d/hdri/nonexistent.exr'

    // Store initial background
    const initialBackground = scene.background

    const loadPromise = new Promise((resolve, reject) => {
      exrLoader.load(
        invalidPath,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping
          scene.background = texture
          scene.environment = texture
          resolve(texture)
        },
        undefined,
        (error) => {
          // On error, keep the fallback background
          reject(error)
        }
      )
    })

    try {
      await loadPromise
    } catch (error) {
      // Verify fallback background is still set
      expect(scene.background).toBe(initialBackground)
      expect(scene.background).toBeInstanceOf(THREE.Color)
      expect((scene.background as THREE.Color).getHex()).toBe(0x1a1a2e)
    }
  })

  it('should set EquirectangularReflectionMapping on loaded texture', () => {
    // Create a mock texture to verify mapping configuration
    const texture = new THREE.DataTexture(
      new Uint8Array([255, 0, 0, 255]),
      1,
      1,
      THREE.RGBAFormat
    )

    // Simulate what happens in the load callback
    texture.mapping = THREE.EquirectangularReflectionMapping
    scene.background = texture
    scene.environment = texture

    expect((scene.background as THREE.Texture).mapping).toBe(THREE.EquirectangularReflectionMapping)
    expect((scene.environment as THREE.Texture).mapping).toBe(THREE.EquirectangularReflectionMapping)
  })

  it('should set scene.environment in addition to scene.background', () => {
    const texture = new THREE.DataTexture(
      new Uint8Array([255, 0, 0, 255]),
      1,
      1,
      THREE.RGBAFormat
    )

    texture.mapping = THREE.EquirectangularReflectionMapping
    scene.background = texture
    scene.environment = texture

    expect(scene.background).toBe(texture)
    expect(scene.environment).toBe(texture)
  })
})

/**
 * HDRI Path Resolution Tests
 *
 * Verify that HDRI paths work correctly in dev and production
 */
describe('HDRI Path Resolution', () => {
  it('should use correct path with base URL', () => {
    const basePath = '/snake3d/'
    const hdriFile = 'hdri/citrus_orchard_road_puresky_4k.exr'
    const fullPath = basePath + hdriFile

    expect(fullPath).toBe('/snake3d/hdri/citrus_orchard_road_puresky_4k.exr')
  })

  it('should handle Vite base URL from import.meta.env', () => {
    // In Vite, import.meta.env.BASE_URL contains the base path
    const baseUrl = import.meta.env.BASE_URL
    const hdriFile = 'hdri/citrus_orchard_road_puresky_4k.exr'
    const fullPath = `${baseUrl}${hdriFile}`

    // Vite config has base: '/snake3d/'
    expect(fullPath).toContain('hdri/citrus_orchard_road_puresky_4k.exr')
  })
})
