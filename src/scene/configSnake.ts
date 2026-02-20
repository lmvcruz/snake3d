/**
 * Configuration scene snake creation
 * Creates visual snake representation for scene editor
 */

import * as THREE from 'three'
import { logger } from '../utils/logger'
import { getDefaultConfig } from '../utils/sceneConfig'

export interface ConfigSnakeConfig {
  headPosition?: { x: number; y: number; z: number }
  segmentSpacing?: number
  headColor?: string
  bodyColor?: string
  headEmissive?: string
  bodyEmissive?: string
  headEmissiveIntensity?: number
  bodyEmissiveIntensity?: number
}

export interface ConfigSnakeResult {
  head: THREE.Mesh
  bodySegments: THREE.Mesh[]
}

/**
 * Create snake for configuration scene
 * Head uses CapsuleGeometry, body segments use SphereGeometry
 */
export function createConfigSnake(config?: ConfigSnakeConfig): ConfigSnakeResult {
  const defaults = getDefaultConfig()
  const snakeConfig = defaults.snake

  const headPosition = config?.headPosition || { x: 0, y: 0.5, z: 0 }
  const segmentSpacing = config?.segmentSpacing ?? snakeConfig.body.segmentSpacing
  const headColor = config?.headColor || snakeConfig.head.color
  const bodyColor = config?.bodyColor || snakeConfig.body.color
  const headEmissive = config?.headEmissive || snakeConfig.head.emissive
  const bodyEmissive = config?.bodyEmissive || snakeConfig.body.emissive
  const headEmissiveIntensity = config?.headEmissiveIntensity ?? snakeConfig.head.emissiveIntensity
  const bodyEmissiveIntensity = config?.bodyEmissiveIntensity ?? snakeConfig.body.emissiveIntensity

  logger.trace('Creating config snake', {
    headPosition,
    segmentSpacing,
    headColor,
    bodyColor,
  })

  // Create head with CapsuleGeometry
  const headGeometry = new THREE.CapsuleGeometry(0.4, 0.6, 8, 16)
  const headMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(headColor),
    emissive: new THREE.Color(headEmissive),
    emissiveIntensity: headEmissiveIntensity,
    roughness: 0.7,
    metalness: 0.2,
  })
  const head = new THREE.Mesh(headGeometry, headMaterial)
  head.position.set(headPosition.x, headPosition.y, headPosition.z)
  head.castShadow = true
  head.receiveShadow = true

  logger.trace('Config snake head created', {
    position: { x: head.position.x, y: head.position.y, z: head.position.z },
  })

  // Create 4 body segments with SphereGeometry
  const bodySegments: THREE.Mesh[] = []
  const bodyGeometry = new THREE.SphereGeometry(0.35, 16, 16)
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(bodyColor),
    emissive: new THREE.Color(bodyEmissive),
    emissiveIntensity: bodyEmissiveIntensity,
    roughness: 0.7,
    metalness: 0.2,
  })

  for (let i = 0; i < 4; i++) {
    const segment = new THREE.Mesh(bodyGeometry, bodyMaterial.clone())
    const zOffset = -(i + 1) * segmentSpacing
    segment.position.set(headPosition.x, headPosition.y, headPosition.z + zOffset)
    segment.castShadow = true
    segment.receiveShadow = true
    bodySegments.push(segment)

    logger.trace('Config snake body segment created', {
      index: i,
      position: { x: segment.position.x, y: segment.position.y, z: segment.position.z },
    })
  }

  return {
    head,
    bodySegments,
  }
}
