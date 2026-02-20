import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createInfiniteFloor, createArenaFloor } from '../scene/floors'
import { createArenaWalls } from '../scene/arena'
import { setupLighting } from '../scene/lighting'
import { createDecorativeElements } from '../scene/decorations'
import { loadConfig, saveConfig, getDefaultConfig, type SceneConfig, type DecorationConfig } from '../utils/sceneConfig'
import { loadHDRI, setSolidColorBackground } from '../scene/hdri'
import { createConfigSnake } from '../scene/configSnake'
import { createConfigFood } from '../scene/configFood'
import { createDirectionalLight, createPointLight, type DirectionalLightResult, type PointLightResult } from '../scene/lights'
import { SelectionManager } from '../scene/SelectionManager'
import { TransformControlsManager, type TransformMode } from '../scene/TransformControlsManager'
import { OutlineManager } from '../scene/OutlineManager'
import { logger } from '../utils/logger'
import ControlPanel from './ControlPanel'
import { type TreeNode } from './ObjectTree'
import './ConfigMode.css'

interface ConfigModeProps {
  onBackToMenu: () => void
}

function ConfigMode({ onBackToMenu }: ConfigModeProps) {
  const overviewCanvasRef = useRef<HTMLDivElement>(null)
  const renderCanvasRef = useRef<HTMLDivElement>(null)

  const [error, setError] = useState<string | null>(null)

  // Overview scene (with helpers and controls)
  const overviewSceneRef = useRef<THREE.Scene | null>(null)
  const overviewCameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const overviewRendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const overviewControlsRef = useRef<OrbitControls | null>(null)

  // Render scene (actual game view)
  const renderSceneRef = useRef<THREE.Scene | null>(null)
  const renderCameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const renderRendererRef = useRef<THREE.WebGLRenderer | null>(null)

  // Material refs for brightness control
  const infiniteFloorMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null)
  const arenaFloorMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null)
  const wallMaterialRef = useRef<THREE.ShaderMaterial | null>(null)
  const decorationMaterialsRef = useRef<THREE.Material[]>([])
  const decorationConfigsRef = useRef<DecorationConfig[]>([])
  const updateLightingRef = useRef<((params: any) => void) | null>(null)

  // Light refs for helpers
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null)
  const hemisphereLightRef = useRef<THREE.HemisphereLight | null>(null)
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null)

  // Snake and food refs
  const snakeHeadRef = useRef<THREE.Mesh | null>(null)
  const snakeBodySegmentsRef = useRef<THREE.Mesh[]>([])
  const foodRef = useRef<THREE.Mesh | null>(null)

  // Custom lights (user-added via UI)
  const customLightsRef = useRef<Array<DirectionalLightResult | PointLightResult>>([])

  // Decoration meshes for dynamic updates
  const decorationMeshesRef = useRef<{ render: THREE.Mesh[], overview: THREE.Mesh[] }>({ render: [], overview: [] })

  // Selection manager
  const selectionManagerRef = useRef<SelectionManager | null>(null)
  const selectableObjectsRef = useRef<THREE.Object3D[]>([])

  // Transform controls manager
  const transformManagerRef = useRef<TransformControlsManager | null>(null)

  // Outline manager for selection feedback
  const outlineManagerRef = useRef<OutlineManager | null>(null)

  // Load saved configuration
  const savedConfig = loadConfig()

  // Control panel state - initialized from saved config
  const [lighting, setLighting] = useState(savedConfig.lighting)
  const [brightness, setBrightness] = useState(savedConfig.brightness)
  const [snakeVelocity, setSnakeVelocity] = useState(savedConfig.snakeVelocity)
  const [decorationsQuantity, setDecorationsQuantity] = useState(savedConfig.decorationsQuantity)
  const [hdriEnabled, setHdriEnabled] = useState(savedConfig.hdriEnabled)
  // Removed unused customLights state - lights are managed via refs
  const [transformMode, setTransformMode] = useState<TransformMode>('translate')
  const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(null)
  const [objectTreeNodes, setObjectTreeNodes] = useState<TreeNode[]>([])

  // New material and appearance configs
  const [arenaWalls, setArenaWalls] = useState(savedConfig.arenaWalls)
  const [externalFloor, setExternalFloor] = useState(savedConfig.externalFloor)
  const [snake, setSnake] = useState(savedConfig.snake)
  const [food, setFood] = useState(savedConfig.food)
  const [sky, setSky] = useState(savedConfig.sky)

  // Initialize scenes
  useEffect(() => {
    if (!overviewCanvasRef.current || !renderCanvasRef.current) return

    // Prevent double initialization - check if OrbitControls already exists
    if (overviewControlsRef.current) {
      console.log('[ConfigMode] OrbitControls already exists, skipping initialization')
      return
    }

    console.log('[ConfigMode] Starting initialization...')

    try {
      console.log('[ConfigMode] Creating overview scene...')
      // ===== OVERVIEW SCENE WITH HELPERS =====
      const overviewScene = new THREE.Scene()
      overviewScene.background = new THREE.Color(0x1a1a2e)
      overviewSceneRef.current = overviewScene

    const overviewCamera = new THREE.PerspectiveCamera(
      60,
      1, // Will be updated on resize
      0.1,
      1000
    )
    overviewCamera.position.set(30, 40, 30)
    overviewCamera.lookAt(0, 0, 0)
    overviewCameraRef.current = overviewCamera

    const overviewRenderer = new THREE.WebGLRenderer({ antialias: true })
    overviewRenderer.setPixelRatio(window.devicePixelRatio)
    overviewRenderer.shadowMap.enabled = true
    overviewRenderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Set initial size before appending
    const initialOverviewWidth = overviewCanvasRef.current.clientWidth || 800
    const initialOverviewHeight = overviewCanvasRef.current.clientHeight || 600
    overviewRenderer.setSize(initialOverviewWidth, initialOverviewHeight)
    overviewCamera.aspect = initialOverviewWidth / initialOverviewHeight
    overviewCamera.updateProjectionMatrix()

    const canvas = overviewRenderer.domElement
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.touchAction = 'none'

    overviewCanvasRef.current.appendChild(canvas)
    overviewRendererRef.current = overviewRenderer

    // Initialize OutlineManager for selection feedback
    const outlineManager = new OutlineManager(overviewScene, overviewCamera, overviewRenderer)
    outlineManagerRef.current = outlineManager
    logger.info('ConfigMode: OutlineManager initialized')

    // Ensure canvas is fully ready
    console.log('[ConfigMode] Canvas attached, dimensions:', canvas.clientWidth, 'x', canvas.clientHeight)
    console.log('[ConfigMode] Canvas offset:', canvas.offsetWidth, 'x', canvas.offsetHeight)
    console.log('[ConfigMode] Canvas === renderer.domElement:', canvas === overviewRenderer.domElement)
    console.log('[ConfigMode] Canvas parent:', canvas.parentElement)

    // Add OrbitControls to overview - pass canvas directly
    console.log('[ConfigMode] Creating OrbitControls with camera and canvas...')
    const controls = new OrbitControls(overviewCamera, canvas)
    console.log('[ConfigMode] OrbitControls constructor completed')
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 10
    controls.maxDistance = 100
    controls.enablePan = true
    controls.enableZoom = true
    controls.enableRotate = true

    overviewControlsRef.current = controls
    console.log('[ConfigMode] OrbitControls created successfully')

    // ===== RENDER SCENE (ACTUAL GAME VIEW) =====
    const renderScene = new THREE.Scene()
    renderScene.background = new THREE.Color(0x1a1a2e)
    renderSceneRef.current = renderScene

    const renderCamera = new THREE.PerspectiveCamera(
      75,
      1, // Will be updated on resize
      0.1,
      1000
    )
    renderCamera.position.set(0, 15, 15)
    renderCamera.lookAt(0, 0, 0)
    renderCameraRef.current = renderCamera

    const renderRenderer = new THREE.WebGLRenderer({ antialias: true })
    renderRenderer.setPixelRatio(window.devicePixelRatio)
    renderRenderer.shadowMap.enabled = true
    renderRenderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Set initial size before appending
    const initialRenderWidth = renderCanvasRef.current.clientWidth || 800
    const initialRenderHeight = renderCanvasRef.current.clientHeight || 600
    renderRenderer.setSize(initialRenderWidth, initialRenderHeight)
    renderCamera.aspect = initialRenderWidth / initialRenderHeight
    renderCamera.updateProjectionMatrix()

    renderCanvasRef.current.appendChild(renderRenderer.domElement)
    renderRendererRef.current = renderRenderer

    // Set initial solid color backgrounds
    setSolidColorBackground(renderScene)
    setSolidColorBackground(overviewScene)

    // Load HDRI environment map (async) - applies to both scenes if enabled
    if (savedConfig.hdriEnabled) {
      logger.info('ConfigMode: Initializing HDRI for both scenes', {
        baseUrl: import.meta.env.BASE_URL,
        mode: import.meta.env.MODE,
        origin: window.location.origin
      })
      Promise.all([
        loadHDRI({
          scene: renderScene,
          backgroundBlurriness: 0.3,
          onError: (err) => {
            logger.warn('ConfigMode: Render scene HDRI load failed', {
              error: err.message,
              willUseFallback: true
            })
          }
        }),
        loadHDRI({
          scene: overviewScene,
          backgroundBlurriness: 0.3,
          onError: (err) => {
            logger.warn('ConfigMode: Overview scene HDRI load failed', {
              error: err.message,
              willUseFallback: true
            })
          }
        })
      ]).then(() => {
        logger.info('ConfigMode: HDRI loading completed (success or fallback)')
      }).catch(err => {
        logger.error('ConfigMode: Unexpected error in HDRI Promise.all', {
          error: err?.message || String(err),
          type: err?.constructor?.name
        })
      })
    } else {
      logger.info('ConfigMode: HDRI disabled, using solid color background')
    }

    // ===== CREATE SCENE ELEMENTS =====
    logger.debug('ConfigMode: Creating scene elements')

    // Create temporary lights for arena walls initialization
    const tempAmbient = new THREE.AmbientLight(0xffffff, 1.6)
    const tempDirectional = new THREE.DirectionalLight(0xffffff, 2.6)
    tempDirectional.position.set(10, 20, 10)

    console.log('[ConfigMode] Creating floors...')
    // Infinite floor
    const { mesh: infiniteFloorMesh, material: infiniteFloorMaterial } = createInfiniteFloor()
    infiniteFloorMesh.receiveShadow = true
    infiniteFloorMaterialRef.current = infiniteFloorMaterial
    renderScene.add(infiniteFloorMesh)

    // Clone for overview scene - make it selectable for material editing
    const infiniteFloorClone = infiniteFloorMesh.clone()
    infiniteFloorClone.userData.selectable = true
    infiniteFloorClone.userData.transformable = false // Material-only
    infiniteFloorClone.userData.type = 'external-floor'
    infiniteFloorClone.userData.id = 'external-floor'
    overviewScene.add(infiniteFloorClone)

    // Arena floor
    const { mesh: arenaFloorMesh, material: arenaFloorMaterial } = createArenaFloor()
    arenaFloorMesh.receiveShadow = true
    arenaFloorMaterialRef.current = arenaFloorMaterial
    renderScene.add(arenaFloorMesh)
    overviewScene.add(arenaFloorMesh.clone())

    console.log('[ConfigMode] Creating arena walls...')
    // Arena walls
    const { walls: wallMeshes, material: wallMaterial } = createArenaWalls(tempAmbient, tempDirectional)
    wallMaterialRef.current = wallMaterial
    wallMeshes.forEach(wall => {
      wall.castShadow = true
      wall.receiveShadow = true
      renderScene.add(wall)
      overviewScene.add(wall.clone())
    })

    console.log('[ConfigMode] Creating decorations...')
    // Decorations - will be updated by separate effect
    const { meshes: decorationMeshes, materials: decorationMaterials, decorations: decorationConfigs } = createDecorativeElements(
      decorationsQuantity,
      savedConfig.decorations
    )
    const selectableDecorations: THREE.Object3D[] = []
    const renderDecorations: THREE.Mesh[] = []
    const overviewDecorations: THREE.Mesh[] = []

    decorationMeshes.forEach((decoration, index) => {
      decoration.castShadow = true
      decoration.receiveShadow = true

      // Mark decoration as selectable and transformable
      const decorationClone = decoration.clone()
      decorationClone.userData.selectable = true
      decorationClone.userData.transformable = true // Can be moved/rotated/scaled
      decorationClone.userData.type = 'decoration'
      decorationClone.userData.id = `decoration-${index}`

      renderScene.add(decoration)
      overviewScene.add(decorationClone)
      renderDecorations.push(decoration)
      overviewDecorations.push(decorationClone)
      selectableDecorations.push(decorationClone)
    })

    decorationMeshesRef.current = { render: renderDecorations, overview: overviewDecorations }
    decorationMaterialsRef.current = decorationMaterials
    decorationConfigsRef.current = decorationConfigs

    console.log('[ConfigMode] Creating snake...')
    // Snake
    const { head: snakeHead, bodySegments: snakeBodySegments } = createConfigSnake()
    snakeHeadRef.current = snakeHead
    snakeBodySegmentsRef.current = snakeBodySegments

    // Add snake to both scenes
    const snakeHeadClone = snakeHead.clone()
    snakeHeadClone.userData.selectable = true
    snakeHeadClone.userData.transformable = false // Material-only, no transform
    snakeHeadClone.userData.type = 'snake-head'
    snakeHeadClone.userData.id = 'snake-head'

    renderScene.add(snakeHead)
    overviewScene.add(snakeHeadClone)

    const selectableBodySegments: THREE.Object3D[] = []
    snakeBodySegments.forEach((segment, index) => {
      const segmentClone = segment.clone()
      segmentClone.userData.selectable = true
      segmentClone.userData.transformable = false // Material-only, no transform
      segmentClone.userData.type = 'snake-body'
      segmentClone.userData.id = `snake-body-${index}`

      renderScene.add(segment)
      overviewScene.add(segmentClone)
      selectableBodySegments.push(segmentClone)
    })
    logger.info('ConfigMode: Snake created', { head: 1, bodySegments: snakeBodySegments.length })

    console.log('[ConfigMode] Creating food...')
    // Food
    const food = createConfigFood()
    foodRef.current = food

    const foodClone = food.clone()
    foodClone.userData.selectable = true
    foodClone.userData.transformable = false // Material-only, no transform
    foodClone.userData.type = 'food'
    foodClone.userData.id = 'food'

    renderScene.add(food)
    overviewScene.add(foodClone)
    logger.info('ConfigMode: Food created', { position: food.position.toArray() })

    console.log('[ConfigMode] Setting up lighting...')
    // Lighting (now set up with real scene and wall material)
    const { ambientLight, hemisphereLight, directionalLight, updateLighting } = setupLighting(renderScene, wallMaterial)

    ambientLightRef.current = ambientLight
    hemisphereLightRef.current = hemisphereLight
    directionalLightRef.current = directionalLight
    updateLightingRef.current = updateLighting

    // Create separate lights for overview scene (don't clone, create new ones)
    const overviewAmbient = new THREE.AmbientLight(0xffffff, 1.6)
    const overviewHemisphere = new THREE.HemisphereLight(0x87ceeb, 0x362816, 0.6)
    overviewHemisphere.position.set(0, 50, 0)
    const overviewDirectional = new THREE.DirectionalLight(0xffffff, 2.6)
    overviewDirectional.position.set(10, 20, 10)
    overviewDirectional.castShadow = true

    overviewScene.add(overviewAmbient)
    overviewScene.add(overviewHemisphere)
    overviewScene.add(overviewDirectional)

    // ===== ADD HELPERS TO OVERVIEW SCENE =====

    // Camera helper (showing the render camera)
    const cameraHelper = new THREE.CameraHelper(renderCamera)
    overviewScene.add(cameraHelper)

    // Directional light helper
    const directionalLightHelper = new THREE.DirectionalLightHelper(overviewDirectional, 5)
    overviewScene.add(directionalLightHelper)

    // Hemisphere light helper
    const hemisphereLightHelper = new THREE.HemisphereLightHelper(overviewHemisphere, 5)
    overviewScene.add(hemisphereLightHelper)

    // Axes helper
    const axesHelper = new THREE.AxesHelper(15)
    overviewScene.add(axesHelper)

    // ===== SELECTION MANAGER =====
    console.log('[ConfigMode] Initializing SelectionManager...')
    const selectionManager = new SelectionManager()
    selectionManagerRef.current = selectionManager

    // Build selectable objects array
    const selectableObjects: THREE.Object3D[] = [
      snakeHeadClone,
      ...selectableBodySegments,
      foodClone,
      infiniteFloorClone, // External floor is selectable for material editing
      ...selectableDecorations,
    ]
    selectableObjectsRef.current = selectableObjects

    // Handle canvas clicks for selection
    const handleCanvasClick = (event: MouseEvent) => {
      if (!overviewCanvasRef.current || !overviewCameraRef.current) return

      const canvas = overviewRenderer.domElement
      selectionManager.handleClick(event, overviewCameraRef.current, selectableObjects, canvas)
    }

    overviewRenderer.domElement.addEventListener('click', handleCanvasClick)
    logger.info('ConfigMode: SelectionManager initialized', {
      selectableObjectsCount: selectableObjects.length,
    })

    // Callback for selection changes
    selectionManager.onSelectionChange((object) => {
      setSelectedObject(object)

      // Update OutlineManager selection
      if (outlineManager) {
        if (object) {
          outlineManager.setSelectedObjects([object])
        } else {
          outlineManager.clearSelection()
        }
      }

      if (transformManager) {
        if (object) {
          // Only attach TransformControls to transformable objects
          const isTransformable = object.userData.transformable === true

          if (isTransformable) {
            transformManager.attach(object)
            logger.info('ConfigMode: Object selected and TransformControls attached', {
              objectId: object.userData.id,
              type: object.userData.type,
            })
          } else {
            // Material-only objects: selectable but no transform gizmo
            transformManager.detach()
            logger.info('ConfigMode: Material-only object selected (no transform)', {
              objectId: object.userData.id,
              type: object.userData.type,
            })
          }
        } else {
          transformManager.detach()
          logger.info('ConfigMode: Object deselected, TransformControls detached')
        }
      }
    })

    // ===== TRANSFORM CONTROLS =====
    console.log('[ConfigMode] Initializing TransformControls...')
    const transformManager = new TransformControlsManager(
      overviewCamera,
      overviewRenderer.domElement,
      overviewScene
    )
    transformManagerRef.current = transformManager

    // Register OrbitControls for conflict resolution
    transformManager.setOrbitControls(overviewControlsRef.current)

    logger.info('ConfigMode: TransformControls initialized')
    // ===== BUILD OBJECT TREE =====
    console.log('[ConfigMode] Building ObjectTree structure...')
    const buildObjectTree = (): TreeNode[] => {
      const treeNodes: TreeNode[] = []

      // Lights group
      const lightChildren: TreeNode[] = customLightsRef.current.map((lightResult, index) => {
        const lightType = lightResult.light.type === 'DirectionalLight' ? 'Directional' : 'Point'
        return {
          id: lightResult.id,
          label: `${lightType} Light ${index + 1}`,
          type: 'light' as const,
          objectRef: lightResult.light,
          helperRef: lightResult.helper,
          visible: lightResult.light.visible && lightResult.helper.visible,
        }
      })

      if (lightChildren.length > 0) {
        treeNodes.push({
          id: 'lights-group',
          label: 'Lights',
          type: 'group',
          children: lightChildren,
        })
      }

      // Snake group
      const snakeChildren: TreeNode[] = [
        {
          id: 'snake-head',
          label: 'Head',
          type: 'snake',
          objectRef: snakeHeadClone,
        },
        ...selectableBodySegments.map((segment, index) => ({
          id: `snake-body-${index}`,
          label: `Body Segment ${index + 1}`,
          type: 'snake' as const,
          objectRef: segment,
        })),
      ]

      treeNodes.push({
        id: 'snake-group',
        label: 'Snake',
        type: 'group',
        children: snakeChildren,
      })

      // Food
      treeNodes.push({
        id: 'food',
        label: 'Food',
        type: 'food',
        objectRef: foodClone,
      })

      // Decorations group
      const decorationChildren: TreeNode[] = selectableDecorations.map((decoration, index) => ({
        id: `decoration-${index}`,
        label: `Decoration ${index + 1}`,
        type: 'decoration' as const,
        objectRef: decoration,
      }))

      if (decorationChildren.length > 0) {
        treeNodes.push({
          id: 'decorations-group',
          label: 'Decorations',
          type: 'group',
          children: decorationChildren,
        })
      }

      logger.debug('ConfigMode: ObjectTree built', {
        totalNodes: treeNodes.length,
        lights: lightChildren.length,
        snakeSegments: snakeChildren.length,
        decorations: decorationChildren.length,
      })

      return treeNodes
    }

    setObjectTreeNodes(buildObjectTree())
    // ===== ANIMATION LOOP =====
    console.log('[ConfigMode] Starting animation loop...')
    let animationId: number
    let frameCount = 0

    const animate = () => {
      animationId = requestAnimationFrame(animate)

      if (frameCount === 0 || frameCount % 120 === 0) {
        console.log('[ConfigMode] Animation frame:', frameCount)
      }

      // Update controls
      if (overviewControlsRef.current) {
        overviewControlsRef.current.update()

        // Log camera position occasionally
        if (frameCount % 60 === 0) {
          console.log('[ConfigMode] Camera position:', overviewCamera.position.toArray())
        }
      }
      frameCount++

      // Update helpers
      cameraHelper.update()
      directionalLightHelper.update()

      // Render both views
      if (outlineManagerRef.current) {
        // Use OutlineManager to render with selection feedback
        outlineManagerRef.current.render()
      } else if (overviewRendererRef.current && overviewSceneRef.current && overviewCameraRef.current) {
        // Fallback to regular render if OutlineManager not available
        overviewRendererRef.current.render(overviewSceneRef.current, overviewCameraRef.current)
      }

      if (renderRendererRef.current && renderSceneRef.current && renderCameraRef.current) {
        renderRendererRef.current.render(renderSceneRef.current, renderCameraRef.current)
      }
    }

    animate()

    // Handle window resize
    const handleResize = () => {
      if (!overviewCanvasRef.current || !renderCanvasRef.current) return

      const overviewWidth = overviewCanvasRef.current.clientWidth
      const overviewHeight = overviewCanvasRef.current.clientHeight
      const renderWidth = renderCanvasRef.current.clientWidth
      const renderHeight = renderCanvasRef.current.clientHeight

      // Only update if dimensions are valid
      if (overviewWidth > 0 && overviewHeight > 0 && overviewCameraRef.current && overviewRendererRef.current) {
        overviewCameraRef.current.aspect = overviewWidth / overviewHeight
        overviewCameraRef.current.updateProjectionMatrix()
        overviewRendererRef.current.setSize(overviewWidth, overviewHeight)

        // Update OutlineManager size
        if (outlineManagerRef.current) {
          outlineManagerRef.current.setSize(overviewWidth, overviewHeight, window.devicePixelRatio)
        }
      }

      if (renderWidth > 0 && renderHeight > 0 && renderCameraRef.current && renderRendererRef.current) {
        renderCameraRef.current.aspect = renderWidth / renderHeight
        renderCameraRef.current.updateProjectionMatrix()
        renderRendererRef.current.setSize(renderWidth, renderHeight)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    console.log('[ConfigMode] Initialization complete!')

    // Cleanup
    return () => {
      console.log('[ConfigMode] Cleanup called')
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      overviewRenderer.domElement.removeEventListener('click', handleCanvasClick)

      if (transformManagerRef.current) {
        console.log('[ConfigMode] Disposing TransformControls')
        transformManagerRef.current.dispose()
        transformManagerRef.current = null
      }

      if (outlineManagerRef.current) {
        console.log('[ConfigMode] Disposing OutlineManager')
        outlineManagerRef.current.dispose()
        outlineManagerRef.current = null
      }

      if (overviewControlsRef.current) {
        console.log('[ConfigMode] Disposing OrbitControls')
        overviewControlsRef.current.dispose()
        overviewControlsRef.current = null
      }

      // Remove canvas elements from DOM containers before disposing renderers
      if (overviewRendererRef.current?.domElement?.parentElement) {
        overviewRendererRef.current.domElement.parentElement.removeChild(
          overviewRendererRef.current.domElement
        )
      }
      if (renderRendererRef.current?.domElement?.parentElement) {
        renderRendererRef.current.domElement.parentElement.removeChild(
          renderRendererRef.current.domElement
        )
      }

      overviewRendererRef.current?.dispose()
      renderRendererRef.current?.dispose()
      overviewRendererRef.current = null
      renderRendererRef.current = null

      // Clear scene refs
      overviewSceneRef.current = null
      renderSceneRef.current = null
      overviewCameraRef.current = null
      renderCameraRef.current = null
    }
  } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Error initializing ConfigMode:', error)
      setError(errorMessage)
      return
    }
  }, []) // Only run once on mount

  // Update decorations when quantity changes
  useEffect(() => {
    const renderScene = renderSceneRef.current
    const overviewScene = overviewSceneRef.current

    if (!renderScene || !overviewScene) return

    const currentDecorations = decorationMeshesRef.current
    const currentCount = currentDecorations.render.length

    if (decorationsQuantity === currentCount) return

    logger.debug('ConfigMode: Updating decorations', {
      from: currentCount,
      to: decorationsQuantity
    })

    if (decorationsQuantity > currentCount) {
      // Add new decorations - pass existing configs to preserve them
      const additionalCount = decorationsQuantity - currentCount
      const { meshes: newMeshes, decorations: newConfigs } = createDecorativeElements(
        additionalCount,
        [] // Generate new random decorations for the additional ones
      )

      newMeshes.forEach((decoration, index) => {
        decoration.castShadow = true
        decoration.receiveShadow = true

        const decorationClone = decoration.clone()
        decorationClone.userData.selectable = true
        decorationClone.userData.transformable = true // Can be moved/rotated/scaled
        decorationClone.userData.type = 'decoration'
        decorationClone.userData.id = `decoration-${currentCount + index}`

        renderScene.add(decoration)
        overviewScene.add(decorationClone)

        currentDecorations.render.push(decoration)
        currentDecorations.overview.push(decorationClone)
        selectableObjectsRef.current.push(decorationClone)
      })

      // Append new decoration configs
      decorationConfigsRef.current = [...decorationConfigsRef.current, ...newConfigs]
    } else {
      // Remove decorations
      const removeCount = currentCount - decorationsQuantity

      for (let i = 0; i < removeCount; i++) {
        const renderDecoration = currentDecorations.render.pop()
        const overviewDecoration = currentDecorations.overview.pop()

        if (renderDecoration) {
          renderScene.remove(renderDecoration)
          renderDecoration.geometry.dispose()
          if (Array.isArray(renderDecoration.material)) {
            renderDecoration.material.forEach(mat => mat.dispose())
          } else {
            renderDecoration.material.dispose()
          }
        }

        if (overviewDecoration) {
          overviewScene.remove(overviewDecoration)
          overviewDecoration.geometry.dispose()
          if (Array.isArray(overviewDecoration.material)) {
            overviewDecoration.material.forEach(mat => mat.dispose())
          } else {
            overviewDecoration.material.dispose()
          }

          // Remove from selectable objects
          const index = selectableObjectsRef.current.indexOf(overviewDecoration)
          if (index !== -1) {
            selectableObjectsRef.current.splice(index, 1)
          }

          // Deselect if currently selected
          if (selectedObject === overviewDecoration) {
            setSelectedObject(null)
            if (selectionManagerRef.current) {
              selectionManagerRef.current.clearSelection()
            }
          }
        }
      }

      // Remove decoration configs from the end
      decorationConfigsRef.current = decorationConfigsRef.current.slice(0, decorationsQuantity)
    }

    logger.info('ConfigMode: Decorations updated', { count: decorationsQuantity })
  }, [decorationsQuantity, selectedObject])

  // Update lighting when controls change
  useEffect(() => {
    if (updateLightingRef.current) {
      updateLightingRef.current(lighting)
    }
  }, [lighting])

  // Update brightness when controls change
  useEffect(() => {
    if (arenaFloorMaterialRef.current) {
      arenaFloorMaterialRef.current.emissive.setHex(0x888888)
      arenaFloorMaterialRef.current.emissiveIntensity = brightness.arenaFloor
    }

    if (wallMaterialRef.current) {
      wallMaterialRef.current.uniforms.brightness.value = brightness.arenaWalls
    }

    if (infiniteFloorMaterialRef.current) {
      infiniteFloorMaterialRef.current.emissive.setHex(0x0b3d2e)
      infiniteFloorMaterialRef.current.emissiveIntensity = brightness.externalFloor
    }

    decorationMaterialsRef.current.forEach((material) => {
      if (material instanceof THREE.MeshStandardMaterial) {
        const baseColor = material.color.getHex()
        material.emissive.setHex(baseColor)
        material.emissiveIntensity = brightness.decorations
      }
    })
  }, [brightness])

  // Handle HDRI enable/disable
  useEffect(() => {
    const renderScene = renderSceneRef.current
    const overviewScene = overviewSceneRef.current

    if (!renderScene || !overviewScene) return

    if (hdriEnabled) {
      logger.info('ConfigMode: Enabling HDRI via toggle', {
        baseUrl: import.meta.env.BASE_URL,
        mode: import.meta.env.MODE
      })
      Promise.all([
        loadHDRI({
          scene: renderScene,
          backgroundBlurriness: 0.3,
          onError: (err) => {
            logger.warn('ConfigMode: Render scene HDRI toggle failed', {
              error: err.message
            })
          }
        }),
        loadHDRI({
          scene: overviewScene,
          backgroundBlurriness: 0.3,
          onError: (err) => {
            logger.warn('ConfigMode: Overview scene HDRI toggle failed', {
              error: err.message
            })
          }
        })
      ]).then(() => {
        logger.info('ConfigMode: HDRI toggle completed')
      }).catch(err => {
        logger.error('ConfigMode: Failed to toggle HDRI', {
          error: err?.message || String(err),
          type: err?.constructor?.name
        })
      })
    } else {
      logger.info('ConfigMode: Disabling HDRI, using solid color')
      setSolidColorBackground(renderScene)
      setSolidColorBackground(overviewScene)
    }
  }, [hdriEnabled])

  // Update arena walls material
  useEffect(() => {
    if (wallMaterialRef.current && wallMaterialRef.current.uniforms) {
      // Only update uniforms that exist in the shader
      if (wallMaterialRef.current.uniforms.baseColor) {
        wallMaterialRef.current.uniforms.baseColor.value.setHex(parseInt(arenaWalls.baseColor.replace('#', ''), 16))
      }
      if (wallMaterialRef.current.uniforms.noiseScale) {
        wallMaterialRef.current.uniforms.noiseScale.value = arenaWalls.noiseScale
      }
      if (wallMaterialRef.current.uniforms.noiseStrength) {
        wallMaterialRef.current.uniforms.noiseStrength.value = arenaWalls.noiseStrength
      }
      // lightColor and darkColor uniforms don't exist yet in the shader
      // TODO: Add two-tone color support to wall shader
      logger.debug('ConfigMode: Arena walls updated', { config: arenaWalls })
    }
  }, [arenaWalls])

  // Update external floor material
  useEffect(() => {
    if (infiniteFloorMaterialRef.current) {
      infiniteFloorMaterialRef.current.color.setHex(parseInt(externalFloor.color.replace('#', ''), 16))
      infiniteFloorMaterialRef.current.emissiveIntensity = externalFloor.emissiveIntensity
      infiniteFloorMaterialRef.current.roughness = externalFloor.roughness
      infiniteFloorMaterialRef.current.metalness = externalFloor.metalness
      infiniteFloorMaterialRef.current.normalScale?.set(externalFloor.normalMapScale[0], externalFloor.normalMapScale[1])
      logger.debug('ConfigMode: External floor updated', { config: externalFloor })
    }
  }, [externalFloor])

  // Update snake materials
  useEffect(() => {
    if (snakeHeadRef.current?.material && snakeHeadRef.current.material instanceof THREE.MeshStandardMaterial) {
      snakeHeadRef.current.material.color.setHex(parseInt(snake.head.color.replace('#', ''), 16))
      snakeHeadRef.current.material.emissive.setHex(parseInt(snake.head.emissive.replace('#', ''), 16))
      snakeHeadRef.current.material.emissiveIntensity = snake.head.emissiveIntensity
      logger.debug('ConfigMode: Snake head updated', { config: snake.head })
    }

    snakeBodySegmentsRef.current.forEach((segment) => {
      if (segment.material && segment.material instanceof THREE.MeshStandardMaterial) {
        segment.material.color.setHex(parseInt(snake.body.color.replace('#', ''), 16))
        segment.material.emissive.setHex(parseInt(snake.body.emissive.replace('#', ''), 16))
        segment.material.emissiveIntensity = snake.body.emissiveIntensity
      }
    })
    logger.debug('ConfigMode: Snake body updated', { config: snake.body })
  }, [snake])

  // Update food material and scale
  useEffect(() => {
    if (foodRef.current) {
      if (foodRef.current.material && foodRef.current.material instanceof THREE.MeshStandardMaterial) {
        foodRef.current.material.color.setHex(parseInt(food.color.replace('#', ''), 16))
        foodRef.current.material.emissive.setHex(parseInt(food.emissive.replace('#', ''), 16))
        foodRef.current.material.emissiveIntensity = food.emissiveIntensity
      }
      foodRef.current.scale.setScalar(food.scale)
      logger.debug('ConfigMode: Food updated', { config: food })
    }
  }, [food])

  // Update sky based on type
  useEffect(() => {
    const renderScene = renderSceneRef.current
    const overviewScene = overviewSceneRef.current

    if (!renderScene || !overviewScene) return

    if (sky.type === 'solid') {
      const color = new THREE.Color(sky.solidColor)
      renderScene.background = color
      overviewScene.background = color
      logger.debug('ConfigMode: Sky updated to solid color', { color: sky.solidColor })
    } else if (sky.type === 'hdri' && hdriEnabled) {
      logger.debug('ConfigMode: Sky type set to HDRI')
    } else if (sky.type === 'gradient') {
      logger.warn('ConfigMode: Gradient sky not yet implemented')
    }
  }, [sky, hdriEnabled])

  // Handle config import
  const handleConfigImport = (config: SceneConfig) => {
    setLighting(config.lighting)
    setBrightness(config.brightness)
    setSnakeVelocity(config.snakeVelocity)
    setDecorationsQuantity(config.decorationsQuantity)
    setHdriEnabled(config.hdriEnabled)
    setArenaWalls(config.arenaWalls)
    setExternalFloor(config.externalFloor)
    setSnake(config.snake)
    setFood(config.food)
    setSky(config.sky)
  }

  // Handle manual config save
  const handleConfigSave = () => {
    const config: SceneConfig = {
      ...getDefaultConfig(), // Use defaults as base
      lighting,
      brightness,
      snakeVelocity,
      decorationsQuantity,
      hdriEnabled,
      decorations: decorationConfigsRef.current,
      arenaWalls,
      externalFloor,
      snake,
      food,
      sky,
    }
    saveConfig(config)

    // Comprehensive save logging
    logger.info('ConfigMode: Configuration saved manually', {
      summary: {
        decorationsCount: decorationConfigsRef.current.length,
        decorationsQuantity,
        snakeVelocity,
        hdriEnabled,
        lighting: {
          ambientIntensity: lighting.ambientIntensity,
          directionalIntensity: lighting.directionalIntensity,
        },
        brightness: {
          arenaFloor: brightness.arenaFloor,
          arenaWalls: brightness.arenaWalls,
          externalFloor: brightness.externalFloor,
          decorations: brightness.decorations,
        },
        arenaWalls: { baseColor: arenaWalls.baseColor, noiseScale: arenaWalls.noiseScale },
        externalFloor: { color: externalFloor.color, roughness: externalFloor.roughness },
        snake: { headColor: snake.head.color, bodyColor: snake.body.color },
        food: { color: food.color, scale: food.scale },
        sky: { type: sky.type },
      },
      configFields: {
        hasDecorations: decorationConfigsRef.current.length > 0,
        hasSnakeConfig: !!config.snake,
        hasFoodConfig: !!config.food,
        hasArenaWallsConfig: !!config.arenaWalls,
        hasExternalFloorConfig: !!config.externalFloor,
        hasSkyConfig: !!config.sky,
      }
    })
  }

  // Handle light visibility toggle
  const handleLightVisibilityToggle = (lightId: string, visible: boolean) => {
    const lightResult = customLightsRef.current.find((light) => light.id === lightId)

    if (!lightResult) {
      logger.warn('ConfigMode: Light not found for visibility toggle', { lightId })
      return
    }

    // Toggle both light and helper visibility
    lightResult.light.visible = visible
    lightResult.helper.visible = visible

    // Rebuild object tree to update visibility state
    const buildObjectTree = (): TreeNode[] => {
      const treeNodes: TreeNode[] = []

      // Lights group
      const lightChildren: TreeNode[] = customLightsRef.current.map((lr, index) => {
        const lightType = lr.light.type === 'DirectionalLight' ? 'Directional' : 'Point'
        return {
          id: lr.id,
          label: `${lightType} Light ${index + 1}`,
          type: 'light' as const,
          objectRef: lr.light,
          helperRef: lr.helper,
          visible: lr.light.visible && lr.helper.visible,
        }
      })

      if (lightChildren.length > 0) {
        treeNodes.push({
          id: 'lights-group',
          label: 'Lights',
          type: 'group',
          children: lightChildren,
        })
      }

      // Snake group
      const snakeChildren: TreeNode[] = [
        {
          id: 'snake-head',
          label: 'Head',
          type: 'snake',
          objectRef: snakeHeadRef.current,
        },
        ...snakeBodySegmentsRef.current.map((segment, index) => ({
          id: `snake-body-${index}`,
          label: `Body Segment ${index + 1}`,
          type: 'snake' as const,
          objectRef: segment,
        })),
      ]

      treeNodes.push({
        id: 'snake-group',
        label: 'Snake',
        type: 'group',
        children: snakeChildren,
      })

      // Food
      treeNodes.push({
        id: 'food',
        label: 'Food',
        type: 'food',
        objectRef: foodRef.current,
      })

      // Decorations group
      const decorationChildren: TreeNode[] = decorationMeshesRef.current.overview
        .filter((mesh) => mesh.userData.selectable)
        .map((decoration, index) => ({
          id: `decoration-${index}`,
          label: `Decoration ${index + 1}`,
          type: 'decoration' as const,
          objectRef: decoration,
        }))

      if (decorationChildren.length > 0) {
        treeNodes.push({
          id: 'decorations-group',
          label: 'Decorations',
          type: 'group',
          children: decorationChildren,
        })
      }

      logger.debug('ConfigMode: ObjectTree rebuilt', {
        totalNodes: treeNodes.length,
        lights: lightChildren.length,
        snakeSegments: snakeChildren.length,
        decorations: decorationChildren.length,
      })

      return treeNodes
    }

    setObjectTreeNodes(buildObjectTree())

    logger.info('ConfigMode: Light visibility toggled', { lightId, visible })
  }

  // Handle adding a new light
  const handleAddLight = (type: 'directional' | 'point') => {
    const overviewScene = overviewSceneRef.current
    const renderScene = renderSceneRef.current

    if (!overviewScene || !renderScene) {
      logger.error('ConfigMode: Cannot add light - scenes not initialized')
      return
    }

    let result: DirectionalLightResult | PointLightResult

    if (type === 'directional') {
      result = createDirectionalLight()
      logger.info('ConfigMode: Directional light added', { id: result.id })
    } else {
      result = createPointLight()
      logger.info('ConfigMode: Point light added', { id: result.id })
    }

    // Mark light as selectable
    result.light.userData.selectable = true
    result.light.userData.type = `${type}-light`
    result.light.userData.id = result.id

    // Add light and helper to both scenes
    overviewScene.add(result.light)
    overviewScene.add(result.helper)
    renderScene.add(result.light.clone())

    // Store reference
    customLightsRef.current.push(result)

    // Add to selectable objects array
    selectableObjectsRef.current.push(result.light)

    // Rebuild object tree to include new light
    const buildObjectTree = (): TreeNode[] => {
      const treeNodes: TreeNode[] = []

      // Lights group
      const lightChildren: TreeNode[] = customLightsRef.current.map((lr, index) => {
        const lightType = lr.light.type === 'DirectionalLight' ? 'Directional' : 'Point'
        return {
          id: lr.id,
          label: `${lightType} Light ${index + 1}`,
          type: 'light' as const,
          objectRef: lr.light,
          helperRef: lr.helper,
          visible: lr.light.visible && lr.helper.visible,
        }
      })

      if (lightChildren.length > 0) {
        treeNodes.push({
          id: 'lights-group',
          label: 'Lights',
          type: 'group',
          children: lightChildren,
        })
      }

      // Snake group
      const snakeChildren: TreeNode[] = [
        {
          id: 'snake-head',
          label: 'Head',
          type: 'snake',
          objectRef: snakeHeadRef.current,
        },
        ...snakeBodySegmentsRef.current.map((segment, index) => ({
          id: `snake-body-${index}`,
          label: `Body Segment ${index + 1}`,
          type: 'snake' as const,
          objectRef: segment,
        })),
      ]

      treeNodes.push({
        id: 'snake-group',
        label: 'Snake',
        type: 'group',
        children: snakeChildren,
      })

      // Food
      treeNodes.push({
        id: 'food',
        label: 'Food',
        type: 'food',
        objectRef: foodRef.current,
      })

      // Decorations group
      const decorationChildren: TreeNode[] = decorationMeshesRef.current.overview
        .filter((mesh) => mesh.userData.selectable)
        .map((decoration, index) => ({
          id: `decoration-${index}`,
          label: `Decoration ${index + 1}`,
          type: 'decoration' as const,
          objectRef: decoration,
        }))

      if (decorationChildren.length > 0) {
        treeNodes.push({
          id: 'decorations-group',
          label: 'Decorations',
          type: 'group',
          children: decorationChildren,
        })
      }

      logger.debug('ConfigMode: ObjectTree rebuilt after light addition', {
        totalNodes: treeNodes.length,
        lights: lightChildren.length,
        snakeSegments: snakeChildren.length,
        decorations: decorationChildren.length,
      })

      return treeNodes
    }

    setObjectTreeNodes(buildObjectTree())

    logger.debug('ConfigMode: Light added to selectable objects', {
      id: result.id,
      type,
      totalSelectableObjects: selectableObjectsRef.current.length,
    })
  }

  // Handle transform mode change
  const handleTransformModeChange = (mode: TransformMode) => {
    setTransformMode(mode)

    if (transformManagerRef.current) {
      transformManagerRef.current.setMode(mode)
      logger.info('ConfigMode: Transform mode changed', { mode })
    }
  }
  // Handle object selection from tree
  const handleObjectSelect = (id: string | null) => {
    const selectionManager = selectionManagerRef.current
    const selectableObjects = selectableObjectsRef.current

    if (!selectionManager) {
      logger.warn('ConfigMode: SelectionManager not initialized')
      return
    }

    if (id === null) {
      // Deselect
      selectionManager.setSelectedObject(null)
      logger.debug('ConfigMode: Object deselected from tree')
    } else {
      // Find object by ID
      const object = selectableObjects.find((obj) => obj.userData.id === id)
      if (object) {
        selectionManager.setSelectedObject(object)
        logger.debug('ConfigMode: Object selected from tree', { id, type: object.userData.type })
      } else {
        logger.warn('ConfigMode: Object not found for tree selection', { id })
      }
    }
  }
  if (error) {
    return (
      <div className="config-mode" style={{ padding: '2rem', color: '#ff6b6b' }}>
        <h2>Configuration Error</h2>
        <p><strong>Error:</strong> {error}</p>
        <pre style={{ background: '#1a1a2e', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
          {error}
        </pre>
        <button className="back-button" onClick={onBackToMenu} style={{ position: 'relative', top: 0, right: 0, marginTop: '1rem' }}>
          Back to Menu
        </button>
      </div>
    )
  }

  return (
    <div className="config-mode">
      <ControlPanel
        lighting={lighting}
        onLightingChange={setLighting}
        brightness={brightness}
        onBrightnessChange={setBrightness}
        snakeVelocity={snakeVelocity}
        onSnakeVelocityChange={setSnakeVelocity}
        decorationsQuantity={decorationsQuantity}
        onDecorationsQuantityChange={setDecorationsQuantity}
        hdriEnabled={hdriEnabled}
        onHdriEnabledChange={setHdriEnabled}
        arenaWalls={arenaWalls}
        onArenaWallsChange={setArenaWalls}
        externalFloor={externalFloor}
        onExternalFloorChange={setExternalFloor}
        snake={snake}
        onSnakeChange={setSnake}
        food={food}
        onFoodChange={setFood}
        sky={sky}
        onSkyChange={setSky}
        onConfigImport={handleConfigImport}
        onConfigSave={handleConfigSave}
        onAddLight={handleAddLight}
        transformMode={transformMode}
        onTransformModeChange={handleTransformModeChange}
        selectedObject={selectedObject}
        selectedObjectName={selectedObject?.userData.id || null}
        objectTreeNodes={objectTreeNodes}
        selectedObjectId={selectedObject?.userData.id || null}
        onObjectSelect={handleObjectSelect}
        onLightVisibilityToggle={handleLightVisibilityToggle}
      />

      <div className="canvas-container">
        <div className="canvas-section overview-section">
          <h3>Scene Overview</h3>
          <div className="canvas-wrapper" ref={overviewCanvasRef}></div>
          <p className="canvas-label">Navigate with mouse • Orbit controls enabled</p>
        </div>

        <div className="canvas-section render-section">
          <h3>Rendered View</h3>
          <div className="canvas-wrapper" ref={renderCanvasRef}></div>
          <p className="canvas-label">Game camera view • Fixed position</p>
        </div>
      </div>

      <button className="back-button" onClick={onBackToMenu}>
        Back to Menu
      </button>
    </div>
  )
}

export default ConfigMode
