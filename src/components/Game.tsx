import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Snake, Direction, Position } from '../game/Snake'
import { Arena } from '../game/Arena'
import { logger } from '../utils/logger'

interface GameProps {
  mode: 'warmup' | 'arena'
  onBackToMenu: () => void
}

function Game({ mode, onBackToMenu }: GameProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

  // Game state refs
  const snakeRef = useRef<Snake | null>(null)
  const arenaRef = useRef<Arena | null>(null)
  const snakeMeshesRef = useRef<THREE.Mesh[]>([])
  const targetMeshRef = useRef<THREE.Mesh | null>(null)
  const targetPositionRef = useRef<Position | null>(null)

  // Game timing
  const clockRef = useRef<THREE.Clock>(new THREE.Clock())
  const lastStepTimeRef = useRef<number>(0)

  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    sceneRef.current = scene

    // Camera setup (inclined view)
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.set(0, 15, 15)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    canvasRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 20, 10)
    scene.add(directionalLight)

    // Arena floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20)
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d4a5c,
      side: THREE.DoubleSide,
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = 0
    scene.add(floor)

    // Arena walls
    const wallHeight = 2
    const wallThickness = 0.5
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5568 })

    // North wall
    const northWall = new THREE.Mesh(
      new THREE.BoxGeometry(20, wallHeight, wallThickness),
      wallMaterial
    )
    northWall.position.set(0, wallHeight / 2, -10)
    scene.add(northWall)

    // South wall
    const southWall = new THREE.Mesh(
      new THREE.BoxGeometry(20, wallHeight, wallThickness),
      wallMaterial
    )
    southWall.position.set(0, wallHeight / 2, 10)
    scene.add(southWall)

    // East wall
    const eastWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, 20),
      wallMaterial
    )
    eastWall.position.set(10, wallHeight / 2, 0)
    scene.add(eastWall)

    // West wall
    const westWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, 20),
      wallMaterial
    )
    westWall.position.set(-10, wallHeight / 2, 0)
    scene.add(westWall)

    // Initialize Arena
    const arena = new Arena({
      minX: -10,
      maxX: 10,
      minZ: -10,
      maxZ: 10
    })
    arenaRef.current = arena
    logger.info('Arena initialized', { bounds: arena.getBounds() })

    // Initialize Snake at spawn point
    const spawnPoint = arena.getSpawnPoint()
    const snake = new Snake(spawnPoint)
    snake.setVelocity(mode === 'arena' ? 1 : 0)
    snakeRef.current = snake
    logger.info('Snake initialized', { mode, spawnPoint, velocity: snake.getVelocity() })

    // Create initial target
    const createTarget = () => {
      const excludedPositions = snake.getSegments()
      const targetPos = arena.getRandomPositionExcluding(excludedPositions)
      targetPositionRef.current = targetPos

      // Create or update target mesh
      if (!targetMeshRef.current) {
        const targetGeometry = new THREE.SphereGeometry(0.4, 32, 32)
        const targetMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
        const target = new THREE.Mesh(targetGeometry, targetMaterial)
        scene.add(target)
        targetMeshRef.current = target
      }

      targetMeshRef.current.position.set(targetPos.x, 0.4, targetPos.z)
      logger.debug('Target created', { position: targetPos })
    }
    createTarget()

    // Update snake meshes to match snake segments
    const updateSnakeMeshes = () => {
      const segments = snake.getSegments()
      const scene = sceneRef.current
      if (!scene) return

      // Remove excess meshes
      while (snakeMeshesRef.current.length > segments.length) {
        const mesh = snakeMeshesRef.current.pop()
        if (mesh) scene.remove(mesh)
      }

      // Add or update meshes
      segments.forEach((segment, index) => {
        if (index >= snakeMeshesRef.current.length) {
          // Create new mesh
          const geometry = new THREE.SphereGeometry(0.5, 32, 32)
          const material = new THREE.MeshStandardMaterial({
            color: index === 0 ? 0x00ff00 : 0x00cc00
          })
          const mesh = new THREE.Mesh(geometry, material)
          scene.add(mesh)
          snakeMeshesRef.current.push(mesh)
        }

        // Update position
        const mesh = snakeMeshesRef.current[index]
        mesh.position.set(segment.x, 0.5, segment.z)
      })
    }
    updateSnakeMeshes()

    // Game step function
    const stepGame = () => {
      if (gameOver) return

      // Check if next position will collect target BEFORE stepping
      const nextHeadPos = snake.getNextHeadPosition()
      const willCollectTarget = targetPositionRef.current &&
        arena.getDistance(nextHeadPos, targetPositionRef.current) < 0.8

      // Step with growth if collecting target
      if (willCollectTarget) {
        logger.info('Target will be collected', { position: targetPositionRef.current })
        snake.step(true) // Grow immediately (don't remove tail)
        setScore(prev => prev + 10)
        createTarget() // Create new target immediately
      } else {
        snake.step() // Normal step (remove tail)
      }

      updateSnakeMeshes()

      // Check wall collision
      const headPos = snake.getHeadPosition()
      if (arena.checkWallCollision(headPos)) {
        logger.warn('Wall collision detected', { position: headPos })
        setGameOver(true)
        return
      }

      // Check self collision
      if (snake.checkSelfCollision()) {
        logger.warn('Self collision detected')
        setGameOver(true)
        return
      }
    }

    // Keyboard input handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return

      const keyMap: Record<string, Direction> = {
        'ArrowUp': Direction.NORTH,
        'w': Direction.NORTH,
        'W': Direction.NORTH,
        'ArrowRight': Direction.EAST,
        'd': Direction.EAST,
        'D': Direction.EAST,
        'ArrowDown': Direction.SOUTH,
        's': Direction.SOUTH,
        'S': Direction.SOUTH,
        'ArrowLeft': Direction.WEST,
        'a': Direction.WEST,
        'A': Direction.WEST,
      }

      const newDirection = keyMap[e.key]
      if (newDirection) {
        e.preventDefault()
        snake.setDirection(newDirection)

        // Force step on key press to allow manual acceleration
        stepGame()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    // Animation loop
    const clock = clockRef.current
    clock.start()
    let animationId: number

    const animate = () => {
      animationId = requestAnimationFrame(animate)

      // In arena mode, step automatically based on velocity
      if (mode === 'arena' && !gameOver) {
        const elapsed = clock.getElapsedTime()
        const velocity = snake.getVelocity()
        const stepInterval = velocity > 0 ? 1 / velocity : Infinity

        if (elapsed - lastStepTimeRef.current >= stepInterval) {
          stepGame()
          lastStepTimeRef.current = elapsed
        }
      }

      // Rotate target for visual effect
      if (targetMeshRef.current) {
        targetMeshRef.current.rotation.y += 0.02
      }

      renderer.render(scene, camera)
    }
    animate()

    // Handle window resize
    const handleResize = () => {
      if (!camera || !renderer) return
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleKeyDown)
      cancelAnimationFrame(animationId)

      // Clean up snake meshes
      snakeMeshesRef.current.forEach(mesh => scene.remove(mesh))
      snakeMeshesRef.current = []

      // Clean up target mesh
      if (targetMeshRef.current) {
        scene.remove(targetMeshRef.current)
        targetMeshRef.current = null
      }

      if (canvasRef.current && renderer.domElement) {
        canvasRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [mode, gameOver])

  return (
    <div className="game-container">
      <div className="game-hud">
        <div className="game-info">
          <span>Mode: <strong>{mode === 'warmup' ? 'Warm-up' : 'Arena'}</strong></span>
          <span>Score: <strong>{score}</strong></span>
          <span>Length: <strong>{snakeRef.current?.getLength() || 1}</strong></span>
        </div>
        <button className="back-button" onClick={onBackToMenu}>
          ← Back to Menu
        </button>
      </div>
      <div ref={canvasRef} className="canvas-container" />

      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-panel">
            <h2>Game Over!</h2>
            <p>Final Score: <strong>{score}</strong></p>
            <p>Final Length: <strong>{snakeRef.current?.getLength() || 1}</strong></p>
            <div className="game-over-buttons">
              <button onClick={() => window.location.reload()}>Play Again</button>
              <button onClick={onBackToMenu}>Back to Menu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Game
