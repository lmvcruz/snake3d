import { describe, it, expect, beforeEach } from 'vitest'
import { Snake, Direction, Position } from './Snake'

describe('Snake', () => {
  let snake: Snake

  beforeEach(() => {
    snake = new Snake({ x: 0, y: 0, z: 0 })
  })

  describe('initialization', () => {
    it('should create a snake with initial position', () => {
      expect(snake.getHeadPosition()).toEqual({ x: 0, y: 0, z: 0 })
    })

    it('should have initial length of 1', () => {
      expect(snake.getLength()).toBe(1)
      expect(snake.getSegments()).toHaveLength(1)
    })

    it('should have initial direction of NORTH', () => {
      expect(snake.getDirection()).toBe(Direction.NORTH)
    })

    it('should have initial velocity of 0', () => {
      expect(snake.getVelocity()).toBe(0)
    })
  })

  describe('direction control', () => {
    it('should change direction to EAST', () => {
      snake.setDirection(Direction.EAST)
      expect(snake.getDirection()).toBe(Direction.EAST)
    })

    it('should change direction to SOUTH', () => {
      snake.setDirection(Direction.SOUTH)
      expect(snake.getDirection()).toBe(Direction.SOUTH)
    })

    it('should change direction to WEST', () => {
      snake.setDirection(Direction.WEST)
      expect(snake.getDirection()).toBe(Direction.WEST)
    })

    it('should allow 180-degree turn (collision will be detected on step)', () => {
      snake.setDirection(Direction.NORTH)
      snake.grow() // Create multi-segment snake
      snake.setDirection(Direction.SOUTH) // Opposite of NORTH - now allowed
      expect(snake.getDirection()).toBe(Direction.SOUTH) // Direction changed
    })

    it('should allow dangerous direction changes (collision detected after step)', () => {
      // Create a snake with length 3 in a line: [(2,0,0), (1,0,0), (0,0,0)] moving EAST
      snake.setDirection(Direction.EAST)
      snake.step(true) // [(1,0,0), (0,0,0)]
      snake.step(true) // [(2,0,0), (1,0,0), (0,0,0)]

      expect(snake.getLength()).toBe(3)
      expect(snake.getSegments()).toEqual([
        { x: 2, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 }
      ])

      // Turn SOUTH
      snake.setDirection(Direction.SOUTH)
      expect(snake.getDirection()).toBe(Direction.SOUTH)

      // Turn WEST - this is allowed, even though it will cause collision
      snake.setDirection(Direction.WEST)
      expect(snake.getDirection()).toBe(Direction.WEST) // Direction changed

      // After stepping, collision is detected
      snake.step() // Head moves to (1,0,0) - collision!
      expect(snake.checkSelfCollision()).toBe(true)
    })

    it('should allow rapid key sequence and detect collision (UP→DOWN→LEFT→RIGHT)', () => {
      // Create snake moving NORTH with length 3: [(0,0,-2), (0,0,-1), (0,0,0)]
      snake.setDirection(Direction.NORTH)
      snake.step(true) // [(0,0,-1), (0,0,0)]
      snake.step(true) // [(0,0,-2), (0,0,-1), (0,0,0)]

      expect(snake.getLength()).toBe(3)

      // 180-degree turn is now allowed
      snake.setDirection(Direction.SOUTH)
      expect(snake.getDirection()).toBe(Direction.SOUTH)

      // Step will cause collision
      snake.step() // Head moves to (0,0,-1) which is occupied!
      expect(snake.checkSelfCollision()).toBe(true)
    })

    it('should allow all direction changes (even with multi-segment snake)', () => {
      // Create multi-segment snake
      snake.setDirection(Direction.EAST)
      snake.step(true)
      snake.step(true)

      expect(snake.getLength()).toBe(3)

      // All direction changes are allowed
      snake.setDirection(Direction.SOUTH)
      expect(snake.getDirection()).toBe(Direction.SOUTH)

      snake.setDirection(Direction.WEST)
      expect(snake.getDirection()).toBe(Direction.WEST)

      snake.setDirection(Direction.NORTH)
      expect(snake.getDirection()).toBe(Direction.NORTH)

      // Even 180-degree turn
      snake.setDirection(Direction.SOUTH)
      expect(snake.getDirection()).toBe(Direction.SOUTH)
    })
  })

  describe('velocity', () => {
    it('should set velocity', () => {
      snake.setVelocity(1.5)
      expect(snake.getVelocity()).toBe(1.5)
    })

    it('should not allow negative velocity', () => {
      snake.setVelocity(-1)
      expect(snake.getVelocity()).toBe(0)
    })
  })

  describe('movement', () => {
    it('should move north by one unit', () => {
      snake.setDirection(Direction.NORTH)
      snake.step()
      expect(snake.getHeadPosition()).toEqual({ x: 0, y: 0, z: -1 })
    })

    it('should move east by one unit', () => {
      snake.setDirection(Direction.EAST)
      snake.step()
      expect(snake.getHeadPosition()).toEqual({ x: 1, y: 0, z: 0 })
    })

    it('should move south by one unit', () => {
      snake.setDirection(Direction.SOUTH)
      snake.step()
      expect(snake.getHeadPosition()).toEqual({ x: 0, y: 0, z: 1 })
    })

    it('should move west by one unit', () => {
      snake.setDirection(Direction.WEST)
      snake.step()
      expect(snake.getHeadPosition()).toEqual({ x: -1, y: 0, z: 0 })
    })

    it('should update all segments when moving', () => {
      snake.grow()
      snake.grow()
      snake.setDirection(Direction.EAST)

      snake.step()
      const segments = snake.getSegments()

      expect(segments).toHaveLength(3)
      expect(segments[0]).toEqual({ x: 1, y: 0, z: 0 }) // head
      expect(segments[1]).toEqual({ x: 0, y: 0, z: 0 }) // body
      expect(segments[2]).toEqual({ x: 0, y: 0, z: 0 }) // tail
    })
  })

  describe('growth', () => {
    it('should grow by one segment', () => {
      const initialLength = snake.getLength()
      snake.grow()
      expect(snake.getLength()).toBe(initialLength + 1)
    })

    it('should add segment at tail position', () => {
      snake.setDirection(Direction.EAST)
      snake.step() // Move to (1, 0, 0)
      snake.grow()

      const segments = snake.getSegments()
      expect(segments).toHaveLength(2)
      expect(segments[0]).toEqual({ x: 1, y: 0, z: 0 }) // head
      expect(segments[1]).toEqual({ x: 0, y: 0, z: 0 }) // new tail segment
    })
  })

  describe('collision detection', () => {
    it('should detect self-collision', () => {
      // Create a longer snake
      snake.grow()
      snake.grow()
      snake.grow()

      // Move east twice
      snake.setDirection(Direction.EAST)
      snake.step() // head at (1, 0, 0)
      snake.step() // head at (2, 0, 0), body includes (1, 0, 0)

      // Move south
      snake.setDirection(Direction.SOUTH)
      snake.step() // head at (2, 0, 1), body includes (2, 0, 0), (1, 0, 0)

      // Move west twice
      snake.setDirection(Direction.WEST)
      snake.step() // head at (1, 0, 1), body includes (2, 0, 1), (2, 0, 0), (1, 0, 0) - collision!
    })

    it('should not detect collision when snake is not overlapping', () => {
      snake.grow()
      snake.grow()
      snake.setDirection(Direction.EAST)
      snake.step()

      expect(snake.checkSelfCollision()).toBe(false)
    })

    it('should detect collision with a position', () => {
      expect(snake.checkCollisionWithPosition({ x: 0, y: 0, z: 0 })).toBe(true)
      expect(snake.checkCollisionWithPosition({ x: 1, y: 0, z: 0 })).toBe(false)
    })
  })

  describe('reset', () => {
    it('should reset snake to initial state', () => {
      snake.grow()
      snake.grow()
      snake.setDirection(Direction.EAST)
      snake.setVelocity(2)
      snake.step()

      const initialPos = { x: 5, y: 0, z: 5 }
      snake.reset(initialPos)

      expect(snake.getLength()).toBe(1)
      expect(snake.getHeadPosition()).toEqual(initialPos)
      expect(snake.getDirection()).toBe(Direction.NORTH)
      expect(snake.getVelocity()).toBe(0)
    })
  })

  describe('getNextHeadPosition', () => {
    it('should return next position without moving snake', () => {
      snake.setDirection(Direction.EAST)
      const currentHead = snake.getHeadPosition()
      const nextHead = snake.getNextHeadPosition()

      // Next position should be one unit to the east
      expect(nextHead).toEqual({ x: currentHead.x + 1, y: 0, z: 0 })

      // Snake should not have moved
      expect(snake.getHeadPosition()).toEqual(currentHead)
    })

    it('should calculate correct next position for all directions', () => {
      const startPos = snake.getHeadPosition()

      snake.setDirection(Direction.NORTH)
      expect(snake.getNextHeadPosition()).toEqual({ ...startPos, z: startPos.z - 1 })

      snake.setDirection(Direction.EAST)
      expect(snake.getNextHeadPosition()).toEqual({ ...startPos, x: startPos.x + 1 })

      snake.setDirection(Direction.SOUTH)
      expect(snake.getNextHeadPosition()).toEqual({ ...startPos, z: startPos.z + 1 })

      snake.setDirection(Direction.WEST)
      expect(snake.getNextHeadPosition()).toEqual({ ...startPos, x: startPos.x - 1 })
    })
  })

  describe('step with growth', () => {
    it('should grow immediately when step(true) is called', () => {
      const initialLength = snake.getLength()

      snake.setDirection(Direction.EAST)
      snake.step(true) // Step with growth

      // Length should increase by 1
      expect(snake.getLength()).toBe(initialLength + 1)

      // Head should have moved
      expect(snake.getHeadPosition()).toEqual({ x: 1, y: 0, z: 0 })
    })

    it('should not remove tail when step(true) is called', () => {
      snake.setDirection(Direction.EAST)
      snake.step() // Normal step to (1, 0, 0)
      snake.grow() // Grow to length 2: [(1,0,0), (0,0,0)]

      const segments = snake.getSegments()
      expect(segments).toEqual([
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 }
      ])

      // Now step with growth
      snake.step(true)

      // Should have 3 segments now
      const newSegments = snake.getSegments()
      expect(newSegments.length).toBe(3)
      expect(newSegments).toEqual([
        { x: 2, y: 0, z: 0 }, // New head
        { x: 1, y: 0, z: 0 }, // Old head
        { x: 0, y: 0, z: 0 }  // Tail kept
      ])
    })

    it('should work correctly with normal step after step(true)', () => {
      snake.setDirection(Direction.EAST)
      snake.step(true) // Grow to length 2

      expect(snake.getLength()).toBe(2)

      snake.step() // Normal step

      // Length should stay at 2
      expect(snake.getLength()).toBe(2)

      const segments = snake.getSegments()
      expect(segments).toEqual([
        { x: 2, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 }
      ])
    })

    it('should handle multiple consecutive step(true) calls', () => {
      snake.setDirection(Direction.EAST)

      snake.step(true) // Length 2
      expect(snake.getLength()).toBe(2)

      snake.step(true) // Length 3
      expect(snake.getLength()).toBe(3)

      snake.step(true) // Length 4
      expect(snake.getLength()).toBe(4)

      const segments = snake.getSegments()
      expect(segments).toEqual([
        { x: 3, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 }
      ])
    })
  })
})
