import * as THREE from 'three'
import { getDefaultConfig, type DirectionalLightConfig, type PointLightConfig } from '../utils/sceneConfig'
import { logger } from '../utils/logger'

/**
 * Result of creating a directional light
 */
export interface DirectionalLightResult {
  id: string
  light: THREE.DirectionalLight
  helper: THREE.DirectionalLightHelper
}

/**
 * Result of creating a point light
 */
export interface PointLightResult {
  id: string
  light: THREE.PointLight
  helper: THREE.PointLightHelper
}

/**
 * Generate a unique ID using crypto.randomUUID()
 */
function generateLightId(): string {
  return crypto.randomUUID()
}

/**
 * Create a directional light with helper
 * @param config - Optional configuration, uses defaults from sceneConfig if not provided
 * @returns Object containing the light, helper, and unique ID
 */
export function createDirectionalLight(config?: Partial<DirectionalLightConfig>): DirectionalLightResult {
  const defaults = getDefaultConfig().directionalLight
  const {
    color = defaults.color,
    intensity = defaults.intensity,
    position = defaults.position,
    castShadow = defaults.castShadow,
    shadowMapSize = defaults.shadowMapSize,
    shadowCameraNear = defaults.shadowCameraNear,
    shadowCameraFar = defaults.shadowCameraFar,
    helperSize = defaults.helperSize,
    helperVisible = defaults.helperVisible,
  } = config || {}

  logger.trace('Creating directional light', {
    color,
    intensity,
    position,
    castShadow,
    shadowMapSize,
    helperSize,
  })

  // Create the directional light
  const light = new THREE.DirectionalLight(new THREE.Color(color), intensity)
  light.position.set(position.x, position.y, position.z)
  light.castShadow = castShadow

  // Configure shadow properties
  light.shadow.mapSize.width = shadowMapSize
  light.shadow.mapSize.height = shadowMapSize
  light.shadow.camera.near = shadowCameraNear
  light.shadow.camera.far = shadowCameraFar

  // Generate unique ID
  const id = generateLightId()
  light.userData.id = id

  // Create helper
  const helper = new THREE.DirectionalLightHelper(light, helperSize)
  helper.visible = helperVisible
  helper.userData.id = id

  logger.trace('Directional light created', {
    id,
    position: light.position.toArray(),
    intensity,
    castShadow,
  })

  return { id, light, helper }
}

/**
 * Create a point light with helper
 * @param config - Optional configuration, uses defaults from sceneConfig if not provided
 * @returns Object containing the light, helper, and unique ID
 */
export function createPointLight(config?: Partial<PointLightConfig>): PointLightResult {
  const defaults = getDefaultConfig().pointLight
  const {
    color = defaults.color,
    intensity = defaults.intensity,
    position = defaults.position,
    distance = defaults.distance,
    decay = defaults.decay,
    castShadow = defaults.castShadow,
    shadowMapSize = defaults.shadowMapSize,
    shadowCameraNear = defaults.shadowCameraNear,
    shadowCameraFar = defaults.shadowCameraFar,
    helperSize = defaults.helperSize,
    helperVisible = defaults.helperVisible,
  } = config || {}

  logger.trace('Creating point light', {
    color,
    intensity,
    position,
    distance,
    decay,
    castShadow,
    shadowMapSize,
    helperSize,
  })

  // Create the point light
  const light = new THREE.PointLight(new THREE.Color(color), intensity, distance, decay)
  light.position.set(position.x, position.y, position.z)
  light.castShadow = castShadow

  // Configure shadow properties
  light.shadow.mapSize.width = shadowMapSize
  light.shadow.mapSize.height = shadowMapSize
  light.shadow.camera.near = shadowCameraNear
  light.shadow.camera.far = shadowCameraFar

  // Generate unique ID
  const id = generateLightId()
  light.userData.id = id

  // Create helper
  const helper = new THREE.PointLightHelper(light, helperSize)
  helper.visible = helperVisible
  helper.userData.id = id

  logger.trace('Point light created', {
    id,
    position: light.position.toArray(),
    intensity,
    distance,
    decay,
    castShadow,
  })

  return { id, light, helper }
}
