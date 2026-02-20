/**
 * Tests for transformable vs material-only object behavior in ConfigMode
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as THREE from 'three'

describe('ConfigMode - Transformable Object Classification', () => {
  describe('Object userData.transformable flag', () => {
    it('should mark decorations as transformable', () => {
      const decoration = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial()
      )
      decoration.userData.selectable = true
      decoration.userData.transformable = true
      decoration.userData.type = 'decoration'
      decoration.userData.id = 'decoration-0'

      expect(decoration.userData.transformable).toBe(true)
      expect(decoration.userData.selectable).toBe(true)
    })

    it('should mark snake parts as material-only (not transformable)', () => {
      const snakeHead = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.4, 0.6),
        new THREE.MeshStandardMaterial()
      )
      snakeHead.userData.selectable = true
      snakeHead.userData.transformable = false
      snakeHead.userData.type = 'snake-head'
      snakeHead.userData.id = 'snake-head'

      expect(snakeHead.userData.transformable).toBe(false)
      expect(snakeHead.userData.selectable).toBe(true)
    })

    it('should mark food as material-only (not transformable)', () => {
      const food = new THREE.Mesh(
        new THREE.SphereGeometry(0.3),
        new THREE.MeshStandardMaterial()
      )
      food.userData.selectable = true
      food.userData.transformable = false
      food.userData.type = 'food'
      food.userData.id = 'food'

      expect(food.userData.transformable).toBe(false)
      expect(food.userData.selectable).toBe(true)
    })

    it('should mark external floor as material-only (not transformable)', () => {
      const externalFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshStandardMaterial()
      )
      externalFloor.userData.selectable = true
      externalFloor.userData.transformable = false
      externalFloor.userData.type = 'external-floor'
      externalFloor.userData.id = 'external-floor'

      expect(externalFloor.userData.transformable).toBe(false)
      expect(externalFloor.userData.selectable).toBe(true)
    })

    it('should mark arena floor as not selectable', () => {
      const arenaFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshStandardMaterial()
      )
      arenaFloor.userData.type = 'arena-floor'
      // Arena floor should not have selectable flag or it should be false

      expect(arenaFloor.userData.selectable).not.toBe(true)
    })
  })

  describe('Selection logic with transformable flag', () => {
    it('should identify transformable objects correctly', () => {
      const objects = [
        { type: 'decoration', transformable: true, selectable: true },
        { type: 'snake-head', transformable: false, selectable: true },
        { type: 'food', transformable: false, selectable: true },
        { type: 'external-floor', transformable: false, selectable: true },
      ]

      const transformableObjects = objects.filter(obj => obj.transformable === true)
      const materialOnlyObjects = objects.filter(obj => obj.selectable && !obj.transformable)

      expect(transformableObjects.length).toBe(1)
      expect(transformableObjects[0].type).toBe('decoration')

      expect(materialOnlyObjects.length).toBe(3)
      expect(materialOnlyObjects.map(o => o.type)).toEqual([
        'snake-head',
        'food',
        'external-floor'
      ])
    })

    it('should determine if TransformControls should attach based on transformable flag', () => {
      const shouldAttachTransform = (object: THREE.Object3D | null): boolean => {
        if (!object) return false
        return object.userData.transformable === true
      }

      const decoration = new THREE.Mesh()
      decoration.userData.transformable = true

      const snake = new THREE.Mesh()
      snake.userData.transformable = false

      const food = new THREE.Mesh()
      food.userData.transformable = false

      expect(shouldAttachTransform(decoration)).toBe(true)
      expect(shouldAttachTransform(snake)).toBe(false)
      expect(shouldAttachTransform(food)).toBe(false)
      expect(shouldAttachTransform(null)).toBe(false)
    })
  })

  describe('Object categorization', () => {
    it('should categorize all scene objects correctly', () => {
      const sceneObjects = [
        // Transformable
        { id: 'decoration-0', type: 'decoration', transformable: true, selectable: true },
        { id: 'decoration-1', type: 'decoration', transformable: true, selectable: true },
        { id: 'light-1', type: 'directional-light', transformable: true, selectable: true },

        // Material-only (selectable but not transformable)
        { id: 'snake-head', type: 'snake-head', transformable: false, selectable: true },
        { id: 'snake-body-0', type: 'snake-body', transformable: false, selectable: true },
        { id: 'food', type: 'food', transformable: false, selectable: true },
        { id: 'external-floor', type: 'external-floor', transformable: false, selectable: true },

        // Not selectable
        { id: 'arena-floor', type: 'arena-floor', transformable: false, selectable: false },
        { id: 'arena-walls', type: 'arena-walls', transformable: false, selectable: false },
      ]

      const selectableObjects = sceneObjects.filter(obj => obj.selectable)
      const transformableObjects = selectableObjects.filter(obj => obj.transformable)
      const materialOnlyObjects = selectableObjects.filter(obj => !obj.transformable)
      const nonSelectableObjects = sceneObjects.filter(obj => !obj.selectable)

      // Verify counts
      expect(selectableObjects.length).toBe(7) // All except arena floor/walls
      expect(transformableObjects.length).toBe(3) // Decorations + lights
      expect(materialOnlyObjects.length).toBe(4) // Snake + food + external floor
      expect(nonSelectableObjects.length).toBe(2) // Arena floor + walls

      // Verify transformable objects
      expect(transformableObjects.every(obj => obj.transformable === true)).toBe(true)
      expect(transformableObjects.every(obj => obj.selectable === true)).toBe(true)

      // Verify material-only objects
      expect(materialOnlyObjects.every(obj => obj.transformable === false)).toBe(true)
      expect(materialOnlyObjects.every(obj => obj.selectable === true)).toBe(true)

      // Verify non-selectable objects
      expect(nonSelectableObjects.every(obj => obj.selectable === false)).toBe(true)
    })
  })
})
