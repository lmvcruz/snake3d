import * as THREE from 'three'
import { logger } from './logger'

export function toggleWireframe(
  sceneMeshes: THREE.Mesh[],
  snakeMeshes: THREE.Mesh[],
  wireframeEnabledRef: { current: boolean }
): void {
  wireframeEnabledRef.current = !wireframeEnabledRef.current
  const wireframeEnabled = wireframeEnabledRef.current

  // Toggle for scene meshes (walls, floor, decorations, target)
  sceneMeshes.forEach((mesh) => {
    const material = mesh.material as THREE.Material
    if ('wireframe' in material) {
      const stdMat = material as THREE.MeshStandardMaterial
      stdMat.wireframe = wireframeEnabled
      // Make infiniteFloor more visible in wireframe mode
      if (mesh.name === 'infiniteFloor') {
        if (wireframeEnabled) {
          stdMat.color.setHex(0x4a9eff)
          logger.debug(`InfiniteFloor color changed to blue, wireframe: ${stdMat.wireframe}`)
        } else {
          stdMat.color.setHex(0x1a2332)
          logger.debug(`InfiniteFloor color changed to dark, wireframe: ${stdMat.wireframe}`)
        }
      }
      material.needsUpdate = true
    } else if (material.type === 'ShaderMaterial') {
      // For walls with shader material
      const shaderMat = material as THREE.ShaderMaterial
      shaderMat.wireframe = wireframeEnabled
      material.needsUpdate = true
    }
  })

  // Toggle for snake meshes
  snakeMeshes.forEach(mesh => {
    const material = mesh.material as THREE.Material
    if ('wireframe' in material) {
      (material as THREE.MeshStandardMaterial).wireframe = wireframeEnabled
      material.needsUpdate = true
    }
  })

  logger.debug(`Wireframe ${wireframeEnabled ? 'enabled' : 'disabled'}`)
}
