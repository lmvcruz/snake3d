import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as THREE from 'three'
import { createDecorativeElements } from './decorations'
import { DecorationConfig } from '../utils/sceneConfig'
import { logger } from '../utils/logger'

describe('decorations', () => {
  beforeEach(() => {
    // Clear logs before each test
    vi.clearAllMocks()
  })

  describe('createDecorativeElements', () => {
    describe('basic functionality', () => {
      it('should create decorations with default quantity of 50', () => {
        const result = createDecorativeElements()

        expect(result.meshes).toHaveLength(50)
        expect(result.materials).toHaveLength(50)
        expect(result.decorations).toHaveLength(50)
      })

      it('should create decorations with specified quantity', () => {
        const result = createDecorativeElements(10)

        expect(result.meshes).toHaveLength(10)
        expect(result.materials).toHaveLength(10)
        expect(result.decorations).toHaveLength(10)
      })

      it('should create meshes with proper Three.js types', () => {
        const result = createDecorativeElements(5)

        result.meshes.forEach(mesh => {
          expect(mesh).toBeInstanceOf(THREE.Mesh)
          expect(mesh.geometry).toBeInstanceOf(THREE.BufferGeometry)
          expect(mesh.material).toBeInstanceOf(THREE.MeshStandardMaterial)
        })
      })

      it('should enable shadows on all meshes', () => {
        const result = createDecorativeElements(5)

        result.meshes.forEach(mesh => {
          expect(mesh.castShadow).toBe(true)
          expect(mesh.receiveShadow).toBe(true)
        })
      })
    })

    describe('deterministic recreation', () => {
      it('should recreate exact decorations from config', () => {
        const existingConfigs: DecorationConfig[] = [
          {
            id: 'test-1',
            geometryType: 'box',
            position: { x: 5, y: 0.5, z: 10 },
            rotation: { x: 0.1, y: 0.2, z: 0.3 },
            scale: { x: 1, y: 1.5, z: 1 },
            color: '#ff0000',
            emissiveIntensity: 0.5,
            roughness: 0.8,
            metalness: 0.2,
          },
          {
            id: 'test-2',
            geometryType: 'sphere',
            position: { x: -5, y: 0.3, z: -10 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 0.8, y: 0.8, z: 0.8 },
            color: '#00ff00',
            emissiveIntensity: 0.1,
            roughness: 0.9,
            metalness: 0.05,
          },
        ]

        const result = createDecorativeElements(2, existingConfigs)

        expect(result.decorations).toEqual(existingConfigs)

        // Verify mesh positions match
        expect(result.meshes[0].position.x).toBe(5)
        expect(result.meshes[0].position.y).toBe(0.5)
        expect(result.meshes[0].position.z).toBe(10)

        expect(result.meshes[1].position.x).toBe(-5)
        expect(result.meshes[1].position.y).toBe(0.3)
        expect(result.meshes[1].position.z).toBe(-10)

        // Verify rotations
        expect(result.meshes[0].rotation.x).toBeCloseTo(0.1)
        expect(result.meshes[0].rotation.y).toBeCloseTo(0.2)
        expect(result.meshes[0].rotation.z).toBeCloseTo(0.3)

        // Verify materials
        const material0 = result.meshes[0].material as THREE.MeshStandardMaterial
        expect(material0.color.getHexString()).toBe('ff0000')
        expect(material0.emissiveIntensity).toBe(0.5)
        expect(material0.roughness).toBe(0.8)
        expect(material0.metalness).toBe(0.2)
      })

      it('should recreate exact geometry types from config', () => {
        const configs: DecorationConfig[] = [
          {
            id: 'box',
            geometryType: 'box',
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            color: '#ffffff',
            emissiveIntensity: 0,
            roughness: 0.8,
            metalness: 0.1,
          },
          {
            id: 'sphere',
            geometryType: 'sphere',
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            color: '#ffffff',
            emissiveIntensity: 0,
            roughness: 0.8,
            metalness: 0.1,
          },
          {
            id: 'cone',
            geometryType: 'cone',
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            color: '#ffffff',
            emissiveIntensity: 0,
            roughness: 0.8,
            metalness: 0.1,
          },
        ]

        const result = createDecorativeElements(3, configs)

        expect(result.meshes[0].geometry).toBeInstanceOf(THREE.BoxGeometry)
        expect(result.meshes[1].geometry).toBeInstanceOf(THREE.SphereGeometry)
        expect(result.meshes[2].geometry).toBeInstanceOf(THREE.ConeGeometry)
      })

      it('should preserve all geometry types', () => {
        const geometryTypes: DecorationConfig['geometryType'][] = [
          'box', 'sphere', 'cone', 'cylinder', 'torus', 'dodecahedron', 'circle'
        ]

        const configs: DecorationConfig[] = geometryTypes.map((type, i) => ({
          id: `test-${i}`,
          geometryType: type,
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          color: '#ffffff',
          emissiveIntensity: 0,
          roughness: 0.8,
          metalness: 0.1,
        }))

        const result = createDecorativeElements(geometryTypes.length, configs)

        expect(result.meshes[0].geometry).toBeInstanceOf(THREE.BoxGeometry)
        expect(result.meshes[1].geometry).toBeInstanceOf(THREE.SphereGeometry)
        expect(result.meshes[2].geometry).toBeInstanceOf(THREE.ConeGeometry)
        expect(result.meshes[3].geometry).toBeInstanceOf(THREE.CylinderGeometry)
        expect(result.meshes[4].geometry).toBeInstanceOf(THREE.TorusGeometry)
        expect(result.meshes[5].geometry).toBeInstanceOf(THREE.DodecahedronGeometry)
        expect(result.meshes[6].geometry).toBeInstanceOf(THREE.CircleGeometry)
      })
    })

    describe('quantity changes', () => {
      it('should keep existing decorations when quantity unchanged', () => {
        const existingConfigs: DecorationConfig[] = [
          {
            id: 'test-1',
            geometryType: 'box',
            position: { x: 5, y: 0.5, z: 10 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            color: '#ff0000',
            emissiveIntensity: 0,
            roughness: 0.8,
            metalness: 0.1,
          },
          {
            id: 'test-2',
            geometryType: 'sphere',
            position: { x: -5, y: 0.3, z: -10 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 0.8, y: 0.8, z: 0.8 },
            color: '#00ff00',
            emissiveIntensity: 0,
            roughness: 0.8,
            metalness: 0.1,
          },
        ]

        const result = createDecorativeElements(2, existingConfigs)

        expect(result.decorations).toEqual(existingConfigs)
        expect(result.meshes).toHaveLength(2)
      })

      it('should add new random decorations when quantity increased', () => {
        const existingConfigs: DecorationConfig[] = [
          {
            id: 'test-1',
            geometryType: 'box',
            position: { x: 5, y: 0.5, z: 10 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            color: '#ff0000',
            emissiveIntensity: 0,
            roughness: 0.8,
            metalness: 0.1,
          },
        ]

        const result = createDecorativeElements(5, existingConfigs)

        expect(result.decorations).toHaveLength(5)
        expect(result.meshes).toHaveLength(5)

        // First decoration should match existing
        expect(result.decorations[0]).toEqual(existingConfigs[0])

        // New decorations should have unique IDs
        expect(result.decorations[1].id).not.toBe(result.decorations[0].id)
        expect(result.decorations[2].id).not.toBe(result.decorations[1].id)
      })

      it('should truncate decorations when quantity decreased', () => {
        const existingConfigs: DecorationConfig[] = [
          {
            id: 'test-1',
            geometryType: 'box',
            position: { x: 5, y: 0.5, z: 10 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            color: '#ff0000',
            emissiveIntensity: 0,
            roughness: 0.8,
            metalness: 0.1,
          },
          {
            id: 'test-2',
            geometryType: 'sphere',
            position: { x: -5, y: 0.3, z: -10 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 0.8, y: 0.8, z: 0.8 },
            color: '#00ff00',
            emissiveIntensity: 0,
            roughness: 0.8,
            metalness: 0.1,
          },
          {
            id: 'test-3',
            geometryType: 'cone',
            position: { x: 0, y: 0.5, z: 15 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            color: '#0000ff',
            emissiveIntensity: 0,
            roughness: 0.8,
            metalness: 0.1,
          },
        ]

        const result = createDecorativeElements(1, existingConfigs)

        expect(result.decorations).toHaveLength(1)
        expect(result.meshes).toHaveLength(1)
        expect(result.decorations[0]).toEqual(existingConfigs[0])
      })
    })

    describe('logging', () => {
      it('should log creation with DEBUG level', () => {
        const logSpy = vi.spyOn(logger, 'debug')

        createDecorativeElements(10)

        expect(logSpy).toHaveBeenCalledWith(
          'Creating decorative elements',
          expect.objectContaining({
            quantity: 10,
            existingCount: 0
          })
        )
      })

      it('should log additional generation when quantity increased', () => {
        const logSpy = vi.spyOn(logger, 'debug')

        const existingConfigs: DecorationConfig[] = [
          {
            id: 'test-1',
            geometryType: 'box',
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            color: '#ffffff',
            emissiveIntensity: 0,
            roughness: 0.8,
            metalness: 0.1,
          },
        ]

        createDecorativeElements(5, existingConfigs)

        expect(logSpy).toHaveBeenCalledWith(
          'Generating additional decorations',
          expect.objectContaining({ count: 4 })
        )
      })

      it('should log summary with INFO level', () => {
        const logSpy = vi.spyOn(logger, 'info')

        const existingConfigs: DecorationConfig[] = [
          {
            id: 'test-1',
            geometryType: 'box',
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            color: '#ffffff',
            emissiveIntensity: 0,
            roughness: 0.8,
            metalness: 0.1,
          },
        ]

        createDecorativeElements(3, existingConfigs)

        expect(logSpy).toHaveBeenCalledWith(
          'Decorations created',
          expect.objectContaining({
            total: 3,
            recreated: 1,
            newlyGenerated: 2
          })
        )
      })
    })

    describe('random generation', () => {
      it('should generate decorations outside arena bounds', () => {
        const result = createDecorativeElements(10)

        result.decorations.forEach(decoration => {
          const distance = Math.sqrt(
            decoration.position.x ** 2 + decoration.position.z ** 2
          )
          // Should be at least 12 units from origin (outside arena)
          expect(distance).toBeGreaterThanOrEqual(12)
        })
      })

      it('should generate valid decoration IDs', () => {
        const result = createDecorativeElements(10)

        result.decorations.forEach((decoration, index) => {
          expect(decoration.id).toMatch(/^decoration-\d+$/)
        })
      })

      it('should generate decorations with valid properties', () => {
        const result = createDecorativeElements(20)

        result.decorations.forEach(decoration => {
          expect(decoration.geometryType).toMatch(/^(box|sphere|cone|cylinder|torus|dodecahedron|circle)$/)
          expect(decoration.color).toMatch(/^#[0-9a-fA-F]{6}$/)
          expect(decoration.emissiveIntensity).toBeGreaterThanOrEqual(0)
          expect(decoration.emissiveIntensity).toBeLessThanOrEqual(1)
          expect(decoration.roughness).toBeGreaterThanOrEqual(0)
          expect(decoration.roughness).toBeLessThanOrEqual(1)
          expect(decoration.metalness).toBeGreaterThanOrEqual(0)
          expect(decoration.metalness).toBeLessThanOrEqual(1)
        })
      })
    })
  })
})
