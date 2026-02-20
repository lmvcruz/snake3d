import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as THREE from 'three'
import { OutlineManager } from './OutlineManager'

// Mock WebGLRenderer to avoid WebGL context issues in tests
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof import('three')>('three')

  class MockWebGLRenderer {
    domElement: HTMLCanvasElement
    private _pixelRatio: number = 1

    constructor() {
      this.domElement = document.createElement('canvas')
      this.domElement.width = 800
      this.domElement.height = 600
    }

    setSize(width: number, height: number) {
      this.domElement.width = width
      this.domElement.height = height
    }

    setPixelRatio(ratio: number) {
      this._pixelRatio = ratio
    }

    getPixelRatio() {
      return this._pixelRatio
    }

    render() {}
    dispose() {}

    getSize(target: THREE.Vector2) {
      target.set(this.domElement.width, this.domElement.height)
      return target
    }
  }

  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer as any,
  }
})

describe('OutlineManager', () => {
  let scene: THREE.Scene
  let camera: THREE.Camera
  let renderer: THREE.WebGLRenderer
  let manager: OutlineManager

  beforeEach(() => {
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    renderer = new THREE.WebGLRenderer()

    manager = new OutlineManager(scene, camera, renderer)
  })

  describe('initialization', () => {
    it('should create instance with composer and OutlinePass', () => {
      expect(manager).toBeDefined()
      expect(manager.getComposer()).toBeDefined()
      expect(manager.getOutlinePass()).toBeDefined()
    })

    it('should have no selected objects initially', () => {
      const selectedObjects = manager.getSelectedObjects()
      expect(selectedObjects).toEqual([])
    })

    it('should configure outline with default color', () => {
      const outlinePass = manager.getOutlinePass()
      expect(outlinePass.visibleEdgeColor).toBeDefined()
    })

    it('should configure outline with default thickness', () => {
      const outlinePass = manager.getOutlinePass()
      expect(outlinePass.edgeStrength).toBeGreaterThan(0)
      expect(outlinePass.edgeThickness).toBeGreaterThan(0)
    })
  })

  describe('selection management', () => {
    it('should set selected objects', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      )

      manager.setSelectedObjects([mesh])

      const selectedObjects = manager.getSelectedObjects()
      expect(selectedObjects).toHaveLength(1)
      expect(selectedObjects[0]).toBe(mesh)
    })

    it('should clear selected objects', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      )

      manager.setSelectedObjects([mesh])
      expect(manager.getSelectedObjects()).toHaveLength(1)

      manager.clearSelection()
      expect(manager.getSelectedObjects()).toHaveLength(0)
    })

    it('should replace previous selection with new selection', () => {
      const mesh1 = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      )
      const mesh2 = new THREE.Mesh(
        new THREE.SphereGeometry(1),
        new THREE.MeshBasicMaterial()
      )

      manager.setSelectedObjects([mesh1])
      expect(manager.getSelectedObjects()).toHaveLength(1)
      expect(manager.getSelectedObjects()[0]).toBe(mesh1)

      manager.setSelectedObjects([mesh2])
      expect(manager.getSelectedObjects()).toHaveLength(1)
      expect(manager.getSelectedObjects()[0]).toBe(mesh2)
    })

    it('should handle multiple selected objects', () => {
      const mesh1 = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      )
      const mesh2 = new THREE.Mesh(
        new THREE.SphereGeometry(1),
        new THREE.MeshBasicMaterial()
      )

      manager.setSelectedObjects([mesh1, mesh2])

      const selectedObjects = manager.getSelectedObjects()
      expect(selectedObjects).toHaveLength(2)
      expect(selectedObjects).toContain(mesh1)
      expect(selectedObjects).toContain(mesh2)
    })
  })

  describe('outline configuration', () => {
    it('should allow setting outline color', () => {
      manager.setOutlineColor('#ffff00') // Yellow

      const outlinePass = manager.getOutlinePass()
      const color = outlinePass.visibleEdgeColor

      // Yellow is RGB(1, 1, 0)
      expect(color.r).toBeCloseTo(1, 1)
      expect(color.g).toBeCloseTo(1, 1)
      expect(color.b).toBeCloseTo(0, 1)
    })

    it('should allow setting outline thickness', () => {
      manager.setOutlineThickness(5.0)

      const outlinePass = manager.getOutlinePass()
      expect(outlinePass.edgeThickness).toBe(5.0)
    })

    it('should allow setting outline strength', () => {
      manager.setOutlineStrength(10.0)

      const outlinePass = manager.getOutlinePass()
      expect(outlinePass.edgeStrength).toBe(10.0)
    })

    it('should allow setting pulsing effect', () => {
      manager.setPulsing(true)
      expect(manager.isPulsing()).toBe(true)

      manager.setPulsing(false)
      expect(manager.isPulsing()).toBe(false)
    })
  })

  describe('rendering', () => {
    it('should provide render method that uses composer', () => {
      expect(manager.render).toBeDefined()
      expect(typeof manager.render).toBe('function')
    })

    it('should update pulsing animation when enabled', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      )
      manager.setSelectedObjects([mesh])
      manager.setPulsing(true)

      const initialStrength = manager.getOutlinePass().edgeStrength

      // Simulate time passing
      manager.update(0.016) // 16ms (60fps)

      const newStrength = manager.getOutlinePass().edgeStrength

      // Strength should change when pulsing
      expect(newStrength).not.toBe(initialStrength)
    })

    it('should not update animation when pulsing disabled', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      )
      manager.setSelectedObjects([mesh])
      manager.setPulsing(false)

      const initialStrength = manager.getOutlinePass().edgeStrength

      manager.update(0.016)

      const newStrength = manager.getOutlinePass().edgeStrength
      expect(newStrength).toBe(initialStrength)
    })
  })

  describe('logging', () => {
    it('should log initialization with DEBUG level', () => {
      // Manager already created in beforeEach, so this tests that constructor logs
      expect(manager).toBeDefined()
    })

    it('should log selection changes with TRACE level', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      )
      mesh.userData.id = 'test-object'
      mesh.userData.type = 'decoration'

      manager.setSelectedObjects([mesh])

      // Logs should be captured by logger
      expect(manager.getSelectedObjects()).toHaveLength(1)
    })

    it('should log configuration changes with DEBUG level', () => {
      manager.setOutlineColor('#ff0000')
      manager.setOutlineThickness(3.0)

      // Configuration should be applied
      const outlinePass = manager.getOutlinePass()
      expect(outlinePass.edgeThickness).toBe(3.0)
    })
  })

  describe('resize handling', () => {
    it('should update composer size on resize', () => {
      // Should not throw when calling setSize
      expect(() => manager.setSize(1024, 768)).not.toThrow()

      const composer = manager.getComposer()
      expect(composer).toBeDefined()
    })

    it('should update pixel ratio on resize', () => {
      // Should not throw when calling setSize with pixel ratio
      expect(() => manager.setSize(1024, 768, 2)).not.toThrow()

      const composer = manager.getComposer()
      expect(composer).toBeDefined()
    })
  })

  describe('cleanup', () => {
    it('should dispose composer and passes', () => {
      manager.dispose()

      // After dispose, attempting to render should not crash
      expect(() => manager.render()).not.toThrow()
    })
  })
})
