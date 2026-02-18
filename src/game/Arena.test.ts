import { describe, it, expect, beforeEach } from 'vitest'
import { Arena, ArenaBounds } from './Arena'
import { Position } from './Snake'

describe('Arena', () => {
  let arena: Arena
  const bounds: ArenaBounds = {
    minX: -10,
    maxX: 10,
    minZ: -10,
    maxZ: 10,
  }

  beforeEach(() => {
    arena = new Arena(bounds)
  })

  describe('initialization', () => {
    it('should create arena with specified bounds', () => {
      expect(arena.getBounds()).toEqual(bounds)
    })

    it('should have default floor height of 0', () => {
      const floorPos = arena.getFloorPosition()
      expect(floorPos.y).toBe(0)
    })

    it('should calculate correct dimensions', () => {
      expect(arena.getWidth()).toBe(20)
      expect(arena.getDepth()).toBe(20)
    })
  })

  describe('boundary collision detection', () => {
    it('should detect collision with north wall', () => {
      const position: Position = { x: 0, y: 0, z: -10.5 }
      expect(arena.checkWallCollision(position)).toBe(true)
    })

    it('should detect collision with south wall', () => {
      const position: Position = { x: 0, y: 0, z: 10.5 }
      expect(arena.checkWallCollision(position)).toBe(true)
    })

    it('should detect collision with east wall', () => {
      const position: Position = { x: 10.5, y: 0, z: 0 }
      expect(arena.checkWallCollision(position)).toBe(true)
    })

    it('should detect collision with west wall', () => {
      const position: Position = { x: -10.5, y: 0, z: 0 }
      expect(arena.checkWallCollision(position)).toBe(true)
    })

    it('should not detect collision for positions inside arena', () => {
      const position: Position = { x: 0, y: 0, z: 0 }
      expect(arena.checkWallCollision(position)).toBe(false)
    })

    it('should detect collision at exact boundary', () => {
      const position: Position = { x: 10, y: 0, z: 0 }
      expect(arena.checkWallCollision(position)).toBe(true)
    })
  })

  describe('position validation', () => {
    it('should validate position inside arena', () => {
      expect(arena.isPositionValid({ x: 5, y: 0, z: 5 })).toBe(true)
      expect(arena.isPositionValid({ x: 0, y: 0, z: 0 })).toBe(true)
      expect(arena.isPositionValid({ x: -5, y: 0, z: -5 })).toBe(true)
    })

    it('should invalidate position outside arena', () => {
      expect(arena.isPositionValid({ x: 15, y: 0, z: 0 })).toBe(false)
      expect(arena.isPositionValid({ x: 0, y: 0, z: 15 })).toBe(false)
      expect(arena.isPositionValid({ x: -15, y: 0, z: 0 })).toBe(false)
      expect(arena.isPositionValid({ x: 0, y: 0, z: -15 })).toBe(false)
    })
  })

  describe('random position generation', () => {
    it('should generate random position within arena', () => {
      for (let i = 0; i < 100; i++) {
        const pos = arena.getRandomPosition()
        expect(arena.isPositionValid(pos)).toBe(true)
        expect(pos.y).toBe(0) // Should be at floor level
      }
    })

    it('should generate different positions', () => {
      const positions = new Set<string>()
      for (let i = 0; i < 50; i++) {
        const pos = arena.getRandomPosition()
        positions.add(`${pos.x},${pos.z}`)
      }
      // Should have generated some different positions
      expect(positions.size).toBeGreaterThan(10)
    })

    it('should generate grid-aligned positions', () => {
      const pos = arena.getRandomPosition()
      // Positions should be integers (grid-aligned)
      expect(Number.isInteger(pos.x)).toBe(true)
      expect(Number.isInteger(pos.z)).toBe(true)
    })
  })

  describe('wall properties', () => {
    it('should provide wall height', () => {
      expect(arena.getWallHeight()).toBeGreaterThan(0)
    })

    it('should provide wall thickness', () => {
      expect(arena.getWallThickness()).toBeGreaterThan(0)
    })
  })

  describe('spawn points', () => {
    it('should provide a valid spawn point', () => {
      const spawn = arena.getSpawnPoint()
      expect(arena.isPositionValid(spawn)).toBe(true)
    })

    it('should provide spawn point at center by default', () => {
      const spawn = arena.getSpawnPoint()
      expect(spawn.x).toBe(0)
      expect(spawn.z).toBe(0)
      expect(spawn.y).toBe(0)
    })
  })

  describe('distance calculations', () => {
    it('should calculate distance between two positions', () => {
      const pos1: Position = { x: 0, y: 0, z: 0 }
      const pos2: Position = { x: 3, y: 0, z: 4 }

      expect(arena.getDistance(pos1, pos2)).toBe(5) // 3-4-5 triangle
    })

    it('should calculate distance for same position as 0', () => {
      const pos: Position = { x: 5, y: 0, z: 5 }
      expect(arena.getDistance(pos, pos)).toBe(0)
    })
  })

  describe('target generation with exclusion zones', () => {
    it('should generate target position avoiding excluded positions', () => {
      const excludedPositions: Position[] = [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
      ]

      for (let i = 0; i < 20; i++) {
        const target = arena.getRandomPositionExcluding(excludedPositions)

        expect(arena.isPositionValid(target)).toBe(true)

        // Should not match any excluded position
        for (const excluded of excludedPositions) {
          const isExcluded = target.x === excluded.x && target.z === excluded.z
          expect(isExcluded).toBe(false)
        }
      }
    })
  })
})
