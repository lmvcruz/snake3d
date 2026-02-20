import * as THREE from 'three'
import { DecorationConfig } from '../utils/sceneConfig'
import { logger } from '../utils/logger'

function generateRandomPosition(): { x: number; z: number } {
  // Generate positions outside the arena (-10 to 10 on both axes)
  const distance = 12 + Math.random() * 30 // Distance from origin (12 to 42 units)
  const angle = Math.random() * Math.PI * 2 // Random angle

  return {
    x: Math.cos(angle) * distance,
    z: Math.sin(angle) * distance,
  }
}

export interface DecorationsResult {
  meshes: THREE.Mesh[]
  materials: THREE.Material[]
  decorations: DecorationConfig[]
}

/**
 * Create geometry based on decoration config
 */
function createGeometry(config: DecorationConfig): THREE.BufferGeometry {
  const size = config.scale.x // Use x scale as base size

  switch (config.geometryType) {
    case 'box':
      return new THREE.BoxGeometry(config.scale.x, config.scale.y, config.scale.z)
    case 'sphere':
      return new THREE.SphereGeometry(size / 2, 16, 16)
    case 'cone':
      return new THREE.ConeGeometry(size * 0.5, config.scale.y, 6)
    case 'cylinder':
      return new THREE.CylinderGeometry(size * 0.5, size * 0.5, config.scale.y, 8)
    case 'torus':
      return new THREE.TorusGeometry(size * 0.4, size * 0.15, 8, 12)
    case 'dodecahedron':
      return new THREE.DodecahedronGeometry(size * 0.5)
    case 'circle':
      return new THREE.CircleGeometry(size * 0.5, 16)
    default:
      logger.warn('Unknown geometry type, defaulting to box', { type: config.geometryType })
      return new THREE.BoxGeometry(config.scale.x, config.scale.y, config.scale.z)
  }
}

/**
 * Create material from decoration config
 */
function createMaterialFromConfig(config: DecorationConfig): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: config.color,
    emissive: config.color,
    emissiveIntensity: config.emissiveIntensity,
    roughness: config.roughness,
    metalness: config.metalness,
  })
}

/**
 * Create mesh from decoration config
 */
function createMeshFromConfig(config: DecorationConfig): THREE.Mesh {
  const geometry = createGeometry(config)
  const material = createMaterialFromConfig(config)
  const mesh = new THREE.Mesh(geometry, material)

  mesh.position.set(config.position.x, config.position.y, config.position.z)
  mesh.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z)
  mesh.scale.set(1, 1, 1) // Scale is already in geometry
  mesh.castShadow = true
  mesh.receiveShadow = true

  return mesh
}

/**
 * Generate a random decoration config
 */
function generateRandomDecoration(index: number): DecorationConfig {
  const isRock = Math.random() > 0.2 // 80% rocks, 20% patches
  const pos = generateRandomPosition()

  if (isRock) {
    const size = 0.3 + Math.random() * 0.5
    const geometryType = Math.random()
    let geoType: DecorationConfig['geometryType']
    let scale: { x: number; y: number; z: number }
    let yPosition: number

    if (geometryType > 0.66) {
      geoType = 'box'
      scale = { x: size, y: size * 0.7, z: size }
      yPosition = (size * 0.7) / 2
    } else if (geometryType > 0.33) {
      geoType = 'cone'
      scale = { x: size, y: size, z: size }
      yPosition = size / 2
    } else {
      geoType = 'dodecahedron'
      scale = { x: size, y: size, z: size }
      yPosition = size * 0.35
    }

    // Random rock color (dark gray, brown, reddish, greenish, lighter gray)
    const rockColors = ['#3d5a6c', '#6b5442', '#7a5745', '#4a6b52', '#5a6a7a']
    const color = rockColors[Math.floor(Math.random() * rockColors.length)]

    return {
      id: `decoration-${index}`,
      geometryType: geoType,
      position: { x: pos.x, y: yPosition, z: pos.z },
      rotation: {
        x: (Math.random() - 0.5) * 0.3,
        y: Math.random() * Math.PI * 2,
        z: 0
      },
      scale,
      color,
      emissiveIntensity: 0,
      roughness: 0.8 + Math.random() * 0.15,
      metalness: 0.05 + Math.random() * 0.1,
    }
  } else {
    // Patch
    const size = 0.6 + Math.random() * 0.4
    return {
      id: `decoration-${index}`,
      geometryType: 'circle',
      position: { x: pos.x, y: 0.01, z: pos.z },
      rotation: { x: -Math.PI / 2, y: 0, z: 0 },
      scale: { x: size, y: size, z: size },
      color: '#2a4050',
      emissiveIntensity: 0,
      roughness: 0.3,
      metalness: 0,
    }
  }
}

/**
 * Creates decorative elements with dynamic quantity and deterministic positioning
 * @param quantity Number of decorations to create
 * @param existingDecorations Optional array of existing decoration configs to recreate
 * @returns Object containing meshes, materials, and decoration configs
 */
export function createDecorativeElements(
  quantity: number = 50,
  existingDecorations: DecorationConfig[] = []
): DecorationsResult {
  const decorations: DecorationConfig[] = []
  const meshes: THREE.Mesh[] = []
  const materials: THREE.Material[] = []

  logger.debug('Creating decorative elements', {
    quantity,
    existingCount: existingDecorations.length
  })

  // First, recreate existing decorations
  existingDecorations.forEach((config, index) => {
    if (index < quantity) {
      const mesh = createMeshFromConfig(config)
      meshes.push(mesh)
      materials.push(mesh.material as THREE.Material)
      decorations.push(config)
    }
  })

  // If quantity > existing, generate new random decorations
  const additionalCount = quantity - existingDecorations.length
  if (additionalCount > 0) {
    logger.debug('Generating additional decorations', { count: additionalCount })

    for (let i = 0; i < additionalCount; i++) {
      const config = generateRandomDecoration(existingDecorations.length + i)
      const mesh = createMeshFromConfig(config)

      meshes.push(mesh)
      materials.push(mesh.material as THREE.Material)
      decorations.push(config)
    }
  }

  logger.info('Decorations created', {
    total: meshes.length,
    recreated: Math.min(existingDecorations.length, quantity),
    newlyGenerated: Math.max(0, additionalCount)
  })

  return { meshes, materials, decorations }
}
