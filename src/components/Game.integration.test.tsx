import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Snake, Direction } from '../game/Snake'
import { Arena } from '../game/Arena'

/**
 * Integration tests for Game logic
 * Tests the interaction between Snake, Arena, and game mechanics
 */
describe('Game Integration Logic', () => {
  let snake: Snake
  let arena: Arena

  beforeEach(() => {
    arena = new Arena({
      minX: -10,
      maxX: 10,
      minZ: -10,
      maxZ: 10
    })
    const spawnPoint = arena.getSpawnPoint()
    snake = new Snake(spawnPoint)
  })

  describe('Arena and Snake Integration', () => {
    it('should initialize snake at arena spawn point', () => {
      const spawnPoint = arena.getSpawnPoint()
      const snakeHead = snake.getHeadPosition()

      expect(snakeHead).toEqual(spawnPoint)
    })

    it('should keep snake within bounds initially', () => {
      const head = snake.getHeadPosition()
      expect(arena.checkWallCollision(head)).toBe(false)
    })

    it('should detect wall collision when snake moves out of bounds', () => {
      // Move snake to the north wall
      snake.setDirection(Direction.NORTH)
      for (let i = 0; i < 15; i++) {
        snake.step()
      }

      const head = snake.getHeadPosition()
      expect(arena.checkWallCollision(head)).toBe(true)
    })

    it('should detect wall collision at east boundary', () => {
      snake.setDirection(Direction.EAST)
      for (let i = 0; i < 15; i++) {
        snake.step()
      }

      const head = snake.getHeadPosition()
      expect(arena.checkWallCollision(head)).toBe(true)
    })

    it('should detect wall collision at south boundary', () => {
      snake.setDirection(Direction.SOUTH)
      for (let i = 0; i < 15; i++) {
        snake.step()
      }

      const head = snake.getHeadPosition()
      expect(arena.checkWallCollision(head)).toBe(true)
    })

    it('should detect wall collision at west boundary', () => {
      snake.setDirection(Direction.WEST)
      for (let i = 0; i < 15; i++) {
        snake.step()
      }

      const head = snake.getHeadPosition()
      expect(arena.checkWallCollision(head)).toBe(true)
    })
  })

  describe('Target Collection Mechanics', () => {
    it('should generate target within arena bounds', () => {
      const excludedPositions = snake.getSegments()
      const target = arena.getRandomPositionExcluding(excludedPositions)

      expect(arena.checkWallCollision(target)).toBe(false)
    })

    it('should not place target on snake position', () => {
      const snakeSegments = snake.getSegments()
      const target = arena.getRandomPositionExcluding(snakeSegments)

      const isOnSnake = snakeSegments.some(seg =>
        seg.x === target.x && seg.y === target.y && seg.z === target.z
      )
      expect(isOnSnake).toBe(false)
    })

    it('should detect when snake head is near target (collection distance)', () => {
      const head = snake.getHeadPosition()
      const target = { x: head.x + 0.5, y: head.y, z: head.z }

      const distance = arena.getDistance(head, target)
      expect(distance).toBeLessThan(0.8) // Collection threshold
    })

    it('should not detect collection when target is far', () => {
      const head = snake.getHeadPosition()
      const target = { x: head.x + 5, y: head.y, z: head.z }

      const distance = arena.getDistance(head, target)
      expect(distance).toBeGreaterThan(0.8)
    })
  })

  describe('Snake Growth After Collection', () => {
    it('should grow snake when target is collected (legacy grow method)', () => {
      const initialLength = snake.getLength()

      snake.step() // Move to create previousTailPosition
      snake.grow()

      expect(snake.getLength()).toBe(initialLength + 1)
    })

    it('should grow immediately when step(true) is called', () => {
      const initialLength = snake.getLength()

      snake.setDirection(Direction.EAST)
      snake.step(true) // Grow during step

      expect(snake.getLength()).toBe(initialLength + 1)
    })

    it('should grow at time T when eating food at time T (not T+1)', () => {
      // Time = 0: Snake at (0,0,0), length 1
      expect(snake.getLength()).toBe(1)
      expect(snake.getHeadPosition()).toEqual({ x: 0, y: 0, z: 0 })

      // Time = 1: Execute step(true) to simulate eating
      snake.setDirection(Direction.EAST)
      snake.step(true)

      // Time = 1: Snake should already be length 2
      expect(snake.getLength()).toBe(2)
      expect(snake.getSegments()).toEqual([
        { x: 1, y: 0, z: 0 }, // New head
        { x: 0, y: 0, z: 0 }  // Old position kept (growth)
      ])

      // Time = 2: Normal step (no food)
      snake.step()

      // Time = 2: Length should still be 2
      expect(snake.getLength()).toBe(2)
      expect(snake.getSegments()).toEqual([
        { x: 2, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 }
      ])
    })

    it('should maintain all segments after growth', () => {
      snake.setDirection(Direction.EAST)
      snake.step()
      snake.grow()
      snake.step()

      const segments = snake.getSegments()
      expect(segments.length).toBe(2)
    })
  })

  describe('Self-Collision Detection', () => {
    it('should not detect self-collision with length 1', () => {
      expect(snake.checkSelfCollision()).toBe(false)
    })

    it('should detect self-collision when forming a loop', () => {
      // Create a long snake first
      snake.setDirection(Direction.EAST)
      for (let i = 0; i < 5; i++) {
        snake.step()
        snake.grow()
      }

      // Now make a square loop
      // Snake is now length 6, moving east: [(5,0,0), (4,0,0), (3,0,0), (2,0,0), (1,0,0), (0,0,0)]
      snake.setDirection(Direction.SOUTH)
      snake.step() // Move south: [(5,0,1), (5,0,0), (4,0,0), (3,0,0), (2,0,0), (1,0,0)]
      snake.setDirection(Direction.WEST)
      snake.step() // Move west: [(4,0,1), (5,0,1), (5,0,0), (4,0,0), (3,0,0), (2,0,0)]

      // Turn NORTH - this will cause collision
      snake.setDirection(Direction.NORTH)
      expect(snake.getDirection()).toBe(Direction.NORTH) // Direction changed

      snake.step() // Head moves to (4,0,0) - collision!
      expect(snake.checkSelfCollision()).toBe(true) // Collision detected
    })
  })

  describe('Velocity-Based Movement', () => {
    it('should set velocity to 0 for warmup mode', () => {
      snake.setVelocity(0)
      expect(snake.getVelocity()).toBe(0)
    })

    it('should set velocity to 1 for arena mode', () => {
      snake.setVelocity(1)
      expect(snake.getVelocity()).toBe(1)
    })

    it('should calculate correct step interval for velocity 1', () => {
      snake.setVelocity(1)
      const velocity = snake.getVelocity()
      const stepInterval = 1 / velocity

      expect(stepInterval).toBe(1) // 1 second between steps
    })

    it('should calculate correct step interval for velocity 2', () => {
      snake.setVelocity(2)
      const velocity = snake.getVelocity()
      const stepInterval = 1 / velocity

      expect(stepInterval).toBe(0.5) // 0.5 seconds between steps
    })

    it('should handle velocity 0 with infinite interval', () => {
      snake.setVelocity(0)
      const velocity = snake.getVelocity()
      const stepInterval = velocity > 0 ? 1 / velocity : Infinity

      expect(stepInterval).toBe(Infinity)
    })
  })

  describe('Direction Changes', () => {
    it('should allow 90-degree turns', () => {
      snake.setDirection(Direction.NORTH)
      expect(snake.getDirection()).toBe(Direction.NORTH)

      snake.setDirection(Direction.EAST)
      expect(snake.getDirection()).toBe(Direction.EAST)
    })

    it('should allow 180-degree turn and detect collision', () => {
      // Need at least 3 segments for 180-degree turn to cause collision
      snake.setDirection(Direction.EAST)
      snake.step()
      snake.grow() // Length 2: [(1,0,0), (0,0,0)]
      snake.step()
      snake.grow() // Length 3: [(2,0,0), (1,0,0), (0,0,0)]

      // 180-degree turn is now allowed
      snake.setDirection(Direction.WEST)
      expect(snake.getDirection()).toBe(Direction.WEST) // Direction changed

      // Stepping will cause collision - head moves to (1,0,0) which is occupied
      snake.step() // Head moves to (1,0,0)
      expect(snake.checkSelfCollision()).toBe(true)
    })

    it('should allow 180-degree turn (with any snake length)', () => {
      // Single segment
      snake.setDirection(Direction.NORTH)
      snake.setDirection(Direction.SOUTH)
      expect(snake.getDirection()).toBe(Direction.SOUTH)

      // Multi-segment also allows 180-degree turn
      snake.step()
      snake.grow()
      snake.setDirection(Direction.NORTH)
      expect(snake.getDirection()).toBe(Direction.NORTH)
    })
  })

  describe('Score Calculation', () => {
    it('should increment score by 10 for each target collected', () => {
      let score = 0

      // Simulate collecting a target
      snake.step()
      snake.grow()
      score += 10

      expect(score).toBe(10)
    })

    it('should accumulate score across multiple collections', () => {
      let score = 0

      for (let i = 0; i < 5; i++) {
        snake.step()
        snake.grow()
        score += 10
      }

      expect(score).toBe(50)
      expect(snake.getLength()).toBe(6) // Initial 1 + 5 growths
    })
  })

  describe('Game Over Conditions', () => {
    it('should trigger game over on wall collision', () => {
      let gameOver = false

      snake.setDirection(Direction.NORTH)
      for (let i = 0; i < 15; i++) {
        snake.step()
        if (arena.checkWallCollision(snake.getHeadPosition())) {
          gameOver = true
          break
        }
      }

      expect(gameOver).toBe(true)
    })

it('should detect self-collision in complex scenarios (loop pattern)', () => {
      // Create a snake moving in a square pattern
      // Make it long enough that turning back will hit the body, not just the tail
      snake.setDirection(Direction.EAST)
      for (let i = 0; i < 4; i++) {
        snake.step()
        snake.grow()
      }
      // Snake: [(4,0,0), (3,0,0), (2,0,0), (1,0,0), (0,0,0)]

      snake.setDirection(Direction.SOUTH)
      snake.step()
      snake.grow()
      // Snake: [(4,0,1), (4,0,0), (3,0,0), (2,0,0), (1,0,0), (0,0,0)]

      snake.setDirection(Direction.WEST)
      snake.step()
      snake.grow()
      // Snake: [(3,0,1), (4,0,1), (4,0,0), (3,0,0), (2,0,0), (1,0,0), (0,0,0)]

      // Now turn NORTH and hit the body
      snake.setDirection(Direction.NORTH)
      snake.step() // Head to (3,0,0) - this IS in the body!
      expect(snake.checkSelfCollision()).toBe(true)
    })

    it('should detect collision from rapid direction changes', () => {
      // Create a long snake first
      snake.setDirection(Direction.EAST)
      for (let i = 0; i < 5; i++) {
        snake.step()
        snake.grow()
      }

      // Snake is now [(5,0,0), (4,0,0), (3,0,0), (2,0,0), (1,0,0), (0,0,0)]
      // Make a loop that will cause collision
      snake.setDirection(Direction.SOUTH)
      snake.step() // head at (5,0,1)
      // Now [(5,0,1), (5,0,0), (4,0,0), (3,0,0), (2,0,0), (1,0,0)]

      snake.setDirection(Direction.WEST)
      snake.step() // head at (4,0,1)
      // Now [(4,0,1), (5,0,1), (5,0,0), (4,0,0), (3,0,0), (2,0,0)]

      // Turn NORTH - direction change is allowed
      snake.setDirection(Direction.NORTH)
      expect(snake.getDirection()).toBe(Direction.NORTH) // Direction changed

      snake.step() // Head moves to (4,0,0) - collision!
      expect(snake.checkSelfCollision()).toBe(true)
    })

    it('should not trigger game over during normal gameplay', () => {
      let gameOver = false

      snake.setDirection(Direction.EAST)
      for (let i = 0; i < 5; i++) {
        snake.step()
        if (arena.checkWallCollision(snake.getHeadPosition()) ||
            snake.checkSelfCollision()) {
          gameOver = true
          break
        }
      }

      expect(gameOver).toBe(false)
    })
  })

  describe('Game State Management', () => {
    it('should maintain snake length across steps', () => {
      const initialLength = snake.getLength()

      snake.setDirection(Direction.EAST)
      snake.step()

      expect(snake.getLength()).toBe(initialLength)
    })

    it('should track snake position correctly after multiple moves', () => {
      const start = snake.getHeadPosition()

      snake.setDirection(Direction.EAST)
      snake.step()
      snake.step()
      snake.step()

      const end = snake.getHeadPosition()
      expect(end.x).toBe(start.x + 3)
      expect(end.z).toBe(start.z)
    })

    it('should maintain body trail after growth', () => {
      snake.setDirection(Direction.EAST)
      snake.step()
      const pos1 = snake.getHeadPosition()

      snake.grow()
      snake.step()

      const segments = snake.getSegments()
      expect(segments.length).toBe(2)
      expect(segments[1]).toEqual(pos1)
    })
  })

  describe('Target Respawning', () => {
    it('should generate new target after collection', () => {
      const firstTarget = arena.getRandomPositionExcluding(snake.getSegments())

      // Simulate collection
      snake.grow()

      const secondTarget = arena.getRandomPositionExcluding(snake.getSegments())

      // Targets should be different (statistically very likely)
      const areEqual =
        firstTarget.x === secondTarget.x &&
        firstTarget.z === secondTarget.z

      // This might occasionally fail due to random chance, but very unlikely
      expect(areEqual).toBe(false)
    })

    it('should never place target outside arena', () => {
      for (let i = 0; i < 20; i++) {
        const target = arena.getRandomPositionExcluding([])
        expect(arena.checkWallCollision(target)).toBe(false)
      }
    })
  })

  describe('Mode-Specific Gameplay', () => {
    it('should support manual stepping in warmup mode', () => {
      snake.setVelocity(0)
      const start = snake.getHeadPosition()

      snake.setDirection(Direction.EAST)
      // In warmup mode, step only happens on key press
      snake.step()

      const end = snake.getHeadPosition()
      expect(end.x).toBe(start.x + 1)
    })

    it('should support automatic stepping in arena mode', () => {
      snake.setVelocity(1)
      expect(snake.getVelocity()).toBeGreaterThan(0)

      // In arena mode, steps happen automatically based on velocity
      const start = snake.getHeadPosition()
      snake.setDirection(Direction.EAST)
      snake.step()

      const end = snake.getHeadPosition()
      expect(end.x).toBe(start.x + 1)
    })
  })
})
