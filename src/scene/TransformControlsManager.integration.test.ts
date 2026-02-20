import { describe, it, expect, beforeEach } from 'vitest'
import * as THREE from 'three'
import { TransformControlsManager } from './TransformControlsManager'
import { SelectionManager } from './SelectionManager'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

describe('TransformControls Integration Tests', () => {
  let scene: THREE.Scene
  let camera: THREE.PerspectiveCamera
  let domElement: HTMLElement
  let transformManager: TransformControlsManager
  let selectionManager: SelectionManager
  let orbitControls: OrbitControls

  beforeEach(() => {
    // Create scene and camera
    scene = new THREE.Scene()

    camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000)
    camera.position.set(0, 5, 10)
    camera.lookAt(0, 0, 0)

    // Create canvas
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    canvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => '',
    })
    domElement = canvas

    // Create managers
    transformManager = new TransformControlsManager(camera, domElement, scene)
    selectionManager = new SelectionManager()

    // Mock OrbitControls
    orbitControls = {
      enabled: true,
      update: () => {},
      dispose: () => {},
    } as any

    transformManager.setOrbitControls(orbitControls)
  })

  describe('Selection and Transform Workflow', () => {
    it('should attach TransformControls when object selected', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial()
      )
      mesh.userData.selectable = true
      mesh.userData.id = 'test-object'
      scene.add(mesh)

      // Wire up selection callback to attach transform
      selectionManager.onSelectionChange((object) => {
        if (object) {
          transformManager.attach(object)
        } else {
          transformManager.detach()
        }
      })

      // Select object
      selectionManager.setSelectedObject(mesh)

      // Verify transform attached
      expect(transformManager.getAttachedObject()).toBe(mesh)
      expect(transformManager.isVisible()).toBe(true)
    })

    it('should detach TransformControls when object deselected', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial()
      )
      mesh.userData.selectable = true
      scene.add(mesh)

      // Wire up selection callback
      selectionManager.onSelectionChange((object) => {
        if (object) {
          transformManager.attach(object)
        } else {
          transformManager.detach()
        }
      })

      // Select then deselect
      selectionManager.setSelectedObject(mesh)
      expect(transformManager.getAttachedObject()).toBe(mesh)

      selectionManager.clearSelection()
      expect(transformManager.getAttachedObject()).toBeNull()
      expect(transformManager.isVisible()).toBe(false)
    })

    it('should switch TransformControls when selecting different objects', () => {
      const mesh1 = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial()
      )
      mesh1.userData.selectable = true
      mesh1.userData.id = 'object1'
      scene.add(mesh1)

      const mesh2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.5),
        new THREE.MeshStandardMaterial()
      )
      mesh2.userData.selectable = true
      mesh2.userData.id = 'object2'
      scene.add(mesh2)

      // Wire up selection callback
      selectionManager.onSelectionChange((object) => {
        if (object) {
          transformManager.attach(object)
        } else {
          transformManager.detach()
        }
      })

      // Select first object
      selectionManager.setSelectedObject(mesh1)
      expect(transformManager.getAttachedObject()).toBe(mesh1)

      // Select second object
      selectionManager.setSelectedObject(mesh2)
      expect(transformManager.getAttachedObject()).toBe(mesh2)
    })
  })

  describe('OrbitControls Conflict Resolution', () => {
    it('should disable OrbitControls during transform', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial()
      )
      mesh.userData.selectable = true
      scene.add(mesh)

      transformManager.attach(mesh)
      expect(orbitControls.enabled).toBe(true)

      transformManager.onDragStart()
      expect(orbitControls.enabled).toBe(false)

      transformManager.onDragEnd()
      expect(orbitControls.enabled).toBe(true)
    })

    it('should maintain OrbitControls state across selections', () => {
      const mesh1 = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial()
      )
      mesh1.userData.selectable = true
      scene.add(mesh1)

      const mesh2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.5),
        new THREE.MeshStandardMaterial()
      )
      mesh2.userData.selectable = true
      scene.add(mesh2)

      // Select and transform first object
      transformManager.attach(mesh1)
      transformManager.onDragStart()
      expect(orbitControls.enabled).toBe(false)
      transformManager.onDragEnd()
      expect(orbitControls.enabled).toBe(true)

      // Switch to second object
      transformManager.attach(mesh2)
      expect(orbitControls.enabled).toBe(true)
    })
  })

  describe('Transform Mode Switching', () => {
    it('should switch modes while object is attached', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial()
      )
      mesh.userData.selectable = true
      scene.add(mesh)

      transformManager.attach(mesh)
      expect(transformManager.getMode()).toBe('translate')

      transformManager.setMode('rotate')
      expect(transformManager.getMode()).toBe('rotate')
      expect(transformManager.getAttachedObject()).toBe(mesh)

      transformManager.setMode('scale')
      expect(transformManager.getMode()).toBe('scale')
      expect(transformManager.getAttachedObject()).toBe(mesh)
    })

    it('should preserve mode when switching objects', () => {
      const mesh1 = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial()
      )
      mesh1.userData.selectable = true
      scene.add(mesh1)

      const mesh2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.5),
        new THREE.MeshStandardMaterial()
      )
      mesh2.userData.selectable = true
      scene.add(mesh2)

      // Set to rotate mode
      transformManager.attach(mesh1)
      transformManager.setMode('rotate')
      expect(transformManager.getMode()).toBe('rotate')

      // Switch object
      transformManager.attach(mesh2)
      expect(transformManager.getMode()).toBe('rotate')
    })
  })

  describe('Transform Change Events', () => {
    it('should notify when object is transformed', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial()
      )
      mesh.userData.selectable = true
      mesh.userData.id = 'test-object'
      scene.add(mesh)

      let transformedObject: THREE.Object3D | null = null
      transformManager.onTransformChange((object) => {
        transformedObject = object
      })

      transformManager.attach(mesh)
      transformManager.simulateTransformChange()

      expect(transformedObject).toBe(mesh)
    })

    it('should notify when transformation is complete', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial()
      )
      mesh.userData.selectable = true
      mesh.userData.id = 'test-object'
      scene.add(mesh)

      let changedObject: THREE.Object3D | null = null
      transformManager.onObjectChange((object) => {
        changedObject = object
      })

      transformManager.attach(mesh)
      transformManager.simulateObjectChange()

      expect(changedObject).toBe(mesh)
    })
  })

  describe('Multiple Object Types', () => {
    it('should handle lights with TransformControls', () => {
      const light = new THREE.DirectionalLight(0xffffff, 1)
      light.position.set(5, 10, 5)
      light.userData.selectable = true
      light.userData.type = 'directional-light'
      light.userData.id = 'light-1'
      scene.add(light)

      selectionManager.onSelectionChange((object) => {
        if (object) {
          transformManager.attach(object)
        } else {
          transformManager.detach()
        }
      })

      selectionManager.setSelectedObject(light)
      expect(transformManager.getAttachedObject()).toBe(light)
    })

    it('should handle decorations with TransformControls', () => {
      const decoration = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
      )
      decoration.position.set(2, 1, 3)
      decoration.userData.selectable = true
      decoration.userData.type = 'decoration'
      decoration.userData.id = 'decoration-1'
      scene.add(decoration)

      selectionManager.onSelectionChange((object) => {
        if (object) {
          transformManager.attach(object)
        } else {
          transformManager.detach()
        }
      })

      selectionManager.setSelectedObject(decoration)
      expect(transformManager.getAttachedObject()).toBe(decoration)
    })

    it('should handle snake parts with TransformControls', () => {
      const snakeHead = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.4, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x00ff00 })
      )
      snakeHead.position.set(0, 0.5, 0)
      snakeHead.userData.selectable = true
      snakeHead.userData.type = 'snake-head'
      snakeHead.userData.id = 'snake-head'
      scene.add(snakeHead)

      selectionManager.onSelectionChange((object) => {
        if (object) {
          transformManager.attach(object)
        } else {
          transformManager.detach()
        }
      })

      selectionManager.setSelectedObject(snakeHead)
      expect(transformManager.getAttachedObject()).toBe(snakeHead)
    })
  })

  describe('Cleanup', () => {
    it('should properly dispose both managers', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial()
      )
      mesh.userData.selectable = true
      scene.add(mesh)

      transformManager.attach(mesh)

      expect(() => {
        transformManager.dispose()
      }).not.toThrow()
    })
  })
})
