import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  loadConfig,
  saveConfig,
  resetConfig,
  getDefaultConfig,
  type SceneConfig,
} from './sceneConfig'

describe('sceneConfig', () => {
  let mockStorage: Record<string, string> = {}

  beforeEach(() => {
    // Clear mockStorage by deleting all keys (instead of reassigning)
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])

    // Mock localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      return mockStorage[key] || null
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
      mockStorage[key] = value
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => {
      delete mockStorage[key]
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('hdriEnabled flag', () => {
    it('should include hdriEnabled in default config set to true', () => {
      const config = getDefaultConfig()
      expect(config.hdriEnabled).toBe(true)
    })

    it('should load config with hdriEnabled field', () => {
      const testConfig: SceneConfig = {
        lighting: {
          ambientIntensity: 1.0,
          ambientColor: '#ffffff',
          directionalIntensity: 2.0,
          directionalColor: '#ffffff',
        },
        brightness: {
          arenaFloor: 0.5,
          arenaWalls: 0.25,
          externalFloor: 0.0,
          decorations: 0.0,
        },
        snakeVelocity: 1,
        decorationsQuantity: 50,
        hdriEnabled: false,
      }

      mockStorage['snake3d_scene_config'] = JSON.stringify(testConfig)

      const loaded = loadConfig()
      expect(loaded.hdriEnabled).toBe(false)
    })

    it('should save config with hdriEnabled field', () => {
      const config = getDefaultConfig()
      config.hdriEnabled = false

      saveConfig(config)

      const saved = JSON.parse(mockStorage['snake3d_scene_config'])
      expect(saved.hdriEnabled).toBe(false)
    })

    it('should default hdriEnabled to true for old configs without the field', () => {
      const oldConfig = {
        lighting: {
          ambientIntensity: 1.0,
          ambientColor: '#ffffff',
          directionalIntensity: 2.0,
          directionalColor: '#ffffff',
        },
        brightness: {
          arenaFloor: 0.5,
          arenaWalls: 0.25,
          externalFloor: 0.0,
          decorations: 0.0,
        },
        snakeVelocity: 1,
        decorationsQuantity: 50,
        // hdriEnabled not present
      }

      mockStorage['snake3d_scene_config'] = JSON.stringify(oldConfig)

      const loaded = loadConfig()
      expect(loaded.hdriEnabled).toBe(true)
    })

    it('should reset hdriEnabled to true when resetting config', () => {
      const config = resetConfig()
      expect(config.hdriEnabled).toBe(true)
    })

    it('should persist hdriEnabled across save and load', () => {
      const config = getDefaultConfig()
      config.hdriEnabled = false

      saveConfig(config)
      const loaded = loadConfig()

      expect(loaded.hdriEnabled).toBe(false)
    })
  })

  describe('config management', () => {
    it('should load default config when localStorage is empty', () => {
      const config = loadConfig()
      expect(config.lighting.ambientIntensity).toBe(1.6)
      expect(config.hdriEnabled).toBe(true)
    })

    it('should merge partial configs with defaults', () => {
      const partialConfig = {
        lighting: { ambientIntensity: 2.0 },
      }

      mockStorage['snake3d_scene_config'] = JSON.stringify(partialConfig)

      const loaded = loadConfig()
      expect(loaded.lighting.ambientIntensity).toBe(2.0)
      expect(loaded.lighting.ambientColor).toBe('#ffffff') // from defaults
      expect(loaded.hdriEnabled).toBe(true) // from defaults
    })

    it('should handle corrupted localStorage data gracefully', () => {
      mockStorage['snake3d_scene_config'] = 'invalid json{'

      const config = loadConfig()
      expect(config).toEqual(getDefaultConfig())
    })

    it('should reset to defaults and clear localStorage', () => {
      mockStorage['snake3d_scene_config'] = JSON.stringify({ hdriEnabled: false })

      const config = resetConfig()

      expect(config.hdriEnabled).toBe(true)
      expect(mockStorage['snake3d_scene_config']).toBeUndefined()
    })
  })

  describe('extended config interfaces', () => {
    it('should include snake config with default values', () => {
      const config = getDefaultConfig()
      expect(config.snake).toBeDefined()
      expect(config.snake.head).toEqual({
        color: '#3a9f3a',
        emissive: '#1a4f1a',
        emissiveIntensity: 0.3,
      })
      expect(config.snake.body).toEqual({
        color: '#2d7a2d',
        emissive: '#143f14',
        emissiveIntensity: 0.2,
        segmentSpacing: 1.0,
      })
    })

    it('should include food config with default values', () => {
      const config = getDefaultConfig()
      expect(config.food).toBeDefined()
      expect(config.food).toEqual({
        color: '#ff4444',
        emissive: '#ff0000',
        emissiveIntensity: 0.5,
        scale: 1.0,
      })
    })

    it('should include arena walls config with perlin noise properties', () => {
      const config = getDefaultConfig()
      expect(config.arenaWalls).toBeDefined()
      expect(config.arenaWalls.baseColor).toBeDefined()
      expect(config.arenaWalls.noiseScale).toBe(3.0)
      expect(config.arenaWalls.noiseStrength).toBe(0.15)
      expect(config.arenaWalls.lightColor).toBeDefined()
      expect(config.arenaWalls.darkColor).toBeDefined()
    })

    it('should include external floor config with normal map properties', () => {
      const config = getDefaultConfig()
      expect(config.externalFloor).toBeDefined()
      expect(config.externalFloor.color).toBeDefined()
      expect(config.externalFloor.emissiveIntensity).toBe(0.0)
      expect(config.externalFloor.normalMapIntensity).toBe(0.5)
      expect(config.externalFloor.normalMapScale).toEqual([4, 4])
      expect(config.externalFloor.roughness).toBe(0.8)
      expect(config.externalFloor.metalness).toBe(0.0)
    })

    it('should include extended sky config', () => {
      const config = getDefaultConfig()
      expect(config.sky).toBeDefined()
      expect(config.sky.type).toBe('hdri')
      expect(config.sky.solidColor).toBe('#1a1a2e')
      expect(config.sky.intensity).toBe(1.0)
    })

    it('should save and load extended config fields', () => {
      const config = getDefaultConfig()
      config.snake.head.color = '#00ff00'
      config.food.scale = 1.5
      config.arenaWalls.noiseScale = 5.0
      config.externalFloor.normalMapIntensity = 0.8

      saveConfig(config)
      const loaded = loadConfig()

      expect(loaded.snake.head.color).toBe('#00ff00')
      expect(loaded.food.scale).toBe(1.5)
      expect(loaded.arenaWalls.noiseScale).toBe(5.0)
      expect(loaded.externalFloor.normalMapIntensity).toBe(0.8)
    })

    it('should merge partial extended configs with defaults', () => {
      // Explicitly clear storage before this test
      Object.keys(mockStorage).forEach(key => delete mockStorage[key])

      const partialConfig = {
        snake: {
          head: { color: '#0000ff' },
        },
      }

      mockStorage['snake3d_scene_config'] = JSON.stringify(partialConfig)

      const loaded = loadConfig()
      expect(loaded.snake.head.color).toBe('#0000ff')
      // Should still have other defaults
      expect(loaded.snake.head.emissive).toBe('#1a4f1a')
      expect(loaded.snake.body.color).toBe('#2d7a2d')
      expect(loaded.food.scale).toBe(1.0)
    })
  })
})

