/**
 * Configuration management for lighting and scene parameters
 * Stores config in localStorage and provides load/save functionality
 */

export interface LightingConfig {
  ambientIntensity: number
  ambientColor: string
  directionalIntensity: number
  directionalColor: string
}

export interface BrightnessConfig {
  arenaFloor: number
  arenaWalls: number
  externalFloor: number
  decorations: number
}

export interface SnakeHeadConfig {
  color: string
  emissive: string
  emissiveIntensity: number
}

export interface SnakeBodyConfig {
  color: string
  emissive: string
  emissiveIntensity: number
  segmentSpacing: number
}

export interface SnakeConfig {
  head: SnakeHeadConfig
  body: SnakeBodyConfig
}

export interface FoodConfig {
  color: string
  emissive: string
  emissiveIntensity: number
  scale: number
}

export interface ArenaWallsConfig {
  baseColor: string
  noiseScale: number
  noiseStrength: number
  lightColor: string
  darkColor: string
}

export interface ExternalFloorConfig {
  color: string
  emissiveIntensity: number
  normalMapIntensity: number
  normalMapScale: [number, number]
  roughness: number
  metalness: number
}

export interface SkyConfig {
  type: 'solid' | 'gradient' | 'hdri'
  solidColor: string
  intensity: number
}

export interface DecorationConfig {
  id: string
  geometryType: 'box' | 'sphere' | 'cone' | 'cylinder' | 'torus' | 'dodecahedron' | 'circle'
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
  color: string
  emissiveIntensity: number
  roughness: number
  metalness: number
}

export interface DirectionalLightConfig {
  color: string
  intensity: number
  position: { x: number; y: number; z: number }
  castShadow: boolean
  shadowMapSize: number
  shadowCameraNear: number
  shadowCameraFar: number
  helperSize: number
  helperVisible: boolean
}

export interface PointLightConfig {
  color: string
  intensity: number
  position: { x: number; y: number; z: number }
  distance: number
  decay: number
  castShadow: boolean
  shadowMapSize: number
  shadowCameraNear: number
  shadowCameraFar: number
  helperSize: number
  helperVisible: boolean
}

export interface SceneConfig {
  lighting: LightingConfig
  brightness: BrightnessConfig
  snakeVelocity: number
  decorationsQuantity: number
  decorations: DecorationConfig[]
  hdriEnabled: boolean
  snake: SnakeConfig
  food: FoodConfig
  arenaWalls: ArenaWallsConfig
  externalFloor: ExternalFloorConfig
  sky: SkyConfig
  directionalLight: DirectionalLightConfig
  pointLight: PointLightConfig
}

const CONFIG_STORAGE_KEY = 'snake3d_scene_config'

// Default configuration
const DEFAULT_CONFIG: SceneConfig = {
  lighting: {
    ambientIntensity: 1.6,
    ambientColor: '#ffffff',
    directionalIntensity: 2.6,
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
  decorations: [],
  hdriEnabled: true,
  snake: {
    head: {
      color: '#3a9f3a',
      emissive: '#1a4f1a',
      emissiveIntensity: 0.3,
    },
    body: {
      color: '#2d7a2d',
      emissive: '#143f14',
      emissiveIntensity: 0.2,
      segmentSpacing: 1.0,
    },
  },
  food: {
    color: '#ff4444',
    emissive: '#ff0000',
    emissiveIntensity: 0.5,
    scale: 1.0,
  },
  arenaWalls: {
    baseColor: '#2a2a4a',
    noiseScale: 3.0,
    noiseStrength: 0.15,
    lightColor: '#4a4a6a',
    darkColor: '#1a1a2a',
  },
  externalFloor: {
    color: '#0b3d2e',
    emissiveIntensity: 0.0,
    normalMapIntensity: 0.5,
    normalMapScale: [4, 4],
    roughness: 0.8,
    metalness: 0.0,
  },
  sky: {
    type: 'hdri',
    solidColor: '#1a1a2e',
    intensity: 1.0,
  },
  directionalLight: {
    color: '#ffffff',
    intensity: 2.6,
    position: { x: 10, y: 20, z: 10 },
    castShadow: true,
    shadowMapSize: 2048,
    shadowCameraNear: 0.5,
    shadowCameraFar: 500,
    helperSize: 5,
    helperVisible: true,
  },
  pointLight: {
    color: '#ffffff',
    intensity: 1.5,
    position: { x: 0, y: 10, z: 0 },
    distance: 100,
    decay: 2,
    castShadow: true,
    shadowMapSize: 1024,
    shadowCameraNear: 0.5,
    shadowCameraFar: 100,
    helperSize: 1,
    helperVisible: true,
  },
}

/**
 * Load configuration from localStorage
 * Returns default config if none exists or if loading fails
 */
export function loadConfig(): SceneConfig {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Merge with defaults to handle missing keys in old configs
      return {
        lighting: { ...DEFAULT_CONFIG.lighting, ...parsed.lighting },
        brightness: { ...DEFAULT_CONFIG.brightness, ...parsed.brightness },
        snakeVelocity: parsed.snakeVelocity ?? DEFAULT_CONFIG.snakeVelocity,
        decorationsQuantity: parsed.decorationsQuantity ?? DEFAULT_CONFIG.decorationsQuantity,
        decorations: parsed.decorations ?? DEFAULT_CONFIG.decorations,
        hdriEnabled: parsed.hdriEnabled ?? DEFAULT_CONFIG.hdriEnabled,
        snake: {
          head: { ...DEFAULT_CONFIG.snake.head, ...parsed.snake?.head },
          body: { ...DEFAULT_CONFIG.snake.body, ...parsed.snake?.body },
        },
        food: { ...DEFAULT_CONFIG.food, ...parsed.food },
        arenaWalls: { ...DEFAULT_CONFIG.arenaWalls, ...parsed.arenaWalls },
        externalFloor: { ...DEFAULT_CONFIG.externalFloor, ...parsed.externalFloor },
        sky: { ...DEFAULT_CONFIG.sky, ...parsed.sky },
        directionalLight: { ...DEFAULT_CONFIG.directionalLight, ...parsed.directionalLight },
        pointLight: { ...DEFAULT_CONFIG.pointLight, ...parsed.pointLight },
      }
    }
  } catch (error) {
    console.warn('Failed to load config from localStorage:', error)
  }
  return DEFAULT_CONFIG
}

/**
 * Save configuration to localStorage
 */
export function saveConfig(config: SceneConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config, null, 2))
    console.log('[Config] Saved configuration to localStorage', {
      size: JSON.stringify(config).length,
      fields: {
        decorations: config.decorations.length,
        decorationsQuantity: config.decorationsQuantity,
        lighting: `ambient:${config.lighting.ambientIntensity} directional:${config.lighting.directionalIntensity}`,
        snakeVelocity: config.snakeVelocity,
        hdriEnabled: config.hdriEnabled,
      }
    })
  } catch (error) {
    console.error('Failed to save config to localStorage:', error)
  }
}

/**
 * Reset configuration to defaults
 */
export function resetConfig(): SceneConfig {
  try {
    localStorage.removeItem(CONFIG_STORAGE_KEY)
    console.log('[Config] Reset configuration to defaults')
  } catch (error) {
    console.error('Failed to reset config:', error)
  }
  return DEFAULT_CONFIG
}

/**
 * Export configuration as JSON file
 */
export function exportConfig(config: SceneConfig): void {
  try {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'snake3d-config.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    console.log('[Config] Exported configuration to file')
  } catch (error) {
    console.error('Failed to export config:', error)
  }
}

/**
 * Import configuration from JSON file
 */
export function importConfig(file: File): Promise<SceneConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string)
        // Validate and merge with defaults
        const merged: SceneConfig = {
          lighting: { ...DEFAULT_CONFIG.lighting, ...config.lighting },
          brightness: { ...DEFAULT_CONFIG.brightness, ...config.brightness },
          snakeVelocity: config.snakeVelocity ?? DEFAULT_CONFIG.snakeVelocity,
          decorationsQuantity: config.decorationsQuantity ?? DEFAULT_CONFIG.decorationsQuantity,
          decorations: config.decorations ?? DEFAULT_CONFIG.decorations,
          hdriEnabled: config.hdriEnabled ?? DEFAULT_CONFIG.hdriEnabled,
          snake: {
            head: { ...DEFAULT_CONFIG.snake.head, ...config.snake?.head },
            body: { ...DEFAULT_CONFIG.snake.body, ...config.snake?.body },
          },
          food: { ...DEFAULT_CONFIG.food, ...config.food },
          arenaWalls: { ...DEFAULT_CONFIG.arenaWalls, ...config.arenaWalls },
          externalFloor: { ...DEFAULT_CONFIG.externalFloor, ...config.externalFloor },
          sky: { ...DEFAULT_CONFIG.sky, ...config.sky },
          directionalLight: { ...DEFAULT_CONFIG.directionalLight, ...config.directionalLight },
          pointLight: { ...DEFAULT_CONFIG.pointLight, ...config.pointLight },
        }
        saveConfig(merged)
        console.log('[Config] Imported configuration from file')
        resolve(merged)
      } catch (error) {
        reject(new Error('Invalid configuration file format'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

/**
 * Get default configuration (deep copy to prevent mutations)
 */
export function getDefaultConfig(): SceneConfig {
  return {
    lighting: { ...DEFAULT_CONFIG.lighting },
    brightness: { ...DEFAULT_CONFIG.brightness },
    snakeVelocity: DEFAULT_CONFIG.snakeVelocity,
    decorationsQuantity: DEFAULT_CONFIG.decorationsQuantity,
    decorations: [...DEFAULT_CONFIG.decorations],
    hdriEnabled: DEFAULT_CONFIG.hdriEnabled,
    snake: {
      head: { ...DEFAULT_CONFIG.snake.head },
      body: { ...DEFAULT_CONFIG.snake.body },
    },
    food: { ...DEFAULT_CONFIG.food },
    arenaWalls: { ...DEFAULT_CONFIG.arenaWalls },
    externalFloor: {
      ...DEFAULT_CONFIG.externalFloor,
      normalMapScale: [...DEFAULT_CONFIG.externalFloor.normalMapScale] as [number, number],
    },
    sky: { ...DEFAULT_CONFIG.sky },
    directionalLight: {
      ...DEFAULT_CONFIG.directionalLight,
      position: { ...DEFAULT_CONFIG.directionalLight.position },
    },
    pointLight: {
      ...DEFAULT_CONFIG.pointLight,
      position: { ...DEFAULT_CONFIG.pointLight.position },
    },
  }
}
