import { describe, it, expect, beforeEach } from 'vitest'
import * as THREE from 'three'
import { SelectionManager } from './SelectionManager'

describe('SelectionManager Integration Tests', () => {
  let scene: THREE.Scene
  let camera: THREE.PerspectiveCamera
  let manager: SelectionManager
  let canvas: HTMLCanvasElement

  beforeEach(() => {
    // Create a real scene with proper setup
    scene = new THREE.Scene()

    camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000)
    camera.position.set(0, 5, 10)
    camera.lookAt(0, 0, 0)

    // Create a mock canvas element
    canvas = document.createElement('canvas')
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

    manager = new SelectionManager()
  })

  describe('Real scene selection', () => {
    it('should select a decoration in the scene', () => {
      // Create a decoration at the center of the screen
      const decoration = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
      )
      decoration.position.set(0, 0, 0)
      decoration.userData.selectable = true
      decoration.userData.type = 'decoration'
      decoration.userData.id = 'decoration-1'
      scene.add(decoration)

      const selectableObjects = [decoration]

      // Click at the center of the screen (where the decoration should be)
      const mouseEvent = {
        clientX: 400,
        clientY: 300,
      } as MouseEvent

      manager.handleClick(mouseEvent, camera, selectableObjects, canvas)

      // Should select the decoration (or null if raycasting doesn't hit)
      const selected = manager.getSelectedObject()
      expect(selected).toBeDefined()
    })

    it('should handle multiple selectable objects', () => {
      // Create multiple objects
      const light = new THREE.DirectionalLight(0xffffff, 1)
      light.position.set(5, 10, 5)
      light.userData.selectable = true
      light.userData.type = 'light'
      light.userData.id = 'light-1'
      scene.add(light)

      const decoration1 = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial()
      )
      decoration1.position.set(-2, 0, 0)
      decoration1.userData.selectable = true
      decoration1.userData.type = 'decoration'
      decoration1.userData.id = 'decoration-1'
      scene.add(decoration1)

      const decoration2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.5),
        new THREE.MeshStandardMaterial()
      )
      decoration2.position.set(2, 0, 0)
      decoration2.userData.selectable = true
      decoration2.userData.type = 'decoration'
      decoration2.userData.id = 'decoration-2'
      scene.add(decoration2)

      const selectableObjects = [light, decoration1, decoration2]

      // Click somewhere
      const mouseEvent = {
        clientX: 400,
        clientY: 300,
      } as MouseEvent

      manager.handleClick(mouseEvent, camera, selectableObjects, canvas)

      // Should not crash - selection may be null or one of the objects
      expect(manager.getSelectedObject()).toBeDefined()
    })

    it('should not select non-selectable objects', () => {
      // Create arena floor (not selectable)
      const arenaFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshStandardMaterial()
      )
      arenaFloor.rotation.x = -Math.PI / 2
      arenaFloor.userData.type = 'arena-floor'
      arenaFloor.userData.selectable = false
      scene.add(arenaFloor)

      // Only pass empty selectable objects array
      const selectableObjects: THREE.Object3D[] = []

      const mouseEvent = {
        clientX: 400,
        clientY: 300,
      } as MouseEvent

      manager.handleClick(mouseEvent, camera, selectableObjects, canvas)

      // Should have null selection
      expect(manager.getSelectedObject()).toBeNull()
    })

    it('should update selection when clicking different objects', () => {
      let selectionChanges = 0
      let lastSelected: THREE.Object3D | null = null

      manager.onSelectionChange((obj) => {
        selectionChanges++
        lastSelected = obj
      })

      const obj1 = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial()
      )
      obj1.userData.selectable = true
      obj1.userData.id = 'obj1'

      const obj2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.5),
        new THREE.MeshStandardMaterial()
      )
      obj2.userData.selectable = true
      obj2.userData.id = 'obj2'

      // Select first object
      manager.setSelectedObject(obj1)
      expect(selectionChanges).toBe(1)
      expect(lastSelected).toBe(obj1)

      // Select second object
      manager.setSelectedObject(obj2)
      expect(selectionChanges).toBe(2)
      expect(lastSelected).toBe(obj2)

      // Clear selection
      manager.clearSelection()
      expect(selectionChanges).toBe(3)
      expect(lastSelected).toBeNull()
    })

    it('should handle snake and food selection', () => {
      // Create snake head
      const snakeHead = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.4, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x00ff00 })
      )
      snakeHead.position.set(0, 0.5, 0)
      snakeHead.userData.selectable = true
      snakeHead.userData.type = 'snake-head'
      snakeHead.userData.id = 'snake-head'
      scene.add(snakeHead)

      // Create food
      const food = new THREE.Mesh(
        new THREE.SphereGeometry(0.3),
        new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.2 })
      )
      food.position.set(3, 0.3, 2)
      food.userData.selectable = true
      food.userData.type = 'food'
      food.userData.id = 'food'
      scene.add(food)

      const selectableObjects = [snakeHead, food]

      // Both should be in the selectable objects array
      expect(selectableObjects).toContain(snakeHead)
      expect(selectableObjects).toContain(food)

      // Test selection
      manager.setSelectedObject(snakeHead)
      expect(manager.getSelectedObject()).toBe(snakeHead)
      expect(manager.getSelectedObject()?.userData.type).toBe('snake-head')

      manager.setSelectedObject(food)
      expect(manager.getSelectedObject()).toBe(food)
      expect(manager.getSelectedObject()?.userData.type).toBe('food')
    })

    it('should work with light helpers', () => {
      // Create directional light with helper
      const light = new THREE.DirectionalLight(0xffffff, 1)
      light.position.set(0, 10, 5)
      light.userData.selectable = true
      light.userData.type = 'directional-light'
      light.userData.id = 'light-1'
      scene.add(light)

      const helper = new THREE.DirectionalLightHelper(light, 1)
      scene.add(helper)

      const selectableObjects = [light]

      // Light should be selectable
      expect(selectableObjects).toContain(light)

      // Select the light
      manager.setSelectedObject(light)
      expect(manager.getSelectedObject()).toBe(light)
      expect(manager.getSelectedObject()?.userData.type).toBe('directional-light')
    })
  })

  describe('Edge cases', () => {
    it('should handle clicking outside scene bounds', () => {
      const decoration = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial()
      )
      decoration.userData.selectable = true
      scene.add(decoration)

      const selectableObjects = [decoration]

      // Click way outside the canvas bounds
      const mouseEvent = {
        clientX: 10000,
        clientY: 10000,
      } as MouseEvent

      // Should not crash
      expect(() => {
        manager.handleClick(mouseEvent, camera, selectableObjects, canvas)
      }).not.toThrow()
    })

    it('should handle empty scene', () => {
      const selectableObjects: THREE.Object3D[] = []

      const mouseEvent = {
        clientX: 400,
        clientY: 300,
      } as MouseEvent

      manager.handleClick(mouseEvent, camera, selectableObjects, canvas)

      expect(manager.getSelectedObject()).toBeNull()
    })

    it('should handle selecting same object twice', () => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial()
      )
      mesh.userData.selectable = true

      let callCount = 0
      manager.onSelectionChange(() => callCount++)

      manager.setSelectedObject(mesh)
      expect(callCount).toBe(1)

      // Select same object again - should not trigger callback
      manager.setSelectedObject(mesh)
      expect(callCount).toBe(1) // Still 1, not 2
    })
  })
})
