import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import GUI from 'lil-gui'
import { Snake, Direction, Position } from '../game/Snake'
import { Arena } from '../game/Arena'
import { logger } from '../utils/logger'
import { createInfiniteFloor, createArenaFloor } from '../scene/floors'

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

  // Light refs
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null)
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null)
  const guiRef = useRef<GUI | null>(null)

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6)
    scene.add(ambientLight)
    ambientLightRef.current = ambientLight

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.6)
    directionalLight.position.set(10, 20, 10)
    scene.add(directionalLight)
    directionalLightRef.current = directionalLight

    // Create Perlin-like noise shader for walls (before GUI so GUI can reference it)
    const createNoiseWallMaterial = () => {
      return new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          baseColor: { value: new THREE.Color(0xA0522D) }, // Sienna - warm brown
          noiseScale: { value: 0.3 },
          noiseStrength: { value: 0.4 },
          brightness: { value: 0.25 }, // Control overall brightness of the material
          ambientLightColor: { value: new THREE.Color(0xffffff) },
          ambientLightIntensity: { value: ambientLight.intensity },
          directionalLightColor: { value: new THREE.Color(0xffffff) },
          directionalLightIntensity: { value: directionalLight.intensity },
          directionalLightDirection: { value: directionalLight.position.clone().normalize().negate() }
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vWorldPosition;
          varying vec3 vNormal;

          void main() {
            vUv = uv;
            // Transform to world space for consistent 3D noise sampling
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPos.xyz;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform vec3 baseColor;
          uniform float noiseScale;
          uniform float noiseStrength;
          uniform float brightness;
          uniform vec3 ambientLightColor;
          uniform float ambientLightIntensity;
          uniform vec3 directionalLightColor;
          uniform float directionalLightIntensity;
          uniform vec3 directionalLightDirection;

          varying vec2 vUv;
          varying vec3 vWorldPosition;
          varying vec3 vNormal;

          // 3D pseudo-random function
          float random3D(vec3 st) {
            return fract(sin(dot(st.xyz, vec3(12.9898, 78.233, 45.164))) * 43758.5453123);
          }

          // 3D smooth noise for true spatial continuity
          float noise3D(vec3 st) {
            vec3 i = floor(st);
            vec3 f = fract(st);

            // 8 corners of the cube
            float a = random3D(i);
            float b = random3D(i + vec3(1.0, 0.0, 0.0));
            float c = random3D(i + vec3(0.0, 1.0, 0.0));
            float d = random3D(i + vec3(1.0, 1.0, 0.0));
            float e = random3D(i + vec3(0.0, 0.0, 1.0));
            float f2 = random3D(i + vec3(1.0, 0.0, 1.0));
            float g = random3D(i + vec3(0.0, 1.0, 1.0));
            float h = random3D(i + vec3(1.0, 1.0, 1.0));

            // Smooth interpolation
            vec3 u = f * f * (3.0 - 2.0 * f);

            // Trilinear interpolation
            return mix(
              mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
              mix(mix(e, f2, u.x), mix(g, h, u.x), u.y),
              u.z
            );
          }

          // 3D Fractal Brownian Motion
          float fbm3D(vec3 st) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;

            for(int i = 0; i < 4; i++) {
              value += amplitude * noise3D(st * frequency);
              frequency *= 2.0;
              amplitude *= 0.5;
            }
            return value;
          }

          void main() {
            // Sample 3D noise directly from world position
            float n = fbm3D(vWorldPosition * noiseScale);

            // Apply noise to base color
            vec3 materialColor = baseColor + vec3(n * noiseStrength);

            // Calculate lighting
            vec3 normal = normalize(vNormal);

            // Ambient light
            vec3 ambient = ambientLightColor * ambientLightIntensity;

            // Directional light (Lambertian diffuse)
            float diffuseFactor = max(dot(normal, -directionalLightDirection), 0.0);
            vec3 diffuse = directionalLightColor * directionalLightIntensity * diffuseFactor;

            // Combine lighting with material color
            vec3 finalColor = materialColor * (ambient + diffuse) * brightness;

            gl_FragColor = vec4(finalColor, 1.0);
          }
        `
      })
    }

    const wallMaterial = createNoiseWallMaterial()

    // Light controls GUI - hidden by default
    const gui = new GUI({ title: 'Light Controls' })
    gui.hide()
    guiRef.current = gui

    const lightParams = {
      ambientIntensity: ambientLight.intensity,
      ambientColor: ambientLight.color.getHex(),
      directionalIntensity: directionalLight.intensity,
      directionalColor: directionalLight.color.getHex(),
      dirLightX: directionalLight.position.x,
      dirLightY: directionalLight.position.y,
      dirLightZ: directionalLight.position.z,
    }

    const ambientFolder = gui.addFolder('Ambient Light')
    ambientFolder.add(lightParams, 'ambientIntensity', 0, 2, 0.1).onChange((value: number) => {
      ambientLight.intensity = value
      wallMaterial.uniforms.ambientLightIntensity.value = value
    })
    ambientFolder.addColor(lightParams, 'ambientColor').onChange((value: string) => {
      ambientLight.color.set(value)
      wallMaterial.uniforms.ambientLightColor.value.set(value)
    })

    const directionalFolder = gui.addFolder('Directional Light')
    directionalFolder.add(lightParams, 'directionalIntensity', 0, 3, 0.1).onChange((value: number) => {
      directionalLight.intensity = value
      wallMaterial.uniforms.directionalLightIntensity.value = value
    })
    directionalFolder.addColor(lightParams, 'directionalColor').onChange((value: string) => {
      directionalLight.color.set(value)
      wallMaterial.uniforms.directionalLightColor.value.set(value)
    })
    directionalFolder.add(lightParams, 'dirLightX', -30, 30, 1).onChange((value: number) => {
      directionalLight.position.x = value
      wallMaterial.uniforms.directionalLightDirection.value.copy(directionalLight.position).normalize().negate()
    })
    directionalFolder.add(lightParams, 'dirLightY', 0, 50, 1).onChange((value: number) => {
      directionalLight.position.y = value
      wallMaterial.uniforms.directionalLightDirection.value.copy(directionalLight.position).normalize().negate()
    })
    directionalFolder.add(lightParams, 'dirLightZ', -30, 30, 1).onChange((value: number) => {
      directionalLight.position.z = value
      wallMaterial.uniforms.directionalLightDirection.value.copy(directionalLight.position).normalize().negate()
    })

    // Open folders by default
    ambientFolder.open()
    directionalFolder.open()

    // Create floors
    const infiniteFloor = createInfiniteFloor()
    scene.add(infiniteFloor)
    sceneMeshesRef.current.push(infiniteFloor)

    const arenaFloor = createArenaFloor()
    scene.add(arenaFloor)
    sceneMeshesRef.current.push(arenaFloor)

    // Arena walls
    const wallHeight = 2
    const wallThickness = 0.5

    // North wall
    const northWall = new THREE.Mesh(
      new THREE.BoxGeometry(20, wallHeight, wallThickness, 32, 16, 1),
      wallMaterial
    )
    northWall.position.set(0, wallHeight / 2, -10)
    scene.add(northWall)
    sceneMeshesRef.current.push(northWall)

    // South wall
    const southWall = new THREE.Mesh(
      new THREE.BoxGeometry(20, wallHeight, wallThickness, 32, 16, 1),
      wallMaterial
    )
    southWall.position.set(0, wallHeight / 2, 10)
    scene.add(southWall)
    sceneMeshesRef.current.push(southWall)

    // East wall
    const eastWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, 20, 1, 16, 32),
      wallMaterial
    )
    eastWall.position.set(10, wallHeight / 2, 0)
    scene.add(eastWall)
    sceneMeshesRef.current.push(eastWall)

    // West wall
    const westWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, 20, 1, 16, 32),
      wallMaterial
    )
    westWall.position.set(-10, wallHeight / 2, 0)
    scene.add(westWall)
    sceneMeshesRef.current.push(westWall)

    // Store walls for shader animation
    const wallMeshes = [northWall, southWall, eastWall, westWall]

    // Add decorative elements outside the arena
    const addDecorativeElements = () => {
      // Material palette for variety
      const createRockMaterial = () => {
        const materials = [
          // Dark gray rocks
          { color: 0x3d5a6c, roughness: 0.9, metalness: 0.1 },
          // Brown rocks
          { color: 0x6b5442, roughness: 0.95, metalness: 0.05 },
          // Reddish rocks
          { color: 0x7a5745, roughness: 0.85, metalness: 0.1 },
          // Greenish rocks (mossy)
          { color: 0x4a6b52, roughness: 0.9, metalness: 0.05 },
          // Lighter gray rocks
          { color: 0x5a6a7a, roughness: 0.8, metalness: 0.15 },
        ]
        const mat = materials[Math.floor(Math.random() * materials.length)]
        return new THREE.MeshStandardMaterial(mat)
      }

      // Add small rocks/obstacles outside arena - more rocks, further distances
      const rockPositions = [
        // Close ring around arena
        { x: 15, z: 15 }, { x: -15, z: 15 }, { x: 15, z: -15 }, { x: -15, z: -15 },
        { x: 18, z: 0 }, { x: -18, z: 0 }, { x: 0, z: 18 }, { x: 0, z: -18 },
        { x: 12, z: 12 }, { x: -12, z: 12 }, { x: 12, z: -12 }, { x: -12, z: -12 },
        { x: 14, z: -8 }, { x: -14, z: 8 }, { x: 8, z: -14 }, { x: -8, z: 14 },
        // Medium distance rocks
        { x: 22, z: 22 }, { x: -22, z: 22 }, { x: 22, z: -22 }, { x: -22, z: -22 },
        { x: 25, z: 5 }, { x: -25, z: -5 }, { x: 5, z: 25 }, { x: -5, z: -25 },
        { x: 20, z: -15 }, { x: -20, z: 15 }, { x: 15, z: -20 }, { x: -15, z: 20 },
        { x: 23, z: 12 }, { x: -23, z: -12 }, { x: 12, z: 23 }, { x: -12, z: -23 },
        // Far distance rocks
        { x: 30, z: 30 }, { x: -30, z: 30 }, { x: 30, z: -30 }, { x: -30, z: -30 },
        { x: 35, z: 10 }, { x: -35, z: -10 }, { x: 10, z: 35 }, { x: -10, z: -35 },
        { x: 32, z: 0 }, { x: -32, z: 0 }, { x: 0, z: 32 }, { x: 0, z: -32 },
        { x: 28, z: -18 }, { x: -28, z: 18 }, { x: 18, z: -28 }, { x: -18, z: 28 },
        { x: 40, z: 20 }, { x: -40, z: -20 }, { x: 20, z: 40 }, { x: -20, z: -40 },
      ]

      rockPositions.forEach(pos => {
        // Random size and shape for variety
        const size = 0.3 + Math.random() * 0.5
        const geometryType = Math.random()
        let geometry: THREE.BufferGeometry
        let yPosition: number

        if (geometryType > 0.66) {
          // Box geometry
          geometry = new THREE.BoxGeometry(size, size * 0.7, size)
          yPosition = (size * 0.7) / 2 // Half of height to sit on ground
        } else if (geometryType > 0.33) {
          // Cone geometry
          geometry = new THREE.ConeGeometry(size * 0.5, size, 6)
          yPosition = size / 2 // Half of height to sit on ground
        } else {
          // Dodecahedron for more variety
          geometry = new THREE.DodecahedronGeometry(size * 0.5)
          yPosition = size * 0.35
        }

        const rock = new THREE.Mesh(geometry, createRockMaterial())
        rock.position.set(pos.x, yPosition, pos.z)
        rock.rotation.y = Math.random() * Math.PI * 2
        rock.rotation.x = (Math.random() - 0.5) * 0.3 // Slight tilt for realism
        rock.castShadow = true
        scene.add(rock)
        sceneMeshesRef.current.push(rock)
      })

      // Add some flat circular decorations (like puddles or patches)
      const patchPositions = [
        { x: 16, z: -16 }, { x: -16, z: -16 }, { x: 16, z: 16 }, { x: -16, z: 16 },
        { x: 20, z: 10 }, { x: -20, z: -10 }, { x: 10, z: 20 }, { x: -10, z: -20 },
      ]

      patchPositions.forEach(pos => {
        const patchGeometry = new THREE.CircleGeometry(0.6 + Math.random() * 0.4, 16)
        const patchMaterial = new THREE.MeshStandardMaterial({
          color: 0x2a4050,
          roughness: 0.3,
        })
        const patch = new THREE.Mesh(patchGeometry, patchMaterial)
        patch.rotation.x = -Math.PI / 2
        patch.position.set(pos.x, 0.01, pos.z)
        scene.add(patch)
        sceneMeshesRef.current.push(patch)
      })
    }
    addDecorativeElements()

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
        sceneMeshesRef.current.push(target)
      }

      targetMeshRef.current.position.set(targetPos.x, 0.4, targetPos.z)
      logger.debug('Target created', { position: targetPos })
    }
    createTarget()

    // Toggle wireframe mode for all meshes in the scene
    const toggleWireframe = () => {
      wireframeEnabledRef.current = !wireframeEnabledRef.current
      const wireframeEnabled = wireframeEnabledRef.current

      // Toggle for scene meshes (walls, floor, decorations, target)
      sceneMeshesRef.current.forEach((mesh, index) => {
        const material = mesh.material as THREE.Material
        if ('wireframe' in material) {
          const stdMat = material as THREE.MeshStandardMaterial
          stdMat.wireframe = wireframeEnabled
          // Make infiniteFloor more visible in wireframe mode
          if (mesh.name === 'infiniteFloor') {
            if (wireframeEnabled) {
              stdMat.color.setHex(0x4a9eff)
              logger.debug(`InfiniteFloor color changed to blue, wireframe: ${stdMat.wireframe}`)
            } else {
              stdMat.color.setHex(0x1a2332)
              logger.debug(`InfiniteFloor color changed to dark, wireframe: ${stdMat.wireframe}`)
            }
          }
          material.needsUpdate = true
        } else if (material.type === 'ShaderMaterial') {
          // For walls with shader material
          const shaderMat = material as THREE.ShaderMaterial
          shaderMat.wireframe = wireframeEnabled
          material.needsUpdate = true
        }
      })

      // Toggle for snake meshes
      snakeMeshesRef.current.forEach(mesh => {
        const material = mesh.material as THREE.Material
        if ('wireframe' in material) {
          (material as THREE.MeshStandardMaterial).wireframe = wireframeEnabled
          material.needsUpdate = true
        }
      })

      logger.debug(`Wireframe ${wireframeEnabled ? 'enabled' : 'disabled'}`)
    }

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
            color: index === 0 ? 0x00ff00 : 0x00cc00,
            wireframe: wireframeEnabledRef.current
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

      updateSnakeMeshes()

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
        toggleWireframe()
        return
      }

      // Toggle light controls with 'L' key (works even when game is over)
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault()
        if (gui._hidden) {
          gui.show()
        } else {
          gui.hide()
        }
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

      // Clean up GUI
      if (guiRef.current) {
        guiRef.current.destroy()
        guiRef.current = null
      }

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
  }, [mode, restartCounter]) // Re-run when restarting game

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
