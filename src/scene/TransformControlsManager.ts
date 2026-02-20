import * as THREE from 'three'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { logger } from '../utils/logger'

export type TransformMode = 'translate' | 'rotate' | 'scale'

/**
 * TransformControlsManager wraps Three.js TransformControls with additional features:
 * - Mode switching (translate/rotate/scale)
 * - OrbitControls conflict resolution
 * - Event callbacks for transform changes
 * - Logging of transform operations
 */
export class TransformControlsManager {
  private controls: TransformControls
  private orbitControls: OrbitControls | null = null
  private attachedObject: THREE.Object3D | null = null
  private changeCallback: ((object: THREE.Object3D) => void) | null = null
  private objectChangeCallback: ((object: THREE.Object3D) => void) | null = null

  constructor(camera: THREE.Camera, domElement: HTMLElement, scene: THREE.Scene) {
    this.controls = new TransformControls(camera, domElement)
    this.controls.setMode('translate')
    scene.add(this.controls)

    // Listen to TransformControls events
    this.controls.addEventListener('dragging-changed', (event: any) => {
      if (this.orbitControls) {
        this.orbitControls.enabled = !event.value
        logger.debug('TransformControlsManager: OrbitControls toggled', {
          enabled: !event.value,
          dragging: event.value,
        })
      }
    })

    this.controls.addEventListener('change', () => {
      if (this.attachedObject && this.changeCallback) {
        this.changeCallback(this.attachedObject)
      }

      if (this.attachedObject) {
        logger.debug('TransformControlsManager: Transform change', {
          objectId: this.attachedObject.userData.id || 'unknown',
          position: this.attachedObject.position.toArray(),
          rotation: this.attachedObject.rotation.toArray(),
          scale: this.attachedObject.scale.toArray(),
        })
      }
    })

    this.controls.addEventListener('objectChange', () => {
      if (this.attachedObject && this.objectChangeCallback) {
        this.objectChangeCallback(this.attachedObject)
      }

      if (this.attachedObject) {
        logger.debug('TransformControlsManager: Object change complete', {
          objectId: this.attachedObject.userData.id || 'unknown',
        })
      }
    })

    logger.debug('TransformControlsManager: Initialized with translate mode')
  }

  /**
   * Set the transform mode (translate/rotate/scale)
   */
  setMode(mode: TransformMode): void {
    this.controls.setMode(mode)
    logger.debug('TransformControlsManager: Mode changed', { mode })
  }

  /**
   * Get the current transform mode
   */
  getMode(): TransformMode {
    return this.controls.mode as TransformMode
  }

  /**
   * Attach TransformControls to an object
   */
  attach(object: THREE.Object3D): void {
    this.attachedObject = object
    this.controls.attach(object)
    logger.debug('TransformControlsManager: Attached to object', {
      objectId: object.userData.id || 'unknown',
      type: object.userData.type || 'unknown',
    })
  }

  /**
   * Detach TransformControls from current object
   */
  detach(): void {
    if (this.attachedObject) {
      logger.debug('TransformControlsManager: Detached from object', {
        objectId: this.attachedObject.userData.id || 'unknown',
      })
    }
    this.controls.detach()
    this.attachedObject = null
  }

  /**
   * Get the currently attached object
   */
  getAttachedObject(): THREE.Object3D | null {
    return this.attachedObject
  }

  /**
   * Set OrbitControls reference for conflict resolution
   */
  setOrbitControls(controls: OrbitControls): void {
    this.orbitControls = controls
    logger.debug('TransformControlsManager: OrbitControls registered')
  }

  /**
   * Get OrbitControls reference
   */
  getOrbitControls(): OrbitControls | null {
    return this.orbitControls
  }

  /**
   * Manually trigger drag start (disables OrbitControls)
   */
  onDragStart(): void {
    if (this.orbitControls) {
      this.orbitControls.enabled = false
      logger.debug('TransformControlsManager: Drag started, OrbitControls disabled')
    }
  }

  /**
   * Manually trigger drag end (enables OrbitControls)
   */
  onDragEnd(): void {
    if (this.orbitControls) {
      this.orbitControls.enabled = true
      logger.debug('TransformControlsManager: Drag ended, OrbitControls enabled')
    }
  }

  /**
   * Register callback for transform changes (called continuously during drag)
   */
  onTransformChange(callback: (object: THREE.Object3D) => void): void {
    this.changeCallback = callback
  }

  /**
   * Register callback for object changes (called once after drag ends)
   */
  onObjectChange(callback: (object: THREE.Object3D) => void): void {
    this.objectChangeCallback = callback
  }

  /**
   * Get TransformControls visibility
   */
  isVisible(): boolean {
    return this.controls.visible
  }

  /**
   * Set TransformControls visibility
   */
  setVisible(visible: boolean): void {
    this.controls.visible = visible
  }

  /**
   * Get the underlying TransformControls instance
   */
  getTransformControls(): TransformControls {
    return this.controls
  }

  /**
   * Simulate transform change (for testing)
   */
  simulateTransformChange(): void {
    if (this.attachedObject && this.changeCallback) {
      this.changeCallback(this.attachedObject)
    }
  }

  /**
   * Simulate object change (for testing)
   */
  simulateObjectChange(): void {
    if (this.attachedObject && this.objectChangeCallback) {
      this.objectChangeCallback(this.attachedObject)
    }
  }

  /**
   * Dispose TransformControls and remove event listeners
   */
  dispose(): void {
    this.changeCallback = null
    this.objectChangeCallback = null
    this.controls.dispose()
    logger.debug('TransformControlsManager: Disposed')
  }
}
