import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface GameProps {
  mode: 'warmup' | 'arena'
  onBackToMenu: () => void
}

function Game({ mode, onBackToMenu }: GameProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

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

    // Snake head (single sphere for now)
    const snakeGeometry = new THREE.SphereGeometry(0.5, 32, 32)
    const snakeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    const snakeHead = new THREE.Mesh(snakeGeometry, snakeMaterial)
    snakeHead.position.set(0, 0.5, 0)
    scene.add(snakeHead)

    // Target/Food
    const targetGeometry = new THREE.SphereGeometry(0.4, 32, 32)
    const targetMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
    const target = new THREE.Mesh(targetGeometry, targetMaterial)
    target.position.set(5, 0.4, 5)
    scene.add(target)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)

      // Rotate target for visual effect
      target.rotation.y += 0.02

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
      if (canvasRef.current && renderer.domElement) {
        canvasRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [mode])

  return (
    <div className="game-container">
      <div className="game-hud">
        <div className="game-info">
          <span>Mode: <strong>{mode === 'warmup' ? 'Warm-up' : 'Arena'}</strong></span>
          <span>Score: <strong>0</strong></span>
        </div>
        <button className="back-button" onClick={onBackToMenu}>
          ← Back to Menu
        </button>
      </div>
      <div ref={canvasRef} className="canvas-container" />
    </div>
  )
}

export default Game
