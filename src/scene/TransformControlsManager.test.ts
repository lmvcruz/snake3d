import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'
import { TransformControlsManager } from './TransformControlsManager'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

describe('TransformControlsManager', () => {
  let manager: TransformControlsManager
  let camera: THREE.Camera
  let domElement: HTMLElement
  let orbitControls: OrbitControls
  let scene: THREE.Scene

  beforeEach(() => {
    // Create mock canvas without WebGL renderer
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    domElement = canvas

    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    camera.position.set(0, 5, 10)

    // Mock OrbitControls
    orbitControls = {
      enabled: true,
      update: vi.fn(),
      dispose: vi.fn(),
    } as any

    scene = new THREE.Scene()

    manager = new TransformControlsManager(camera, domElement, scene)
  })

  describe('initialization', () => {
    it('should create instance with TransformControls', () => {
      expect(manager).toBeDefined()
      expect(manager.getMode()).toBe('translate')
    })

    it('should start with translate mode', () => {
      expect(manager.getMode()).toBe('translate')
    })

    it('should have no attached object initially', () => {
      expect(manager.getAttachedObject()).toBeNull()
    })
  })

  describe('mode switching', () => {
    it('should switch to rotate mode', () => {
      manager.setMode('rotate')
      expect(manager.getMode()).toBe('rotate')
    })

    it('should switch to scale mode', () => {
      manager.setMode('scale')
      expect(manager.getMode()).toBe('scale')
    })

    it('should switch back to translate mode', () => {
      manager.setMode('rotate')
      manager.setMode('translate')
      expect(manager.getMode()).toBe('translate')
    })

    it('should log mode changes with DEBUG level', () => {
      const consoleSpy = vi.spyOn(console, 'log')

      manager.setMode('rotate')

      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('object attachment', () => {
    it('should attach to object', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      )

      manager.attach(mesh)

      expect(manager.getAttachedObject()).toBe(mesh)
    })

    it('should detach from object', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      )

      manager.attach(mesh)
      expect(manager.getAttachedObject()).toBe(mesh)

      manager.detach()
      expect(manager.getAttachedObject()).toBeNull()
    })

    it('should replace previously attached object', () => {
      const mesh1 = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      )
      const mesh2 = new THREE.Mesh(
        new THREE.SphereGeometry(1),
        new THREE.MeshBasicMaterial()
      )

      manager.attach(mesh1)
      expect(manager.getAttachedObject()).toBe(mesh1)

      manager.attach(mesh2)
      expect(manager.getAttachedObject()).toBe(mesh2)
    })

    it('should log attachment with DEBUG level', () => {
      const consoleSpy = vi.spyOn(console, 'log')

      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      )
      mesh.userData.id = 'test-object'

      manager.attach(mesh)

      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should log detachment with DEBUG level', () => {
      const consoleSpy = vi.spyOn(console, 'log')

      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      )

      manager.attach(mesh)
      const callsAfterAttach = consoleSpy.mock.calls.length

      manager.detach()
      const callsAfterDetach = consoleSpy.mock.calls.length

      // Should have logged both attach and detach
      expect(callsAfterDetach).toBeGreaterThan(callsAfterAttach)
    })
  })

  describe('OrbitControls integration', () => {
    beforeEach(() => {
      manager.setOrbitControls(orbitControls)
    })

    it('should register OrbitControls', () => {
      expect(manager.getOrbitControls()).toBe(orbitControls)
    })

    it('should disable OrbitControls on drag start', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      )
      manager.attach(mesh)

      // Simulate drag start event
      manager.onDragStart()

      expect(orbitControls.enabled).toBe(false)
    })

    it('should enable OrbitControls on drag end', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      )
      manager.attach(mesh)

      // Simulate drag
      manager.onDragStart()
      expect(orbitControls.enabled).toBe(false)

      manager.onDragEnd()
      expect(orbitControls.enabled).toBe(true)
    })

    it('should log OrbitControls state changes with DEBUG level', () => {
      const consoleSpy = vi.spyOn(console, 'log')

      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      )
      manager.attach(mesh)

      manager.onDragStart()
      manager.onDragEnd()

      // Should have logged both disable and enable
      expect(consoleSpy.mock.calls.length).toBeGreaterThan(0)
    })

    it('should not crash if OrbitControls not set', () => {
      const managerWithoutOrbit = new TransformControlsManager(
        camera,
        domElement,
        scene
      )

      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      )

      // Should not throw
      expect(() => {
        managerWithoutOrbit.attach(mesh)
        managerWithoutOrbit.onDragStart()
        managerWithoutOrbit.onDragEnd()
      }).not.toThrow()
    })
  })

  describe('transform change events', () => {
    it('should emit change event when object transformed', () => {
      const onChange = vi.fn()
      manager.onTransformChange(onChange)

      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      )
      manager.attach(mesh)

      // Simulate transform change
      manager.simulateTransformChange()

      expect(onChange).toHaveBeenCalledWith(mesh)
    })

    it('should emit objectChange event when transformation complete', () => {
      const onObjectChange = vi.fn()
      manager.onObjectChange(onObjectChange)

      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      )
      manager.attach(mesh)

      // Simulate object change
      manager.simulateObjectChange()

      expect(onObjectChange).toHaveBeenCalledWith(mesh)
    })

    it('should log transform operations with DEBUG level', () => {
      const consoleSpy = vi.spyOn(console, 'log')

      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      )
      mesh.userData.id = 'test-object'
      manager.attach(mesh)

      manager.simulateTransformChange()

      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('visibility', () => {
    it('should show controls when object attached', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      )

      manager.attach(mesh)

      expect(manager.isVisible()).toBe(true)
    })

    it('should hide controls when detached', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      )

      manager.attach(mesh)
      expect(manager.isVisible()).toBe(true)

      manager.detach()
      expect(manager.isVisible()).toBe(false)
    })

    it('should allow manual show/hide', () => {
      manager.setVisible(true)
      expect(manager.isVisible()).toBe(true)

      manager.setVisible(false)
      expect(manager.isVisible()).toBe(false)
    })
  })

  describe('cleanup', () => {
    it('should dispose TransformControls', () => {
      expect(() => {
        manager.dispose()
      }).not.toThrow()
    })

    it('should remove event listeners on dispose', () => {
      const onChange = vi.fn()
      manager.onTransformChange(onChange)

      manager.dispose()

      // Should not trigger callback after disposal
      manager.simulateTransformChange()
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('getTransformControls', () => {
    it('should return TransformControls instance', () => {
      const controls = manager.getTransformControls()
      expect(controls).toBeDefined()
    })
  })
})
