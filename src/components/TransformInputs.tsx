import { useState, useEffect } from 'react'
import * as THREE from 'three'
import { logger } from '../utils/logger'
import './TransformInputs.css'

interface TransformInputsProps {
  object: THREE.Object3D
  onChange: (object: THREE.Object3D) => void
}

export function TransformInputs({ object, onChange }: TransformInputsProps) {
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 })
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 }) // In degrees
  const [scale, setScale] = useState({ x: 1, y: 1, z: 1 })
  const [lockAspectRatio, setLockAspectRatio] = useState(false)

  // Update local state when object changes externally
  useEffect(() => {
    setPosition({
      x: object.position.x,
      y: object.position.y,
      z: object.position.z,
    })
    setRotation({
      x: THREE.MathUtils.radToDeg(object.rotation.x),
      y: THREE.MathUtils.radToDeg(object.rotation.y),
      z: THREE.MathUtils.radToDeg(object.rotation.z),
    })
    setScale({
      x: object.scale.x,
      y: object.scale.y,
      z: object.scale.z,
    })
    // Include specific properties as dependencies so changes are detected
  }, [object, object.position.x, object.position.y, object.position.z,
      object.rotation.x, object.rotation.y, object.rotation.z,
      object.scale.x, object.scale.y, object.scale.z])

  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: string) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) {
      return // Invalid input, ignore
    }

    object.position[axis] = numValue
    setPosition((prev) => ({ ...prev, [axis]: numValue }))

    logger.trace('TransformInputs: Position changed', {
      axis,
      value: numValue,
      position: object.position.toArray(),
    })

    onChange(object)
  }

  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: string) => {
    const degValue = parseFloat(value)
    if (isNaN(degValue)) {
      return // Invalid input, ignore
    }

    const radValue = THREE.MathUtils.degToRad(degValue)
    object.rotation[axis] = radValue
    setRotation((prev) => ({ ...prev, [axis]: degValue }))

    logger.trace('TransformInputs: Rotation changed', {
      axis,
      degrees: degValue,
      radians: radValue,
    })

    onChange(object)
  }

  const handleScaleChange = (axis: 'x' | 'y' | 'z', value: string) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue <= 0) {
      return // Invalid input (negative or zero scale not allowed)
    }

    if (lockAspectRatio) {
      // Update all axes proportionally
      object.scale.set(numValue, numValue, numValue)
      setScale({ x: numValue, y: numValue, z: numValue })

      logger.trace('TransformInputs: Scale changed (locked)', {
        value: numValue,
      })
    } else {
      // Update only the specified axis
      object.scale[axis] = numValue
      setScale((prev) => ({ ...prev, [axis]: numValue }))

      logger.trace('TransformInputs: Scale changed', {
        axis,
        value: numValue,
      })
    }

    onChange(object)
  }

  const formatNumber = (num: number): string => {
    return num.toFixed(2)
  }

  return (
    <div className="transform-inputs">
      {/* Position */}
      <div className="transform-group">
        <label className="transform-label">Position</label>
        <div className="transform-xyz">
          <div className="transform-input-wrapper">
            <label htmlFor="pos-x" className="axis-label">Position X</label>
            <input
              id="pos-x"
              type="number"
              step="0.1"
              value={formatNumber(position.x)}
              onChange={(e) => handlePositionChange('x', e.target.value)}
              className="transform-input"
            />
          </div>
          <div className="transform-input-wrapper">
            <label htmlFor="pos-y" className="axis-label">Position Y</label>
            <input
              id="pos-y"
              type="number"
              step="0.1"
              value={formatNumber(position.y)}
              onChange={(e) => handlePositionChange('y', e.target.value)}
              className="transform-input"
            />
          </div>
          <div className="transform-input-wrapper">
            <label htmlFor="pos-z" className="axis-label">Position Z</label>
            <input
              id="pos-z"
              type="number"
              step="0.1"
              value={formatNumber(position.z)}
              onChange={(e) => handlePositionChange('z', e.target.value)}
              className="transform-input"
            />
          </div>
        </div>
      </div>

      {/* Rotation */}
      <div className="transform-group">
        <label className="transform-label">Rotation (degrees)</label>
        <div className="transform-xyz">
          <div className="transform-input-wrapper">
            <label htmlFor="rot-x" className="axis-label">Rotation X</label>
            <input
              id="rot-x"
              type="number"
              step="1"
              value={formatNumber(rotation.x)}
              onChange={(e) => handleRotationChange('x', e.target.value)}
              className="transform-input"
            />
          </div>
          <div className="transform-input-wrapper">
            <label htmlFor="rot-y" className="axis-label">Rotation Y</label>
            <input
              id="rot-y"
              type="number"
              step="1"
              value={formatNumber(rotation.y)}
              onChange={(e) => handleRotationChange('y', e.target.value)}
              className="transform-input"
            />
          </div>
          <div className="transform-input-wrapper">
            <label htmlFor="rot-z" className="axis-label">Rotation Z</label>
            <input
              id="rot-z"
              type="number"
              step="1"
              value={formatNumber(rotation.z)}
              onChange={(e) => handleRotationChange('z', e.target.value)}
              className="transform-input"
            />
          </div>
        </div>
      </div>

      {/* Scale */}
      <div className="transform-group">
        <label className="transform-label">Scale</label>
        <div className="transform-xyz">
          <div className="transform-input-wrapper">
            <label htmlFor="scale-x" className="axis-label">Scale X</label>
            <input
              id="scale-x"
              type="number"
              step="0.1"
              min="0.01"
              value={formatNumber(scale.x)}
              onChange={(e) => handleScaleChange('x', e.target.value)}
              className="transform-input"
            />
          </div>
          <div className="transform-input-wrapper">
            <label htmlFor="scale-y" className="axis-label">Scale Y</label>
            <input
              id="scale-y"
              type="number"
              step="0.1"
              min="0.01"
              value={formatNumber(scale.y)}
              onChange={(e) => handleScaleChange('y', e.target.value)}
              className="transform-input"
              disabled={lockAspectRatio}
            />
          </div>
          <div className="transform-input-wrapper">
            <label htmlFor="scale-z" className="axis-label">Scale Z</label>
            <input
              id="scale-z"
              type="number"
              step="0.1"
              min="0.01"
              value={formatNumber(scale.z)}
              onChange={(e) => handleScaleChange('z', e.target.value)}
              className="transform-input"
              disabled={lockAspectRatio}
            />
          </div>
        </div>
        <div className="transform-checkbox-wrapper">
          <input
            id="lock-aspect"
            type="checkbox"
            checked={lockAspectRatio}
            onChange={(e) => setLockAspectRatio(e.target.checked)}
          />
          <label htmlFor="lock-aspect">Lock Aspect Ratio</label>
        </div>
      </div>
    </div>
  )
}
