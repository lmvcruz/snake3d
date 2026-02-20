import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Snake, Direction, Position } from '../game/Snake'
import { Arena } from '../game/Arena'
import { logger } from '../utils/logger'
import { createInfiniteFloor, createArenaFloor } from '../scene/floors'
import { createArenaWalls } from '../scene/arena'
import { setupLighting } from '../scene/lighting'
import { createDecorativeElements } from '../scene/decorations'
import { toggleWireframe as toggleWireframeUtil } from '../utils/wireframe'
import { SnakeMeshManager } from '../scene/snakeMeshes'
import { loadHDRI, setSolidColorBackground } from '../scene/hdri'
import ControlPanel from './ControlPanel'

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
  const sceneMeshesRef = useRef<THREE.Mesh[]>([]) // For wireframe toggle

  // Material refs for brightness control
  const infiniteFloorMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null)
  const arenaFloorMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null)
  const wallMaterialRef = useRef<THREE.ShaderMaterial | null>(null)
  const decorationMaterialsRef = useRef<THREE.Material[]>([])
  const updateLightingRef = useRef<((params: any) => void) | null>(null)

  // Game timing
  const clockRef = useRef<THREE.Clock>(new THREE.Clock())
  const lastStepTimeRef = useRef<number>(0)

  // Wireframe mode
  const wireframeEnabledRef = useRef<boolean>(false)

  // Use ref for game logic, state only for UI rendering
  const gameOverRef = useRef<boolean>(false)

  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [restartCounter, setRestartCounter] = useState(0)

  // Control panel state
  const [lighting, setLighting] = useState({
    ambientIntensity: 1.6,
    ambientColor: '#ffffff',
    directionalIntensity: 2.6,
    directionalColor: '#ffffff',
  })

  const [brightness, setBrightness] = useState({
    arenaFloor: 0.5,
    arenaWalls: 0.25,
    externalFloor: 0.0,
    decorations: 0.0,
  })

  const [snakeVelocity, setSnakeVelocity] = useState(mode === 'arena' ? 1 : 0)
  const [decorationsQuantity, setDecorationsQuantity] = useState(50)
  const [hdriEnabled, setHdriEnabled] = useState(true)

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

    // Enable soft shadows
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    canvasRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Set initial solid color background
    setSolidColorBackground(scene)

    // Load HDRI environment map (async) if enabled
    if (hdriEnabled) {
      loadHDRI({
        scene,
        backgroundBlurriness: 0.3
      }).catch(err => {
        logger.error('Unexpected error in HDRI loading', { error: err.message })
      })
    }

    // Create floors
    const { mesh: infiniteFloor, material: infiniteFloorMaterial } = createInfiniteFloor()
    infiniteFloor.receiveShadow = true
    scene.add(infiniteFloor)
    sceneMeshesRef.current.push(infiniteFloor)
    infiniteFloorMaterialRef.current = infiniteFloorMaterial

    const { mesh: arenaFloor, material: arenaFloorMaterial } = createArenaFloor()
    arenaFloor.receiveShadow = true
    scene.add(arenaFloor)
    sceneMeshesRef.current.push(arenaFloor)
    arenaFloorMaterialRef.current = arenaFloorMaterial

    // Create temporary lights for wall creation
    const tempAmbientLight = new THREE.AmbientLight(0xffffff, 1.6)
    const tempDirectionalLight = new THREE.DirectionalLight(0xffffff, 2.6)
    tempDirectionalLight.position.set(10, 20, 10)

    // Create arena walls
    const { walls: wallMeshes, material: wallMaterial } = createArenaWalls(tempAmbientLight, tempDirectionalLight)
    wallMeshes.forEach(wall => {
      wall.castShadow = true
      wall.receiveShadow = true
      scene.add(wall)
      sceneMeshesRef.current.push(wall)
    })
    wallMaterialRef.current = wallMaterial

    // Setup lighting (must be after wall creation)
    const { updateLighting } = setupLighting(scene, wallMaterial)
    updateLightingRef.current = updateLighting

    // Create decorative elements
    const { meshes: decorations, materials: decorationMaterials } = createDecorativeElements(decorationsQuantity)
    decorations.forEach(decoration => {
      scene.add(decoration)
      sceneMeshesRef.current.push(decoration)
    })
    decorationMaterialsRef.current = decorationMaterials

    // Initialize snake mesh manager
    const snakeMeshManager = new SnakeMeshManager(scene, wireframeEnabledRef.current)

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
    snake.setVelocity(snakeVelocity)
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
        target.castShadow = true
        target.receiveShadow = true
        scene.add(target)
        targetMeshRef.current = target
        sceneMeshesRef.current.push(target)
      }

      targetMeshRef.current.position.set(targetPos.x, 0.4, targetPos.z)
      logger.debug('Target created', { position: targetPos })
    }
    createTarget()

    // Initial snake mesh update
    snakeMeshManager.update(snake)
    snakeMeshesRef.current = snakeMeshManager.getMeshes()

    // Game step function
    const stepGame = () => {
      if (gameOverRef.current) return

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

      snakeMeshManager.update(snake)
      snakeMeshesRef.current = snakeMeshManager.getMeshes()

      // Check wall collision
      const headPos = snake.getHeadPosition()
      if (arena.checkWallCollision(headPos)) {
        logger.warn('Wall collision detected', { position: headPos })
        gameOverRef.current = true
        setGameOver(true)
        return
      }

      // Check self collision
      if (snake.checkSelfCollision()) {
        logger.warn('Self collision detected')
        gameOverRef.current = true
        setGameOver(true)
        return
      }
    }

    // Keyboard input handler
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle wireframe with 'P' key (works even when game is over)
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        toggleWireframeUtil(sceneMeshesRef.current, snakeMeshesRef.current, wireframeEnabledRef)
        return
      }

      if (gameOverRef.current) return

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

      const elapsed = clock.getElapsedTime()

      // Update wall shader time for animated noise
      wallMeshes.forEach(wall => {
        const material = wall.material as THREE.ShaderMaterial
        if (material.uniforms && material.uniforms.time) {
          material.uniforms.time.value = elapsed
        }
      })

      // In arena mode, step automatically based on velocity
      if (mode === 'arena' && !gameOverRef.current) {
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
      snakeMeshManager.cleanup()
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
  }, [mode, restartCounter, decorationsQuantity, snakeVelocity]) // Re-run when restarting game or decorations quantity changes

  // Handle lighting changes
  useEffect(() => {
    if (updateLightingRef.current) {
      updateLightingRef.current(lighting)
    }
  }, [lighting])

  // Handle brightness changes
  useEffect(() => {
    // Arena floor brightness - use emissive based on original color
    if (arenaFloorMaterialRef.current) {
      // Arena floor has a texture, so use a gray emissive
      const emissiveColor = new THREE.Color(0x888888)
      arenaFloorMaterialRef.current.emissive.copy(emissiveColor)
      arenaFloorMaterialRef.current.emissiveIntensity = brightness.arenaFloor
      arenaFloorMaterialRef.current.needsUpdate = true
    }

    // Arena walls brightness
    if (wallMaterialRef.current && wallMaterialRef.current.uniforms.brightness) {
      wallMaterialRef.current.uniforms.brightness.value = brightness.arenaWalls
    }

    // External floor brightness - use emissive based on its dark green color
    if (infiniteFloorMaterialRef.current) {
      const baseColor = new THREE.Color(0x0b3d2e)
      infiniteFloorMaterialRef.current.emissive.copy(baseColor)
      infiniteFloorMaterialRef.current.emissiveIntensity = brightness.externalFloor
      infiniteFloorMaterialRef.current.needsUpdate = true
    }

    // Decorations brightness - use emissive based on each material's color
    decorationMaterialsRef.current.forEach(material => {
      if (material instanceof THREE.MeshStandardMaterial) {
        // Copy the base color to emissive
        material.emissive.copy(material.color)
        material.emissiveIntensity = brightness.decorations
        material.needsUpdate = true
      }
    })
  }, [brightness])

  // Handle HDRI enable/disable
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    if (hdriEnabled) {
      logger.info('Game: Enabling HDRI')
      loadHDRI({ scene, backgroundBlurriness: 0.3 }).catch(err => {
        logger.error('Game: Failed to enable HDRI', { error: err.message })
      })
    } else {
      logger.info('Game: Disabling HDRI, using solid color')
      setSolidColorBackground(scene)
    }
  }, [hdriEnabled])

  // Handle snake velocity changes
  useEffect(() => {
    if (snakeRef.current) {
      snakeRef.current.setVelocity(snakeVelocity)
    }
  }, [snakeVelocity])

  // Handle lighting control changes
  const handleLightingChange = (newLighting: typeof lighting) => {
    setLighting(newLighting)
  }

  // Handle brightness control changes
  const handleBrightnessChange = (newBrightness: typeof brightness) => {
    setBrightness(newBrightness)
  }

  // Handle snake velocity changes
  const handleSnakeVelocityChange = (velocity: number) => {
    setSnakeVelocity(velocity)
  }

  // Handle decorations quantity changes
  const handleDecorationsQuantityChange = (quantity: number) => {
    setDecorationsQuantity(quantity)
  }

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

      <ControlPanel
        lighting={lighting}
        onLightingChange={handleLightingChange}
        brightness={brightness}
        onBrightnessChange={handleBrightnessChange}
        snakeVelocity={snakeVelocity}
        onSnakeVelocityChange={handleSnakeVelocityChange}
        decorationsQuantity={decorationsQuantity}
        onDecorationsQuantityChange={handleDecorationsQuantityChange}
        hdriEnabled={hdriEnabled}
        onHdriEnabledChange={setHdriEnabled}
      />

      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-panel">
            <h2>Game Over!</h2>
            <p>Final Score: <strong>{score}</strong></p>
            <p>Final Length: <strong>{snakeRef.current?.getLength() || 1}</strong></p>
            <div className="game-over-buttons">
              <button onClick={() => {
                setScore(0)
                setGameOver(false)
                gameOverRef.current = false
                setRestartCounter(prev => prev + 1)
              }}>Play Again</button>
              <button onClick={onBackToMenu}>Back to Menu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Game
