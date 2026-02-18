import * as THREE from 'three'

/**
 * Simple pseudo-random function for noise generation
 */
function random(x: number, y: number): number {
  const seed = x * 12.9898 + y * 78.233
  return Math.abs(Math.sin(seed) * 43758.5453) % 1
}

/**
 * 2D Perlin-like noise function
 */
function noise(x: number, y: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi

  // Sample grid corners
  const a = random(xi, yi)
  const b = random(xi + 1, yi)
  const c = random(xi, yi + 1)
  const d = random(xi + 1, yi + 1)

  // Smooth interpolation
  const u = xf * xf * (3.0 - 2.0 * xf)
  const v = yf * yf * (3.0 - 2.0 * yf)

  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v
}

/**
 * Fractal Brownian Motion - layered noise for more detail
 */
function fbm(x: number, y: number, octaves: number = 4): number {
  let value = 0
  let amplitude = 0.5
  let frequency = 1

  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise(x * frequency, y * frequency)
    frequency *= 2
    amplitude *= 0.5
  }

  return value
}

/**
 * Creates a normal map texture from Perlin noise
 */
function createPerlinNoiseNormalMap(): THREE.CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.createImageData(size, size)

  const scale = 0.03 // Controls noise frequency (lower = larger features)
  const strength = 8.0 // Controls normal map intensity (higher = more pronounced)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Sample height at neighbors for gradient calculation
      const heightL = fbm((x - 1) * scale, y * scale, 5) // Left
      const heightR = fbm((x + 1) * scale, y * scale, 5) // Right
      const heightD = fbm(x * scale, (y - 1) * scale, 5) // Down
      const heightU = fbm(x * scale, (y + 1) * scale, 5) // Up

      // Calculate gradients
      const dx = (heightR - heightL) * strength
      const dy = (heightU - heightD) * strength

      // Normal vector (cross product of tangent vectors)
      // Tangent X: (1, 0, dx)
      // Tangent Y: (0, 1, dy)
      // Normal: (-dx, -dy, 1) normalized
      const nx = -dx
      const ny = -dy
      const nz = 1
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz)

      // Normalize and convert to 0-255 range
      const normalizedX = ((nx / len) * 0.5 + 0.5) * 255
      const normalizedY = ((ny / len) * 0.5 + 0.5) * 255
      const normalizedZ = ((nz / len) * 0.5 + 0.5) * 255

      const idx = (y * size + x) * 4
      imageData.data[idx] = normalizedX
      imageData.data[idx + 1] = normalizedY
      imageData.data[idx + 2] = normalizedZ
      imageData.data[idx + 3] = 255 // Alpha
    }
  }

  ctx.putImageData(imageData, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

/**
 * Creates a checkerboard texture using Canvas API
 */
function createCheckerboardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  const squareSize = 64 // 8x8 checkerboard
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      ctx.fillStyle = (i + j) % 2 === 0 ? '#3a5a7a' : '#2d4a5c'
      ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

/**
 * Creates the infinite floor mesh that extends beyond the arena
 */
export function createInfiniteFloor(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(200, 80, 100, 50) // Many subdivisions for visible wireframe
  const normalMap = createPerlinNoiseNormalMap()

  const material = new THREE.MeshStandardMaterial({
    color: 0x0b3d2e, // Brighter color to see normal map effect better
    map: normalMap, // Also use as diffuse texture to see the pattern
    normalMap: normalMap,
    normalScale: new THREE.Vector2(2.0, 4.0), // Much stronger normal effect
    side: THREE.DoubleSide,
    roughness: 0.8, // Lower roughness for more visible lighting
    metalness: 0.2,
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = -0.1 // Slightly below arena floor
  mesh.name = 'infiniteFloor' // For debugging

  return mesh
}

/**
 * Creates the arena floor mesh with checkerboard pattern
 */
export function createArenaFloor(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(20, 20)
  const material = new THREE.MeshStandardMaterial({
    map: createCheckerboardTexture(),
    side: THREE.DoubleSide,
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = 0
  mesh.name = 'arenaFloor'

  return mesh
}
