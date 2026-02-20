import * as THREE from 'three'
import { logger } from '../utils/logger'

/**
 * SelectionManager handles object selection in the scene using raycasting
 */
export class SelectionManager {
  private raycaster: THREE.Raycaster
  private selectedObject: THREE.Object3D | null = null
  private selectionCallback: ((object: THREE.Object3D | null) => void) | null = null

  constructor() {
    this.raycaster = new THREE.Raycaster()
    logger.debug('SelectionManager: Initialized')
  }

  /**
   * Handle click event to select objects in the scene
   */
  handleClick(
    event: MouseEvent,
    camera: THREE.Camera,
    selectableObjects: THREE.Object3D[],
    canvas: HTMLCanvasElement
  ): void {
    // Convert mouse position to normalized device coordinates (-1 to +1)
    const rect = canvas.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    logger.trace('SelectionManager: Mouse click', {
      clientX: event.clientX,
      clientY: event.clientY,
      normalizedX: x,
      normalizedY: y,
    })

    // Update raycaster
    this.raycaster.setFromCamera(new THREE.Vector2(x, y), camera)

    // Find intersections
    const intersects = this.raycaster.intersectObjects(selectableObjects, true)

    if (intersects.length > 0) {
      // Find the first selectable object in the intersection hierarchy
      let objectToSelect: THREE.Object3D | null = null

      for (const intersect of intersects) {
        let current: THREE.Object3D | null = intersect.object

        // Traverse up the hierarchy to find a selectable object
        while (current) {
          if (current.userData.selectable) {
            objectToSelect = current
            break
          }
          current = current.parent
        }

        if (objectToSelect) {
          break
        }
      }

      if (objectToSelect) {
        this.setSelectedObject(objectToSelect)
        return
      }
    }

    // No selectable object found, clear selection
    this.clearSelection()
  }

  /**
   * Set the currently selected object
   */
  setSelectedObject(object: THREE.Object3D | null): void {
    if (this.selectedObject === object) {
      return
    }

    this.selectedObject = object

    if (object) {
      const objectType = object.userData.type || 'unknown'
      const objectId = object.userData.id || 'no-id'

      logger.info('SelectionManager: Object selected', {
        type: objectType,
        id: objectId,
        position: object.position.toArray(),
      })
    } else {
      logger.info('SelectionManager: Selection cleared')
    }

    // Notify callback
    if (this.selectionCallback) {
      this.selectionCallback(object)
    }
  }

  /**
   * Get the currently selected object
   */
  getSelectedObject(): THREE.Object3D | null {
    return this.selectedObject
  }

  /**
   * Clear the current selection
   */
  clearSelection(): void {
    this.setSelectedObject(null)
  }

  /**
   * Register a callback for selection changes
   */
  onSelectionChange(callback: (object: THREE.Object3D | null) => void): void {
    this.selectionCallback = callback
    logger.debug('SelectionManager: Selection callback registered')
  }

  /**
   * Remove the selection callback
   */
  removeSelectionCallback(): void {
    this.selectionCallback = null
    logger.debug('SelectionManager: Selection callback removed')
  }
}
