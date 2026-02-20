import { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { exportConfig, importConfig, resetConfig, getDefaultConfig, type SceneConfig, type ArenaWallsConfig, type ExternalFloorConfig, type SnakeConfig, type FoodConfig, type SkyConfig } from '../utils/sceneConfig'
import { ObjectTree, type TreeNode } from './ObjectTree'
import { TransformInputs } from './TransformInputs'
import './ControlPanel.css'

interface LightingControls {
  ambientIntensity: number
  ambientColor: string
  directionalIntensity: number
  directionalColor: string
}

interface BrightnessControls {
  arenaFloor: number
  arenaWalls: number
  externalFloor: number
  decorations: number
}

interface ControlPanelProps {
  lighting: LightingControls
  onLightingChange: (lighting: LightingControls) => void
  brightness: BrightnessControls
  onBrightnessChange: (brightness: BrightnessControls) => void
  snakeVelocity: number
  onSnakeVelocityChange: (velocity: number) => void
  decorationsQuantity: number
  onDecorationsQuantityChange: (quantity: number) => void
  hdriEnabled: boolean
  onHdriEnabledChange: (enabled: boolean) => void
  arenaWalls?: ArenaWallsConfig
  onArenaWallsChange?: (config: ArenaWallsConfig) => void
  externalFloor?: ExternalFloorConfig
  onExternalFloorChange?: (config: ExternalFloorConfig) => void
  snake?: SnakeConfig
  onSnakeChange?: (config: SnakeConfig) => void
  food?: FoodConfig
  onFoodChange?: (config: FoodConfig) => void
  sky?: SkyConfig
  onSkyChange?: (config: SkyConfig) => void
  onConfigImport?: (config: SceneConfig) => void
  onConfigSave?: () => void
  onAddLight?: (type: 'directional' | 'point') => void
  transformMode?: 'translate' | 'rotate' | 'scale'
  onTransformModeChange?: (mode: 'translate' | 'rotate' | 'scale') => void
  selectedObject?: THREE.Object3D | null
  selectedObjectName?: string | null
  objectTreeNodes?: TreeNode[]
  selectedObjectId?: string | null
  onObjectSelect?: (id: string | null) => void
  onLightVisibilityToggle?: (id: string, visible: boolean) => void
}

function ControlPanel({
  lighting,
  onLightingChange,
  brightness,
  onBrightnessChange,
  snakeVelocity,
  onSnakeVelocityChange,
  decorationsQuantity,
  onDecorationsQuantityChange,
  hdriEnabled,
  onHdriEnabledChange,
  arenaWalls,
  onArenaWallsChange,
  externalFloor,
  onExternalFloorChange,
  snake,
  onSnakeChange,
  food,
  onFoodChange,
  sky,
  onSkyChange,
  onConfigImport,
  onConfigSave,
  onAddLight,
  transformMode = 'translate',
  onTransformModeChange,
  selectedObject,
  selectedObjectName,
  objectTreeNodes = [],
  selectedObjectId = null,
  onObjectSelect,
  onLightVisibilityToggle,
}: ControlPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedPanels, setExpandedPanels] = useState({
    sceneObjects: true,
    transform: true,
    lighting: true,
    brightness: false,
    velocity: false,
    decorations: false,
    arenaWalls: false,
    externalFloor: false,
    snake: false,
    food: false,
    sky: false,
    config: false,
    lights: false,
  })
  const [selectedLightType, setSelectedLightType] = useState<'directional' | 'point'>('directional')
  const [justSaved, setJustSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset "just saved" state after 2 seconds
  useEffect(() => {
    if (justSaved) {
      const timeout = setTimeout(() => setJustSaved(false), 2000)
      return () => clearTimeout(timeout)
    }
  }, [justSaved])

  const togglePanel = (panel: keyof typeof expandedPanels) => {
    setExpandedPanels(prev => ({ ...prev, [panel]: !prev[panel] }))
  }

  const handleExport = () => {
    const config: SceneConfig = {
      ...getDefaultConfig(), // Use defaults as base
      lighting,
      brightness,
      snakeVelocity,
      decorationsQuantity,
      hdriEnabled,
    }
    exportConfig(config)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const config = await importConfig(file)
        if (onConfigImport) {
          onConfigImport(config)
        }
      } catch (error) {
        alert('Failed to import configuration: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }
    }
    // Reset input to allow importing the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleReset = () => {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
      const defaultConfig = resetConfig()
      if (onConfigImport) {
        onConfigImport(defaultConfig)
      }
    }
  }

  const handleSave = () => {
    if (onConfigSave) {
      onConfigSave()
      setJustSaved(true)
    }
  }

  return (
    <div className={`control-panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="control-panel-header">
        <h3>Controls</h3>
        <button
          className="collapse-button"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '◀' : '▶'}
        </button>
      </div>

      {!collapsed && (
        <div className="control-panel-content">
          {/* Scene Objects */}
          <div className="control-section">
            <div
              className="control-section-header"
              onClick={() => togglePanel('sceneObjects')}
            >
              <span>📋 Scene Objects</span>
              <span className="toggle-icon">
                {expandedPanels.sceneObjects ? '−' : '+'}
              </span>
            </div>
            {expandedPanels.sceneObjects && (
              <div className="control-section-content">
                <ObjectTree
                  nodes={objectTreeNodes}
                  selectedId={selectedObjectId}
                  onSelect={onObjectSelect || (() => {})}
                  onVisibilityToggle={onLightVisibilityToggle}
                />
              </div>
            )}
          </div>

          {/* Transform Controls */}
          <div className="control-section">
            <div
              className="control-section-header"
              onClick={() => togglePanel('transform')}
            >
              <span>🎯 Transform</span>
              <span className="toggle-icon">
                {expandedPanels.transform ? '−' : '+'}
              </span>
            </div>
            {expandedPanels.transform && (
              <div className="control-section-content">
                {selectedObjectName ? (
                  <>
                    <div className="control-group">
                      <label>Selected: {selectedObjectName}</label>
                    </div>
                    <div className="control-group">
                      <label>Transform Mode</label>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                          onClick={() => onTransformModeChange?.('translate')}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            background: transformMode === 'translate' ? '#4CAF50' : '#555',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: transformMode === 'translate' ? 'bold' : 'normal',
                          }}
                        >
                          Translate
                        </button>
                        <button
                          onClick={() => onTransformModeChange?.('rotate')}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            background: transformMode === 'rotate' ? '#4CAF50' : '#555',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: transformMode === 'rotate' ? 'bold' : 'normal',
                          }}
                        >
                          Rotate
                        </button>
                        <button
                          onClick={() => onTransformModeChange?.('scale')}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            background: transformMode === 'scale' ? '#4CAF50' : '#555',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: transformMode === 'scale' ? 'bold' : 'normal',
                          }}
                        >
                          Scale
                        </button>
                      </div>
                    </div>
                    {selectedObject && (
                      <TransformInputs
                        object={selectedObject}
                        onChange={(_obj) => {
                          // Transform changes are handled by TransformControlsManager
                          // This callback is for potential additional handling
                        }}
                      />
                    )}
                  </>
                ) : (
                  <div className="control-group">
                    <label style={{ color: '#888' }}>No object selected</label>
                    <p style={{ fontSize: '0.85rem', color: '#666', margin: '0.5rem 0 0 0' }}>
                      Click an object in the scene to select it
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lighting Controls */}
          <div className="control-section">
            <div
              className="control-section-header"
              onClick={() => togglePanel('lighting')}
            >
              <span>💡 Lighting</span>
              <span className="toggle-icon">
                {expandedPanels.lighting ? '−' : '+'}
              </span>
            </div>
            {expandedPanels.lighting && (
              <div className="control-section-content">
                <div className="control-group">
                  <label>Ambient Intensity</label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={lighting.ambientIntensity}
                    onChange={(e) =>
                      onLightingChange({
                        ...lighting,
                        ambientIntensity: parseFloat(e.target.value),
                      })
                    }
                  />
                  <span className="value">{lighting.ambientIntensity.toFixed(1)}</span>
                </div>
                <div className="control-group">
                  <label>Ambient Color</label>
                  <input
                    type="color"
                    value={lighting.ambientColor}
                    onChange={(e) =>
                      onLightingChange({ ...lighting, ambientColor: e.target.value })
                    }
                  />
                </div>
                <div className="control-group">
                  <label>Directional Intensity</label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={lighting.directionalIntensity}
                    onChange={(e) =>
                      onLightingChange({
                        ...lighting,
                        directionalIntensity: parseFloat(e.target.value),
                      })
                    }
                  />
                  <span className="value">{lighting.directionalIntensity.toFixed(1)}</span>
                </div>
                <div className="control-group">
                  <label>Directional Color</label>
                  <input
                    type="color"
                    value={lighting.directionalColor}
                    onChange={(e) =>
                      onLightingChange({ ...lighting, directionalColor: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Custom Lights Section */}
          <div className="control-section">
            <div
              className="control-section-header"
              onClick={() => togglePanel('lights')}
            >
              <span>💡 Custom Lights</span>
              <span className="toggle-icon">
                {expandedPanels.lights ? '−' : '+'}
              </span>
            </div>
            {expandedPanels.lights && (
              <div className="control-section-content">
                <div className="control-group">
                  <label>Add New Light</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                      value={selectedLightType}
                      onChange={(e) => setSelectedLightType(e.target.value as 'directional' | 'point')}
                      style={{
                        flex: 1,
                        padding: '0.4rem',
                        background: '#2a2a4a',
                        color: '#fff',
                        border: '1px solid #4a4a6a',
                        borderRadius: '4px',
                      }}
                    >
                      <option value="directional">Directional Light</option>
                      <option value="point">Point Light</option>
                    </select>
                    <button
                      onClick={() => onAddLight?.(selectedLightType)}
                      style={{
                        padding: '0.4rem 1rem',
                        background: '#4a4a6a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Brightness Controls */}
          <div className="control-section">
            <div
              className="control-section-header"
              onClick={() => togglePanel('brightness')}
            >
              <span>🔆 Brightness</span>
              <span className="toggle-icon">
                {expandedPanels.brightness ? '−' : '+'}
              </span>
            </div>
            {expandedPanels.brightness && (
              <div className="control-section-content">
                <div className="control-group">
                  <label>Arena Floor</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={brightness.arenaFloor}
                    onChange={(e) =>
                      onBrightnessChange({
                        ...brightness,
                        arenaFloor: parseFloat(e.target.value),
                      })
                    }
                  />
                  <span className="value">{brightness.arenaFloor.toFixed(2)}</span>
                </div>
                <div className="control-group">
                  <label>Arena Walls</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={brightness.arenaWalls}
                    onChange={(e) =>
                      onBrightnessChange({
                        ...brightness,
                        arenaWalls: parseFloat(e.target.value),
                      })
                    }
                  />
                  <span className="value">{brightness.arenaWalls.toFixed(2)}</span>
                </div>
                <div className="control-group">
                  <label>External Floor</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={brightness.externalFloor}
                    onChange={(e) =>
                      onBrightnessChange({
                        ...brightness,
                        externalFloor: parseFloat(e.target.value),
                      })
                    }
                  />
                  <span className="value">{brightness.externalFloor.toFixed(2)}</span>
                </div>
                <div className="control-group">
                  <label>Decorations</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={brightness.decorations}
                    onChange={(e) =>
                      onBrightnessChange({
                        ...brightness,
                        decorations: parseFloat(e.target.value),
                      })
                    }
                  />
                  <span className="value">{brightness.decorations.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Snake Velocity */}
          <div className="control-section">
            <div
              className="control-section-header"
              onClick={() => togglePanel('velocity')}
            >
              <span>🐍 Snake Velocity</span>
              <span className="toggle-icon">
                {expandedPanels.velocity ? '−' : '+'}
              </span>
            </div>
            {expandedPanels.velocity && (
              <div className="control-section-content">
                <div className="control-group">
                  <label>Velocity</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={snakeVelocity}
                    onChange={(e) =>
                      onSnakeVelocityChange(parseInt(e.target.value))
                    }
                  />
                  <span className="value">{snakeVelocity}</span>
                </div>
              </div>
            )}
          </div>

          {/* Decorations Quantity */}
          <div className="control-section">
            <div
              className="control-section-header"
              onClick={() => togglePanel('decorations')}
            >
              <span>🪨 Decorations</span>
              <span className="toggle-icon">
                {expandedPanels.decorations ? '−' : '+'}
              </span>
            </div>
            {expandedPanels.decorations && (
              <div className="control-section-content">
                <div className="control-group">
                  <label>Quantity</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={decorationsQuantity}
                    onChange={(e) =>
                      onDecorationsQuantityChange(parseInt(e.target.value))
                    }
                  />
                  <span className="value">{decorationsQuantity}</span>
                </div>
              </div>
            )}
          </div>

          {/* Arena Walls */}
          {arenaWalls && onArenaWallsChange && (
          <div className="control-section">
            <div
              className="control-section-header"
              onClick={() => togglePanel('arenaWalls')}
            >
              <span>🧱 Arena Walls</span>
              <span className="toggle-icon">
                {expandedPanels.arenaWalls ? '−' : '+'}
              </span>
            </div>
            {expandedPanels.arenaWalls && (
              <div className="control-section-content">
                <div className="control-group">
                  <label>Base Color</label>
                  <input
                    type="color"
                    value={arenaWalls.baseColor}
                    onChange={(e) =>
                      onArenaWallsChange({ ...arenaWalls, baseColor: e.target.value })
                    }
                  />
                </div>
                <div className="control-group">
                  <label>Noise Scale</label>
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={arenaWalls.noiseScale}
                    onChange={(e) =>
                      onArenaWallsChange({ ...arenaWalls, noiseScale: parseFloat(e.target.value) })
                    }
                  />
                  <span className="value">{arenaWalls.noiseScale.toFixed(1)}</span>
                </div>
                <div className="control-group">
                  <label>Noise Strength</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={arenaWalls.noiseStrength}
                    onChange={(e) =>
                      onArenaWallsChange({ ...arenaWalls, noiseStrength: parseFloat(e.target.value) })
                    }
                  />
                  <span className="value">{arenaWalls.noiseStrength.toFixed(2)}</span>
                </div>
                <div className="control-group">
                  <label>Light Color</label>
                  <input
                    type="color"
                    value={arenaWalls.lightColor}
                    onChange={(e) =>
                      onArenaWallsChange({ ...arenaWalls, lightColor: e.target.value })
                    }
                  />
                </div>
                <div className="control-group">
                  <label>Dark Color</label>
                  <input
                    type="color"
                    value={arenaWalls.darkColor}
                    onChange={(e) =>
                      onArenaWallsChange({ ...arenaWalls, darkColor: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>
          )}

          {/* External Floor */}
          {externalFloor && onExternalFloorChange && (
          <div className="control-section">
            <div
              className="control-section-header"
              onClick={() => togglePanel('externalFloor')}
            >
              <span>🌍 External Floor</span>
              <span className="toggle-icon">
                {expandedPanels.externalFloor ? '−' : '+'}
              </span>
            </div>
            {expandedPanels.externalFloor && (
              <div className="control-section-content">
                <div className="control-group">
                  <label>Base Color</label>
                  <input
                    type="color"
                    value={externalFloor.color}
                    onChange={(e) =>
                      onExternalFloorChange({ ...externalFloor, color: e.target.value })
                    }
                  />
                </div>
                <div className="control-group">
                  <label>Emissive Intensity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={externalFloor.emissiveIntensity}
                    onChange={(e) =>
                      onExternalFloorChange({ ...externalFloor, emissiveIntensity: parseFloat(e.target.value) })
                    }
                  />
                  <span className="value">{externalFloor.emissiveIntensity.toFixed(1)}</span>
                </div>
                <div className="control-group">
                  <label>Roughness</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={externalFloor.roughness}
                    onChange={(e) =>
                      onExternalFloorChange({ ...externalFloor, roughness: parseFloat(e.target.value) })
                    }
                  />
                  <span className="value">{externalFloor.roughness.toFixed(1)}</span>
                </div>
                <div className="control-group">
                  <label>Metalness</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={externalFloor.metalness}
                    onChange={(e) =>
                      onExternalFloorChange({ ...externalFloor, metalness: parseFloat(e.target.value) })
                    }
                  />
                  <span className="value">{externalFloor.metalness.toFixed(1)}</span>
                </div>
                <div className="control-group">
                  <label>Normal Map Intensity</label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={externalFloor.normalMapIntensity}
                    onChange={(e) =>
                      onExternalFloorChange({ ...externalFloor, normalMapIntensity: parseFloat(e.target.value) })
                    }
                  />
                  <span className="value">{externalFloor.normalMapIntensity.toFixed(1)}</span>
                </div>
                <div className="control-group">
                  <label>Normal Map Scale X</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={externalFloor.normalMapScale[0]}
                    onChange={(e) =>
                      onExternalFloorChange({
                        ...externalFloor,
                        normalMapScale: [parseFloat(e.target.value), externalFloor.normalMapScale[1]]
                      })
                    }
                  />
                  <span className="value">{externalFloor.normalMapScale[0]}</span>
                </div>
                <div className="control-group">
                  <label>Normal Map Scale Y</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={externalFloor.normalMapScale[1]}
                    onChange={(e) =>
                      onExternalFloorChange({
                        ...externalFloor,
                        normalMapScale: [externalFloor.normalMapScale[0], parseFloat(e.target.value)]
                      })
                    }
                  />
                  <span className="value">{externalFloor.normalMapScale[1]}</span>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Snake */}
          {snake && onSnakeChange && (
          <div className="control-section">
            <div
              className="control-section-header"
              onClick={() => togglePanel('snake')}
            >
              <span>🐍 Snake</span>
              <span className="toggle-icon">
                {expandedPanels.snake ? '−' : '+'}
              </span>
            </div>
            {expandedPanels.snake && (
              <div className="control-section-content">
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#aaa', fontSize: '0.9rem' }}>Head</h4>
                <div className="control-group">
                  <label>Color</label>
                  <input
                    type="color"
                    value={snake.head.color}
                    onChange={(e) =>
                      onSnakeChange({
                        ...snake,
                        head: { ...snake.head, color: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="control-group">
                  <label>Emissive Color</label>
                  <input
                    type="color"
                    value={snake.head.emissive}
                    onChange={(e) =>
                      onSnakeChange({
                        ...snake,
                        head: { ...snake.head, emissive: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="control-group">
                  <label>Emissive Intensity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={snake.head.emissiveIntensity}
                    onChange={(e) =>
                      onSnakeChange({
                        ...snake,
                        head: { ...snake.head, emissiveIntensity: parseFloat(e.target.value) }
                      })
                    }
                  />
                  <span className="value">{snake.head.emissiveIntensity.toFixed(1)}</span>
                </div>

                <h4 style={{ margin: '1rem 0 0.5rem 0', color: '#aaa', fontSize: '0.9rem' }}>Body</h4>
                <div className="control-group">
                  <label>Color</label>
                  <input
                    type="color"
                    value={snake.body.color}
                    onChange={(e) =>
                      onSnakeChange({
                        ...snake,
                        body: { ...snake.body, color: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="control-group">
                  <label>Emissive Color</label>
                  <input
                    type="color"
                    value={snake.body.emissive}
                    onChange={(e) =>
                      onSnakeChange({
                        ...snake,
                        body: { ...snake.body, emissive: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="control-group">
                  <label>Emissive Intensity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={snake.body.emissiveIntensity}
                    onChange={(e) =>
                      onSnakeChange({
                        ...snake,
                        body: { ...snake.body, emissiveIntensity: parseFloat(e.target.value) }
                      })
                    }
                  />
                  <span className="value">{snake.body.emissiveIntensity.toFixed(1)}</span>
                </div>
                <div className="control-group">
                  <label>Segment Spacing</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={snake.body.segmentSpacing}
                    onChange={(e) =>
                      onSnakeChange({
                        ...snake,
                        body: { ...snake.body, segmentSpacing: parseFloat(e.target.value) }
                      })
                    }
                  />
                  <span className="value">{snake.body.segmentSpacing.toFixed(1)}</span>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Food */}
          {food && onFoodChange && (
          <div className="control-section">
            <div
              className="control-section-header"
              onClick={() => togglePanel('food')}
            >
              <span>🍎 Food</span>
              <span className="toggle-icon">
                {expandedPanels.food ? '−' : '+'}
              </span>
            </div>
            {expandedPanels.food && (
              <div className="control-section-content">
                <div className="control-group">
                  <label>Color</label>
                  <input
                    type="color"
                    value={food.color}
                    onChange={(e) =>
                      onFoodChange({ ...food, color: e.target.value })
                    }
                  />
                </div>
                <div className="control-group">
                  <label>Emissive Color</label>
                  <input
                    type="color"
                    value={food.emissive}
                    onChange={(e) =>
                      onFoodChange({ ...food, emissive: e.target.value })
                    }
                  />
                </div>
                <div className="control-group">
                  <label>Emissive Intensity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={food.emissiveIntensity}
                    onChange={(e) =>
                      onFoodChange({ ...food, emissiveIntensity: parseFloat(e.target.value) })
                    }
                  />
                  <span className="value">{food.emissiveIntensity.toFixed(1)}</span>
                </div>
                <div className="control-group">
                  <label>Scale</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={food.scale}
                    onChange={(e) =>
                      onFoodChange({ ...food, scale: parseFloat(e.target.value) })
                    }
                  />
                  <span className="value">{food.scale.toFixed(1)}</span>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Sky / Background */}
          {sky && onSkyChange && (
          <div className="control-section">
            <div
              className="control-section-header"
              onClick={() => togglePanel('sky')}
            >
              <span>🌌 Sky / Background</span>
              <span className="toggle-icon">
                {expandedPanels.sky ? '−' : '+'}
              </span>
            </div>
            {expandedPanels.sky && (
              <div className="control-section-content">
                <div className="control-group">
                  <label>Sky Type</label>
                  <select
                    value={sky.type}
                    onChange={(e) =>
                      onSkyChange({ ...sky, type: e.target.value as 'solid' | 'gradient' | 'hdri' })
                    }
                    style={{
                      width: '100%',
                      padding: '0.4rem',
                      backgroundColor: '#1a1a2e',
                      color: '#e0e0e0',
                      border: '1px solid #333',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="solid">Solid Color</option>
                    <option value="gradient">Gradient</option>
                    <option value="hdri">HDRI Environment</option>
                  </select>
                </div>
                {sky.type === 'solid' && (
                  <div className="control-group">
                    <label>Color</label>
                    <input
                      type="color"
                      value={sky.solidColor}
                      onChange={(e) =>
                        onSkyChange({ ...sky, solidColor: e.target.value })
                      }
                    />
                  </div>
                )}
                {sky.type === 'hdri' && (
                  <div className="control-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={hdriEnabled}
                        onChange={(e) => onHdriEnabledChange(e.target.checked)}
                      />
                      Enable HDRI Environment
                    </label>
                    <p style={{ fontSize: '0.8rem', color: '#888', margin: '0.25rem 0 0 0' }}>
                      Realistic environment map for lighting and reflections
                    </p>
                  </div>
                )}
                <div className="control-group">
                  <label>Intensity</label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={sky.intensity}
                    onChange={(e) =>
                      onSkyChange({ ...sky, intensity: parseFloat(e.target.value) })
                    }
                  />
                  <span className="value">{sky.intensity.toFixed(1)}</span>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Configuration Management */}
          <div className="control-section">
            <div
              className="control-section-header"
              onClick={() => togglePanel('config')}
            >
              <span>⚙️ Configuration</span>
              <span className="toggle-icon">
                {expandedPanels.config ? '−' : '+'}
              </span>
            </div>
            {expandedPanels.config && (
              <div className="control-section-content">
                <div className="config-buttons">
                  <button
                    className={`config-button save ${justSaved ? 'saved' : ''}`}
                    onClick={handleSave}
                    style={{
                      backgroundColor: justSaved ? '#4CAF50' : '#2196F3',
                      transition: 'background-color 0.3s ease',
                    }}
                  >
                    {justSaved ? '✓ Saved!' : '💾 Save Configuration'}
                  </button>
                  <button className="config-button export" onClick={handleExport}>
                    📥 Export Config
                  </button>
                  <button className="config-button import" onClick={handleImportClick}>
                    📤 Import Config
                  </button>
                  <button className="config-button reset" onClick={handleReset}>
                    🔄 Reset to Defaults
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </div>
                <p className="config-info">
                  Click "Save Configuration" to persist your changes to localStorage.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ControlPanel
