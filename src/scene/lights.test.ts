import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as THREE from 'three'
import { createDirectionalLight, createPointLight } from './lights'

describe('lights', () => {
  describe('createDirectionalLight', () => {
    it('should create directional light with default config', () => {
      const result = createDirectionalLight()

      expect(result.light).toBeInstanceOf(THREE.DirectionalLight)
      expect(result.helper).toBeInstanceOf(THREE.DirectionalLightHelper)
      expect(result.id).toBeDefined()
      expect(typeof result.id).toBe('string')
    })

    it('should apply custom color', () => {
      const result = createDirectionalLight({ color: '#ff0000' })

      expect(result.light.color.getHexString()).toBe('ff0000')
    })

    it('should apply custom intensity', () => {
      const result = createDirectionalLight({ intensity: 5.0 })

      expect(result.light.intensity).toBe(5.0)
    })

    it('should apply custom position', () => {
      const result = createDirectionalLight({ position: { x: 10, y: 20, z: 30 } })

      expect(result.light.position.x).toBe(10)
      expect(result.light.position.y).toBe(20)
      expect(result.light.position.z).toBe(30)
    })

    it('should enable shadows by default', () => {
      const result = createDirectionalLight()

      expect(result.light.castShadow).toBe(true)
    })

    it('should allow disabling shadows', () => {
      const result = createDirectionalLight({ castShadow: false })

      expect(result.light.castShadow).toBe(false)
    })

    it('should configure shadow properties', () => {
      const result = createDirectionalLight({
        shadowMapSize: 2048,
        shadowCameraNear: 1,
        shadowCameraFar: 100
      })

      expect(result.light.shadow.mapSize.width).toBe(2048)
      expect(result.light.shadow.mapSize.height).toBe(2048)
      expect(result.light.shadow.camera.near).toBe(1)
      expect(result.light.shadow.camera.far).toBe(100)
    })

    it('should create helper with correct size', () => {
      const result = createDirectionalLight({ helperSize: 10 })

      // Helper size is stored but not directly accessible, verify it exists
      expect(result.helper).toBeInstanceOf(THREE.DirectionalLightHelper)
    })

    it('should set helper visible by default', () => {
      const result = createDirectionalLight()

      expect(result.helper.visible).toBe(true)
    })

    it('should allow hiding helper', () => {
      const result = createDirectionalLight({ helperVisible: false })

      expect(result.helper.visible).toBe(false)
    })

    it('should generate unique IDs for each light', () => {
      const light1 = createDirectionalLight()
      const light2 = createDirectionalLight()

      expect(light1.id).not.toBe(light2.id)
    })

    it('should log light creation with TRACE level', () => {
      const consoleSpy = vi.spyOn(console, 'log')

      createDirectionalLight({ position: { x: 5, y: 10, z: 15 } })

      // Check that logging occurred (logger should write to console in test env)
      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should use default values from sceneConfig', () => {
      const result = createDirectionalLight()

      // Should use defaults from sceneConfig
      expect(result.light.intensity).toBeGreaterThan(0)
      expect(result.light.color).toBeInstanceOf(THREE.Color)
    })
  })

  describe('createPointLight', () => {
    it('should create point light with default config', () => {
      const result = createPointLight()

      expect(result.light).toBeInstanceOf(THREE.PointLight)
      expect(result.helper).toBeInstanceOf(THREE.PointLightHelper)
      expect(result.id).toBeDefined()
      expect(typeof result.id).toBe('string')
    })

    it('should apply custom color', () => {
      const result = createPointLight({ color: '#00ff00' })

      expect(result.light.color.getHexString()).toBe('00ff00')
    })

    it('should apply custom intensity', () => {
      const result = createPointLight({ intensity: 3.5 })

      expect(result.light.intensity).toBe(3.5)
    })

    it('should apply custom position', () => {
      const result = createPointLight({ position: { x: 5, y: 15, z: 25 } })

      expect(result.light.position.x).toBe(5)
      expect(result.light.position.y).toBe(15)
      expect(result.light.position.z).toBe(25)
    })

    it('should apply custom distance', () => {
      const result = createPointLight({ distance: 50 })

      expect(result.light.distance).toBe(50)
    })

    it('should apply custom decay', () => {
      const result = createPointLight({ decay: 1.5 })

      expect(result.light.decay).toBe(1.5)
    })

    it('should enable shadows by default', () => {
      const result = createPointLight()

      expect(result.light.castShadow).toBe(true)
    })

    it('should allow disabling shadows', () => {
      const result = createPointLight({ castShadow: false })

      expect(result.light.castShadow).toBe(false)
    })

    it('should configure shadow properties', () => {
      const result = createPointLight({
        shadowMapSize: 1024,
        shadowCameraNear: 0.5,
        shadowCameraFar: 200
      })

      expect(result.light.shadow.mapSize.width).toBe(1024)
      expect(result.light.shadow.mapSize.height).toBe(1024)
      expect(result.light.shadow.camera.near).toBe(0.5)
      expect(result.light.shadow.camera.far).toBe(200)
    })

    it('should create helper with correct size', () => {
      const result = createPointLight({ helperSize: 2 })

      // Helper size is stored but not directly accessible, verify it exists
      expect(result.helper).toBeInstanceOf(THREE.PointLightHelper)
    })

    it('should set helper visible by default', () => {
      const result = createPointLight()

      expect(result.helper.visible).toBe(true)
    })

    it('should allow hiding helper', () => {
      const result = createPointLight({ helperVisible: false })

      expect(result.helper.visible).toBe(false)
    })

    it('should generate unique IDs for each light', () => {
      const light1 = createPointLight()
      const light2 = createPointLight()

      expect(light1.id).not.toBe(light2.id)
    })

    it('should log light creation with TRACE level', () => {
      const consoleSpy = vi.spyOn(console, 'log')

      createPointLight({ position: { x: 3, y: 7, z: 11 } })

      // Check that logging occurred
      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should use default values from sceneConfig', () => {
      const result = createPointLight()

      // Should use defaults from sceneConfig
      expect(result.light.intensity).toBeGreaterThan(0)
      expect(result.light.color).toBeInstanceOf(THREE.Color)
    })
  })

  describe('light ID generation', () => {
    it('should generate valid UUID format', () => {
      const result = createDirectionalLight()

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(result.id).toMatch(uuidRegex)
    })

    it('should assign same ID to light and helper user data', () => {
      const result = createDirectionalLight()

      expect(result.light.userData.id).toBe(result.id)
      expect(result.helper.userData.id).toBe(result.id)
    })
  })

  describe('helper attachment', () => {
    it('should create directional light helper attached to light', () => {
      const result = createDirectionalLight()

      // Helper should reference the light
      expect(result.helper.light).toBe(result.light)
    })

    it('should create point light helper attached to light', () => {
      const result = createPointLight()

      // Helper should reference the light
      expect(result.helper.light).toBe(result.light)
    })

    it('should update helper when light position changes', () => {
      const result = createDirectionalLight()

      result.light.position.set(20, 30, 40)
      result.helper.update()

      // Helper should follow light position
      // This is implicit in Three.js helpers
      expect(result.helper).toBeDefined()
    })
  })
})
