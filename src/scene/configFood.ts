/**
 * Configuration scene food creation
 * Creates visual food representation for scene editor
 */

import * as THREE from 'three'
import { logger } from '../utils/logger'
import { getDefaultConfig } from '../utils/sceneConfig'

export interface ConfigFoodConfig {
  position?: { x: number; y: number; z: number }
  color?: string
  emissive?: string
  emissiveIntensity?: number
  scale?: number
}

/**
 * Create food for configuration scene
 * Uses SphereGeometry with emissive material
 */
export function createConfigFood(config?: ConfigFoodConfig): THREE.Mesh {
  const defaults = getDefaultConfig()
  const foodConfig = defaults.food

  const position = config?.position || { x: 0, y: 0.5, z: 5 }
  const color = config?.color || foodConfig.color
  const emissive = config?.emissive || foodConfig.emissive
  const emissiveIntensity = config?.emissiveIntensity ?? foodConfig.emissiveIntensity
  const scale = config?.scale ?? foodConfig.scale

  logger.trace('Creating config food', {
    position,
    color,
    emissive,
    emissiveIntensity,
    scale,
  })

  const geometry = new THREE.SphereGeometry(0.3, 16, 16)
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    emissive: new THREE.Color(emissive),
    emissiveIntensity,
    roughness: 0.5,
    metalness: 0.3,
  })

  const food = new THREE.Mesh(geometry, material)
  food.position.set(position.x, position.y, position.z)
  food.scale.set(scale, scale, scale)
  food.castShadow = true
  food.receiveShadow = true

  return food
}
