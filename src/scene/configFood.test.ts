import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as THREE from 'three'
import { createConfigFood, type ConfigFoodConfig } from './configFood'
import { logger } from '../utils/logger'

describe('configFood', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createConfigFood', () => {
    it('should create food mesh', () => {
      const result = createConfigFood()

      expect(result).toBeInstanceOf(THREE.Mesh)
    })

    it('should use SphereGeometry', () => {
      const result = createConfigFood()

      expect(result.geometry).toBeInstanceOf(THREE.SphereGeometry)
    })

    it('should position at origin by default', () => {
      const result = createConfigFood()

      expect(result.position.x).toBe(0)
      expect(result.position.y).toBeCloseTo(0.5)
      expect(result.position.z).toBe(5) // Default position away from snake
    })

    it('should position at custom location', () => {
      const config: ConfigFoodConfig = {
        position: { x: 3, y: 1, z: 7 },
      }
      const result = createConfigFood(config)

      expect(result.position.x).toBe(3)
      expect(result.position.y).toBe(1)
      expect(result.position.z).toBe(7)
    })

    it('should apply custom color', () => {
      const config: ConfigFoodConfig = {
        color: '#00ff00',
      }
      const result = createConfigFood(config)

      const material = result.material as THREE.MeshStandardMaterial
      expect(material.color.getHexString()).toBe('00ff00')
    })

    it('should apply emissive properties', () => {
      const config: ConfigFoodConfig = {
        emissive: '#ff0000',
        emissiveIntensity: 0.7,
      }
      const result = createConfigFood(config)

      const material = result.material as THREE.MeshStandardMaterial
      expect(material.emissive.getHexString()).toBe('ff0000')
      expect(material.emissiveIntensity).toBe(0.7)
    })

    it('should apply custom scale', () => {
      const config: ConfigFoodConfig = {
        scale: 1.5,
      }
      const result = createConfigFood(config)

      expect(result.scale.x).toBe(1.5)
      expect(result.scale.y).toBe(1.5)
      expect(result.scale.z).toBe(1.5)
    })

    it('should enable shadows', () => {
      const result = createConfigFood()

      expect(result.castShadow).toBe(true)
      expect(result.receiveShadow).toBe(true)
    })

    it('should log creation with TRACE level', () => {
      const traceSpy = vi.spyOn(logger, 'trace')

      createConfigFood()

      expect(traceSpy).toHaveBeenCalledWith(
        expect.stringContaining('Creating config food'),
        expect.objectContaining({
          position: expect.any(Object),
        })
      )
    })

    it('should use default config from sceneConfig', () => {
      const result = createConfigFood()

      const material = result.material as THREE.MeshStandardMaterial

      // Should match defaults from sceneConfig.ts
      expect(material.color.getHexString()).toBe('ff4444')
      expect(material.emissive.getHexString()).toBe('ff0000')
      expect(material.emissiveIntensity).toBe(0.5)
    })

    it('should create sphere with correct radius', () => {
      const result = createConfigFood()
      const geometry = result.geometry as THREE.SphereGeometry

      // Default food sphere should have radius of 0.3
      expect(geometry.parameters.radius).toBeCloseTo(0.3)
    })

    it('should scale uniformly', () => {
      const config: ConfigFoodConfig = {
        scale: 2.0,
      }
      const result = createConfigFood(config)

      expect(result.scale.x).toBe(result.scale.y)
      expect(result.scale.y).toBe(result.scale.z)
    })
  })
})
