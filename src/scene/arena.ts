import * as THREE from 'three'
import { wallVertexShader, wallFragmentShader } from '../shaders/wallShader'

export interface ArenaWallsResult {
  walls: THREE.Mesh[]
  material: THREE.ShaderMaterial
}

export function createArenaWalls(
  ambientLight: THREE.AmbientLight,
  directionalLight: THREE.DirectionalLight
): ArenaWallsResult {
  // Create Perlin-like noise shader for walls
  const wallMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      baseColor: { value: new THREE.Color(0xA0522D) }, // Sienna - warm brown
      noiseScale: { value: 0.3 },
      noiseStrength: { value: 0.4 },
      brightness: { value: 0.25 }, // Control overall brightness of the material
      ambientLightColor: { value: new THREE.Color(0xffffff) },
      ambientLightIntensity: { value: ambientLight.intensity },
      directionalLightColor: { value: new THREE.Color(0xffffff) },
      directionalLightIntensity: { value: directionalLight.intensity },
      directionalLightDirection: { value: directionalLight.position.clone().normalize().negate() }
    },
    vertexShader: wallVertexShader,
    fragmentShader: wallFragmentShader
  })

  const wallHeight = 2
  const wallThickness = 0.5

  // North wall
  const northWall = new THREE.Mesh(
    new THREE.BoxGeometry(20, wallHeight, wallThickness, 32, 16, 1),
    wallMaterial
  )
  northWall.position.set(0, wallHeight / 2, -10)

  // South wall
  const southWall = new THREE.Mesh(
    new THREE.BoxGeometry(20, wallHeight, wallThickness, 32, 16, 1),
    wallMaterial
  )
  southWall.position.set(0, wallHeight / 2, 10)

  // East wall
  const eastWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, 20, 1, 16, 32),
    wallMaterial
  )
  eastWall.position.set(10, wallHeight / 2, 0)

  // West wall
  const westWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, 20, 1, 16, 32),
    wallMaterial
  )
  westWall.position.set(-10, wallHeight / 2, 0)

  return {
    walls: [northWall, southWall, eastWall, westWall],
    material: wallMaterial
  }
}
