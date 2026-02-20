import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as THREE from 'three'
import { createConfigSnake, type ConfigSnakeConfig } from './configSnake'
import { logger } from '../utils/logger'

describe('configSnake', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createConfigSnake', () => {
    it('should create snake with head and 4 body segments', () => {
      const result = createConfigSnake()

      expect(result.head).toBeInstanceOf(THREE.Mesh)
      expect(result.bodySegments).toHaveLength(4)
      result.bodySegments.forEach(segment => {
        expect(segment).toBeInstanceOf(THREE.Mesh)
      })
    })

    it('should use CapsuleGeometry for head', () => {
      const result = createConfigSnake()

      expect(result.head.geometry).toBeInstanceOf(THREE.CapsuleGeometry)
    })

    it('should use SphereGeometry for body segments', () => {
      const result = createConfigSnake()

      result.bodySegments.forEach(segment => {
        expect(segment.geometry).toBeInstanceOf(THREE.SphereGeometry)
      })
    })

    it('should position head at origin by default', () => {
      const result = createConfigSnake()

      expect(result.head.position.x).toBe(0)
      expect(result.head.position.y).toBeCloseTo(0.5)
      expect(result.head.position.z).toBe(0)
    })

    it('should position body segments behind head with proper spacing', () => {
      const config: ConfigSnakeConfig = {
        headPosition: { x: 0, y: 0.5, z: 0 },
        segmentSpacing: 1.0,
      }
      const result = createConfigSnake(config)

      // Body segments should be positioned with spacing along -Z axis
      expect(result.bodySegments[0].position.z).toBeCloseTo(-1.0)
      expect(result.bodySegments[1].position.z).toBeCloseTo(-2.0)
      expect(result.bodySegments[2].position.z).toBeCloseTo(-3.0)
      expect(result.bodySegments[3].position.z).toBeCloseTo(-4.0)
    })

    it('should apply custom segment spacing', () => {
      const config: ConfigSnakeConfig = {
        segmentSpacing: 1.5,
      }
      const result = createConfigSnake(config)

      expect(result.bodySegments[0].position.z).toBeCloseTo(-1.5)
      expect(result.bodySegments[1].position.z).toBeCloseTo(-3.0)
      expect(result.bodySegments[2].position.z).toBeCloseTo(-4.5)
      expect(result.bodySegments[3].position.z).toBeCloseTo(-6.0)
    })

    it('should create head with custom color', () => {
      const config: ConfigSnakeConfig = {
        headColor: '#00ff00',
      }
      const result = createConfigSnake(config)

      const material = result.head.material as THREE.MeshStandardMaterial
      expect(material.color.getHexString()).toBe('00ff00')
    })

    it('should create body segments with custom color', () => {
      const config: ConfigSnakeConfig = {
        bodyColor: '#0000ff',
      }
      const result = createConfigSnake(config)

      result.bodySegments.forEach(segment => {
        const material = segment.material as THREE.MeshStandardMaterial
        expect(material.color.getHexString()).toBe('0000ff')
      })
    })

    it('should apply emissive properties to head', () => {
      const config: ConfigSnakeConfig = {
        headEmissive: '#ff0000',
        headEmissiveIntensity: 0.5,
      }
      const result = createConfigSnake(config)

      const material = result.head.material as THREE.MeshStandardMaterial
      expect(material.emissive.getHexString()).toBe('ff0000')
      expect(material.emissiveIntensity).toBe(0.5)
    })

    it('should apply emissive properties to body segments', () => {
      const config: ConfigSnakeConfig = {
        bodyEmissive: '#00ff00',
        bodyEmissiveIntensity: 0.3,
      }
      const result = createConfigSnake(config)

      result.bodySegments.forEach(segment => {
        const material = segment.material as THREE.MeshStandardMaterial
        expect(material.emissive.getHexString()).toBe('00ff00')
        expect(material.emissiveIntensity).toBe(0.3)
      })
    })

    it('should enable shadows on all meshes', () => {
      const result = createConfigSnake()

      expect(result.head.castShadow).toBe(true)
      expect(result.head.receiveShadow).toBe(true)

      result.bodySegments.forEach(segment => {
        expect(segment.castShadow).toBe(true)
        expect(segment.receiveShadow).toBe(true)
      })
    })

    it('should log creation with TRACE level', () => {
      const traceSpy = vi.spyOn(logger, 'trace')

      createConfigSnake()

      expect(traceSpy).toHaveBeenCalledWith(
        expect.stringContaining('Creating config snake'),
        expect.any(Object)
      )
    })

    it('should log each segment position with TRACE level', () => {
      const traceSpy = vi.spyOn(logger, 'trace')

      createConfigSnake()

      // Should log head + 4 body segments = 5 position logs + 1 creation log
      expect(traceSpy).toHaveBeenCalledTimes(6)
    })

    it('should position all segments at same Y height', () => {
      const result = createConfigSnake()

      const expectedY = 0.5
      expect(result.head.position.y).toBeCloseTo(expectedY)
      result.bodySegments.forEach(segment => {
        expect(segment.position.y).toBeCloseTo(expectedY)
      })
    })

    it('should use default config from sceneConfig', () => {
      // This tests integration with sceneConfig.ts defaults
      const result = createConfigSnake()

      const headMaterial = result.head.material as THREE.MeshStandardMaterial
      const bodyMaterial = result.bodySegments[0].material as THREE.MeshStandardMaterial

      // Should match defaults from sceneConfig.ts
      expect(headMaterial.color.getHexString()).toBe('3a9f3a')
      expect(bodyMaterial.color.getHexString()).toBe('2d7a2d')
    })
  })
})
