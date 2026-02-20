import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { logger } from '../utils/logger'

/**
 * OutlineManager handles visual selection feedback using Three.js OutlinePass
 */
export class OutlineManager {
  private composer: EffectComposer
  private outlinePass: OutlinePass
  private renderPass: RenderPass
  private outputPass: OutputPass
  private selectedObjects: THREE.Object3D[] = []
  private pulsing: boolean = false
  private pulseTime: number = 0
  private baseStrength: number = 3.0
  private disposed: boolean = false

  constructor(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
    // Create composer with render pass
    this.composer = new EffectComposer(renderer)

    this.renderPass = new RenderPass(scene, camera)
    this.composer.addPass(this.renderPass)

    // Create outline pass
    const resolution = new THREE.Vector2(
      renderer.domElement.width,
      renderer.domElement.height
    )
    this.outlinePass = new OutlinePass(resolution, scene, camera)

    // Configure outline appearance
    this.outlinePass.edgeStrength = this.baseStrength
    this.outlinePass.edgeGlow = 0.5
    this.outlinePass.edgeThickness = 2.0
    this.outlinePass.pulsePeriod = 0
    this.outlinePass.visibleEdgeColor.set('#ffff00') // Yellow
    this.outlinePass.hiddenEdgeColor.set('#190a05')

    this.composer.addPass(this.outlinePass)

    // Add output pass for correct color output
    this.outputPass = new OutputPass()
    this.composer.addPass(this.outputPass)

    logger.debug('OutlineManager: Initialized', {
      resolution: resolution.toArray(),
      edgeStrength: this.outlinePass.edgeStrength,
      edgeThickness: this.outlinePass.edgeThickness,
    })
  }

  /**
   * Set the selected objects to outline
   */
  setSelectedObjects(objects: THREE.Object3D[]): void {
    this.selectedObjects = objects
    this.outlinePass.selectedObjects = objects

    logger.trace('OutlineManager: Selection updated', {
      count: objects.length,
      objectIds: objects.map(obj => obj.userData.id || 'no-id'),
      objectTypes: objects.map(obj => obj.userData.type || 'unknown'),
    })
  }

  /**
   * Get currently selected objects
   */
  getSelectedObjects(): THREE.Object3D[] {
    return this.selectedObjects
  }

  /**
   * Clear the selection
   */
  clearSelection(): void {
    this.setSelectedObjects([])
    logger.trace('OutlineManager: Selection cleared')
  }

  /**
   * Set the outline color
   */
  setOutlineColor(color: string): void {
    this.outlinePass.visibleEdgeColor.set(color)
    logger.debug('OutlineManager: Outline color changed', { color })
  }

  /**
   * Set the outline thickness
   */
  setOutlineThickness(thickness: number): void {
    this.outlinePass.edgeThickness = thickness
    logger.debug('OutlineManager: Outline thickness changed', { thickness })
  }

  /**
   * Set the outline strength
   */
  setOutlineStrength(strength: number): void {
    this.baseStrength = strength
    this.outlinePass.edgeStrength = strength
    logger.debug('OutlineManager: Outline strength changed', { strength })
  }

  /**
   * Enable or disable pulsing animation
   */
  setPulsing(enabled: boolean): void {
    this.pulsing = enabled
    if (!enabled) {
      this.outlinePass.edgeStrength = this.baseStrength
      this.pulseTime = 0
    }
    logger.debug('OutlineManager: Pulsing toggled', { enabled })
  }

  /**
   * Check if pulsing is enabled
   */
  isPulsing(): boolean {
    return this.pulsing
  }

  /**
   * Update the outline (for animations)
   */
  update(deltaTime: number): void {
    if (this.pulsing && this.selectedObjects.length > 0) {
      this.pulseTime += deltaTime

      // Pulse between baseStrength and baseStrength * 1.5
      const pulse = Math.sin(this.pulseTime * 4) * 0.5 + 0.5
      this.outlinePass.edgeStrength = this.baseStrength + pulse * this.baseStrength * 0.5
    }
  }

  /**
   * Render the scene with outline effect
   */
  render(): void {
    if (this.disposed) {
      return
    }
    this.composer.render()
  }

  /**
   * Get the EffectComposer instance
   */
  getComposer(): EffectComposer {
    return this.composer
  }

  /**
   * Get the OutlinePass instance
   */
  getOutlinePass(): OutlinePass {
    return this.outlinePass
  }

  /**
   * Update the size of the composer
   */
  setSize(width: number, height: number, pixelRatio?: number): void {
    this.composer.setSize(width, height)
    if (pixelRatio !== undefined) {
      this.composer.setPixelRatio(pixelRatio)
    }
    logger.debug('OutlineManager: Size updated', { width, height, pixelRatio })
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.disposed = true
    this.outlinePass.dispose()
    this.renderPass.dispose()
    this.outputPass.dispose()
    logger.debug('OutlineManager: Disposed')
  }
}
