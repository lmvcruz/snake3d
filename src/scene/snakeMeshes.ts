import * as THREE from 'three'
import { Snake } from '../game/Snake'

export class SnakeMeshManager {
  private meshes: THREE.Mesh[] = []
  private scene: THREE.Scene
  private wireframeEnabled: boolean

  constructor(scene: THREE.Scene, wireframeEnabled: boolean = false) {
    this.scene = scene
    this.wireframeEnabled = wireframeEnabled
  }

  update(snake: Snake): void {
    const segments = snake.getSegments()

    // Remove excess meshes
    while (this.meshes.length > segments.length) {
      const mesh = this.meshes.pop()
      if (mesh) this.scene.remove(mesh)
    }

    // Add or update meshes
    segments.forEach((segment, index) => {
      if (index >= this.meshes.length) {
        // Create new mesh
        const geometry = new THREE.SphereGeometry(0.5, 32, 32)
        const material = new THREE.MeshStandardMaterial({
          color: index === 0 ? 0x00ff00 : 0x00cc00,
          wireframe: this.wireframeEnabled
        })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.castShadow = true
        mesh.receiveShadow = true
        this.scene.add(mesh)
        this.meshes.push(mesh)
      }

      // Update position
      const mesh = this.meshes[index]
      mesh.position.set(segment.x, 0.5, segment.z)
    })
  }

  getMeshes(): THREE.Mesh[] {
    return this.meshes
  }

  cleanup(): void {
    this.meshes.forEach(mesh => this.scene.remove(mesh))
    this.meshes = []
  }
}
