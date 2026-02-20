import * as THREE from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import { logger } from '../utils/logger'

/**
 * HDRI Environment Map Loader
 *
 * Loads EXR/HDRI textures for realistic lighting and backgrounds.
 * Falls back gracefully to solid color on failure.
 */

// Texture cache to avoid loading the same HDRI multiple times
const textureCache = new Map<string, THREE.Texture>()

// Track in-progress loads to prevent concurrent requests for the same resource
const loadingPromises = new Map<string, Promise<THREE.Texture | null>>()

export interface HDRILoadOptions {
  scene: THREE.Scene
  backgroundBlurriness?: number
  onSuccess?: (texture: THREE.Texture) => void
  onError?: (error: Error) => void
}

/**
 * Load HDRI environment map and apply to scene
 *
 * @param options - HDRI loading configuration
 * @returns Promise that resolves when loading completes (success or error)
 */
export function loadHDRI(options: HDRILoadOptions): Promise<void> {
  const { scene, backgroundBlurriness = 0.3, onSuccess, onError } = options

  return new Promise((resolve) => {
    const baseUrl = import.meta.env.BASE_URL || '/'
    const hdriPath = `${baseUrl}hdri/citrus_orchard_road_puresky_4k.exr`

    // Check cache first
    const cachedTexture = textureCache.get(hdriPath)
    if (cachedTexture) {
      logger.info('Using cached EXR texture', {
        hdriPath,
        backgroundBlurriness
      })

      // Apply cached texture to scene
      scene.background = cachedTexture
      scene.environment = cachedTexture

      if (backgroundBlurriness !== undefined && scene.backgroundBlurriness !== undefined) {
        scene.backgroundBlurriness = backgroundBlurriness
      }

      if (onSuccess) {
        onSuccess(cachedTexture)
      }

      resolve()
      return
    }

    // Check if already loading - wait for existing load to complete
    const existingLoad = loadingPromises.get(hdriPath)
    if (existingLoad) {
      logger.info('Waiting for existing EXR load', { hdriPath })
      existingLoad.then((texture) => {
        if (texture) {
          // Apply the loaded texture to this scene
          scene.background = texture
          scene.environment = texture

          if (backgroundBlurriness !== undefined && scene.backgroundBlurriness !== undefined) {
            scene.backgroundBlurriness = backgroundBlurriness
          }

          logger.info('EXR environment applied to scene', {
            loadTimeMs: 'cached',
            backgroundBlurriness
          })

          if (onSuccess) {
            onSuccess(texture)
          }
        }
        resolve()
      }).catch(() => {
        // Load failed, but we already logged it
        resolve()
      })
      return
    }

    logger.info('Loading EXR environment map', {
      backgroundBlurriness,
      baseUrl,
      hdriPath,
      env: import.meta.env.MODE || 'unknown'
    })

    const exrLoader = new EXRLoader()

    logger.debug('EXR path resolved', {
      hdriPath,
      absolutePath: hdriPath.startsWith('http') ? hdriPath : `${window.location.origin}${hdriPath}`,
      isAbsolute: hdriPath.startsWith('http') || hdriPath.startsWith('/')
    })

    const startTime = performance.now()

    // Store the loading promise to prevent concurrent loads
    const loadingPromise = new Promise<THREE.Texture | null>((resolveLoad) => {
      exrLoader.load(
        hdriPath,
        (texture) => {
          const loadTime = performance.now() - startTime

          logger.trace('EXR texture loaded', {
            loadTimeMs: loadTime.toFixed(2),
            width: texture.image?.width,
            height: texture.image?.height,
            format: texture.format,
            type: texture.type
          })

          // Configure texture mapping
          texture.mapping = THREE.EquirectangularReflectionMapping

          // Cache the texture for reuse
          textureCache.set(hdriPath, texture)
          logger.debug('EXR texture cached', { hdriPath })

          // Remove from loading promises
          loadingPromises.delete(hdriPath)

          // Apply to scene
          scene.background = texture
          scene.environment = texture

          if (backgroundBlurriness !== undefined && scene.backgroundBlurriness !== undefined) {
            scene.backgroundBlurriness = backgroundBlurriness
          }

          logger.info('EXR environment applied to scene', {
            loadTimeMs: loadTime.toFixed(2),
            backgroundBlurriness
          })

          if (onSuccess) {
            onSuccess(texture)
          }

          resolveLoad(texture)
          resolve()
        },
        (progress) => {
          if (progress.lengthComputable) {
            const percentComplete = (progress.loaded / progress.total) * 100
            logger.trace('EXR loading progress', {
              loaded: progress.loaded,
              total: progress.total,
              percent: percentComplete.toFixed(1)
            })
          }
        },
        (error: unknown) => {
          const loadTime = performance.now() - startTime

          const errorMessage = error instanceof Error ? error.message : String(error)
          const errorStack = error instanceof Error ? error.stack : undefined

          logger.error('EXR failed to load, keeping fallback background', {
            error: errorMessage,
            errorType: error?.constructor?.name || typeof error,
            errorStack: errorStack ? errorStack.substring(0, 200) : undefined,
            loadTimeMs: loadTime.toFixed(2),
            hdriPath,
            baseUrl: import.meta.env.BASE_URL || '/',
            environment: import.meta.env.MODE || 'unknown',
            fallbackBackground: scene.background ? 'solid color' : 'none'
          })

          // Remove from loading promises
          loadingPromises.delete(hdriPath)

          if (onError) {
            onError(error instanceof Error ? error : new Error(String(error)))
          }

          resolveLoad(null)
          // Don't reject - we want to continue without HDRI
          resolve()
        }
      )
    })

    loadingPromises.set(hdriPath, loadingPromise)
  })
}

/**
 * Set solid color background as fallback
 */
export function setSolidColorBackground(scene: THREE.Scene, color: number = 0x1a1a2e): void {
  logger.debug('Setting solid color background', {
    color: `0x${color.toString(16).padStart(6, '0')}`
  })

  scene.background = new THREE.Color(color)
}

/**
 * Clear texture cache (useful for testing and memory management)
 */
export function clearTextureCache(): void {
  const cacheSize = textureCache.size
  textureCache.forEach(texture => {
    texture.dispose()
  })
  textureCache.clear()
  loadingPromises.clear()
  logger.debug('Texture cache cleared', { texturesDisposed: cacheSize })
}
