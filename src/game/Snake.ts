import { logger } from '../utils/logger'

export interface Position {
  x: number
  y: number
  z: number
}

export enum Direction {
  NORTH = 'NORTH', // -Z
  EAST = 'EAST',   // +X
  SOUTH = 'SOUTH', // +Z
  WEST = 'WEST',   // -X
}

export class Snake {
  private segments: Position[]
  private direction: Direction
  private velocity: number
  private readonly unitSize = 1
  private previousTailPosition: Position | null = null

  constructor(initialPosition: Position) {
    this.segments = [{ ...initialPosition }]
    this.direction = Direction.NORTH
    this.velocity = 0
    logger.debug('Snake created', { position: initialPosition })
  }

  /**
   * Get the position of the snake's head
   */
  getHeadPosition(): Position {
    return { ...this.segments[0] }
  }

  /**
   * Get all snake segments
   */
  getSegments(): Position[] {
    return this.segments.map(seg => ({ ...seg }))
  }

  /**
   * Get the current direction
   */
  getDirection(): Direction {
    return this.direction
  }

  /**
   * Set the snake's direction
   * Prevents 180-degree turns if snake has more than one segment
   */
  setDirection(newDirection: Direction) {
    // Prevent reversing direction if snake has multiple segments
    if (this.segments.length > 1 && this.isOppositeDirection(newDirection)) {
      logger.warn('Cannot reverse direction', {
        current: this.direction,
        attempted: newDirection
      })
      return
    }

    this.direction = newDirection
    logger.debug('Direction changed', { direction: newDirection })
  }

  /**
   * Check if a direction is opposite to current direction
   */
  private isOppositeDirection(newDirection: Direction): boolean {
    const opposites: Record<Direction, Direction> = {
      [Direction.NORTH]: Direction.SOUTH,
      [Direction.SOUTH]: Direction.NORTH,
      [Direction.EAST]: Direction.WEST,
      [Direction.WEST]: Direction.EAST,
    }
    return opposites[this.direction] === newDirection
  }

  /**
   * Get the current velocity
   */
  getVelocity(): number {
    return this.velocity
  }

  /**
   * Set the snake's velocity
   */
  setVelocity(velocity: number) {
    this.velocity = Math.max(0, velocity) // Ensure non-negative
    logger.debug('Velocity changed', { velocity: this.velocity })
  }

  /**
   * Get the snake's length
   */
  getLength(): number {
    return this.segments.length
  }

  /**
   * Move the snake one step in the current direction
   */
  step() {
    const head = this.segments[0]
    const newHead = this.getNextPosition(head, this.direction)

    // Add new head
    this.segments.unshift(newHead)

    // Store tail position before removing it
    this.previousTailPosition = { ...this.segments[this.segments.length - 1] }

    // Remove tail
    this.segments.pop()

    logger.debug('Snake moved', {
      head: newHead,
      direction: this.direction,
      length: this.segments.length
    })
  }

  /**
   * Calculate the next position based on direction
   */
  private getNextPosition(position: Position, direction: Direction): Position {
    const { x, y, z } = position

    switch (direction) {
      case Direction.NORTH:
        return { x, y, z: z - this.unitSize }
      case Direction.EAST:
        return { x: x + this.unitSize, y, z }
      case Direction.SOUTH:
        return { x, y, z: z + this.unitSize }
      case Direction.WEST:
        return { x: x - this.unitSize, y, z }
      default:
        return { x, y, z }
    }
  }

  /**
   * Grow the snake by one segment
   * Adds a segment at the previous tail position if available
   */
  grow() {
    const newSegment = this.previousTailPosition
      ? { ...this.previousTailPosition }
      : { ...this.segments[this.segments.length - 1] }

    this.segments.push(newSegment)
    logger.info('Snake grew', { length: this.segments.length })
  }

  /**
   * Check if the snake collides with itself
   */
  checkSelfCollision(): boolean {
    const head = this.segments[0]

    // Check if head collides with any body segment (skip index 0)
    for (let i = 1; i < this.segments.length; i++) {
      if (this.positionsEqual(head, this.segments[i])) {
        logger.warn('Self collision detected', { head })
        return true
      }
    }

    return false
  }

  /**
   * Check if the snake collides with a specific position
   */
  checkCollisionWithPosition(position: Position): boolean {
    return this.segments.some(segment => this.positionsEqual(segment, position))
  }

  /**
   * Check if two positions are equal
   */
  private positionsEqual(pos1: Position, pos2: Position): boolean {
    return pos1.x === pos2.x && pos1.y === pos2.y && pos1.z === pos2.z
  }

  /**
   * Reset the snake to a new initial state
   */
  reset(position: Position) {
    this.previousTailPosition = null
    this.segments = [{ ...position }]
    this.direction = Direction.NORTH
    this.velocity = 0
    logger.info('Snake reset', { position })
  }
}
