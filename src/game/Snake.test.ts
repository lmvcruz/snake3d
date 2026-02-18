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

    it('should not allow reversing direction (180 degree turn)', () => {
      snake.setDirection(Direction.NORTH)
      snake.grow() // Need at least 2 segments to prevent reversal
      snake.setDirection(Direction.SOUTH) // Opposite of NORTH
      expect(snake.getDirection()).toBe(Direction.NORTH) // Should stay NORTH
    })

    it('should allow 180 turn if snake has only one segment', () => {
      snake.setDirection(Direction.NORTH)
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
})
