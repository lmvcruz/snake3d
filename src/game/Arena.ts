import { logger } from '../utils/logger'
import { Position } from './Snake'

export interface ArenaBounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export class Arena {
  private bounds: ArenaBounds
  private floorY = 0
  private wallHeight = 2
  private wallThickness = 0.5

  constructor(bounds: ArenaBounds) {
    this.bounds = { ...bounds }
    logger.info('Arena created', { bounds })
  }

  /**
   * Get the arena boundaries
   */
  getBounds(): ArenaBounds {
    return { ...this.bounds }
  }

  /**
   * Get the floor position
   */
  getFloorPosition(): Position {
    return {
      x: (this.bounds.minX + this.bounds.maxX) / 2,
      y: this.floorY,
      z: (this.bounds.minZ + this.bounds.maxZ) / 2,
    }
  }

  /**
   * Get arena width (X dimension)
   */
  getWidth(): number {
    return this.bounds.maxX - this.bounds.minX
  }

  /**
   * Get arena depth (Z dimension)
   */
  getDepth(): number {
    return this.bounds.maxZ - this.bounds.minZ
  }

  /**
   * Get wall height
   */
  getWallHeight(): number {
    return this.wallHeight
  }

  /**
   * Get wall thickness
   */
  getWallThickness(): number {
    return this.wallThickness
  }

  /**
   * Check if a position collides with any wall
   */
  checkWallCollision(position: Position): boolean {
    const { x, z } = position
    const { minX, maxX, minZ, maxZ } = this.bounds

    const collision = x <= minX || x >= maxX || z <= minZ || z >= maxZ

    if (collision) {
      logger.debug('Wall collision detected', { position, bounds: this.bounds })
    }

    return collision
  }

  /**
   * Check if a position is valid (within arena bounds)
   */
  isPositionValid(position: Position): boolean {
    const { x, z } = position
    const { minX, maxX, minZ, maxZ } = this.bounds

    return x > minX && x < maxX && z > minZ && z < maxZ
  }

  /**
   * Get a random position within the arena (grid-aligned)
   */
  getRandomPosition(): Position {
    // Generate grid-aligned positions (integers)
    const x = Math.floor(Math.random() * (this.bounds.maxX - this.bounds.minX - 2)) + this.bounds.minX + 1
    const z = Math.floor(Math.random() * (this.bounds.maxZ - this.bounds.minZ - 2)) + this.bounds.minZ + 1

    return { x, y: this.floorY, z }
  }

  /**
   * Get a random position excluding specific positions
   */
  getRandomPositionExcluding(excludedPositions: Position[], maxAttempts = 100): Position {
    let attempts = 0

    while (attempts < maxAttempts) {
      const position = this.getRandomPosition()

      // Check if position matches any excluded position
      const isExcluded = excludedPositions.some(
        excluded => excluded.x === position.x && excluded.z === position.z
      )

      if (!isExcluded) {
        return position
      }

      attempts++
    }

    logger.warn('Could not find non-excluded position after max attempts', {
      maxAttempts,
      excludedCount: excludedPositions.length
    })

    // Fallback: return random position anyway
    return this.getRandomPosition()
  }

  /**
   * Get the spawn point for the snake (center of arena)
   */
  getSpawnPoint(): Position {
    return {
      x: 0,
      y: this.floorY,
      z: 0,
    }
  }

  /**
   * Calculate distance between two positions
   */
  getDistance(pos1: Position, pos2: Position): number {
    const dx = pos2.x - pos1.x
    const dy = pos2.y - pos1.y
    const dz = pos2.z - pos1.z

    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  /**
   * Get the playable area (excluding walls)
   */
  getPlayableArea(): number {
    const width = this.getWidth() - 2 // Exclude wall thickness
    const depth = this.getDepth() - 2
    return width * depth
  }
}
