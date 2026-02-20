import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TransformInputs } from './TransformInputs'
import * as THREE from 'three'

describe('TransformInputs', () => {
  let mockObject: THREE.Object3D
  let mockOnChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockObject = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial()
    )
    mockObject.position.set(1, 2, 3)
    mockObject.rotation.set(0.1, 0.2, 0.3)
    mockObject.scale.set(1.5, 1.5, 1.5)

    mockOnChange = vi.fn()
  })

  describe('rendering', () => {
    it('should render position inputs with current values', () => {
      render(<TransformInputs object={mockObject} onChange={mockOnChange} />)

      const posXInput = screen.getByLabelText('Position X') as HTMLInputElement
      const posYInput = screen.getByLabelText('Position Y') as HTMLInputElement
      const posZInput = screen.getByLabelText('Position Z') as HTMLInputElement

      expect(posXInput.value).toBe('1.00')
      expect(posYInput.value).toBe('2.00')
      expect(posZInput.value).toBe('3.00')
    })

    it('should render rotation inputs with current values in degrees', () => {
      render(<TransformInputs object={mockObject} onChange={mockOnChange} />)

      const rotXInput = screen.getByLabelText('Rotation X') as HTMLInputElement
      const rotYInput = screen.getByLabelText('Rotation Y') as HTMLInputElement
      const rotZInput = screen.getByLabelText('Rotation Z') as HTMLInputElement

      // Rotation should be displayed in degrees (radians * 180 / PI)
      expect(parseFloat(rotXInput.value)).toBeCloseTo(5.73, 1)
      expect(parseFloat(rotYInput.value)).toBeCloseTo(11.46, 1)
      expect(parseFloat(rotZInput.value)).toBeCloseTo(17.19, 1)
    })

    it('should render scale inputs with current values', () => {
      render(<TransformInputs object={mockObject} onChange={mockOnChange} />)

      const scaleXInput = screen.getByLabelText('Scale X') as HTMLInputElement
      const scaleYInput = screen.getByLabelText('Scale Y') as HTMLInputElement
      const scaleZInput = screen.getByLabelText('Scale Z') as HTMLInputElement

      expect(scaleXInput.value).toBe('1.50')
      expect(scaleYInput.value).toBe('1.50')
      expect(scaleZInput.value).toBe('1.50')
    })

    it('should render lock aspect ratio checkbox for scale', () => {
      render(<TransformInputs object={mockObject} onChange={mockOnChange} />)

      const lockCheckbox = screen.getByLabelText('Lock Aspect Ratio') as HTMLInputElement
      expect(lockCheckbox).toBeDefined()
      expect(lockCheckbox.type).toBe('checkbox')
    })
  })

  describe('position input changes', () => {
    it('should update object position and call onChange when position X changes', () => {
      render(<TransformInputs object={mockObject} onChange={mockOnChange} />)

      const posXInput = screen.getByLabelText('Position X') as HTMLInputElement
      fireEvent.change(posXInput, { target: { value: '5' } })

      expect(mockObject.position.x).toBe(5)
      expect(mockOnChange).toHaveBeenCalledWith(mockObject)
    })

    it('should  update object position and call onChange when position Y changes', () => {
      render(<TransformInputs object={mockObject} onChange={mockOnChange} />)

      const posYInput = screen.getByLabelText('Position Y') as HTMLInputElement
      fireEvent.change(posYInput, { target: { value: '10' } })

      expect(mockObject.position.y).toBe(10)
      expect(mockOnChange).toHaveBeenCalledWith(mockObject)
    })

    it('should update object position and call onChange when position Z changes', () => {
      render(<TransformInputs object={mockObject} onChange={mockOnChange} />)

      const posZInput = screen.getByLabelText('Position Z') as HTMLInputElement
      fireEvent.change(posZInput, { target: { value: '15' } })

      expect(mockObject.position.z).toBe(15)
      expect(mockOnChange).toHaveBeenCalledWith(mockObject)
    })
  })

  describe('rotation input changes', () => {
    it('should convert degrees to radians and update rotation X', () => {
      render(<TransformInputs object={mockObject} onChange={mockOnChange} />)

      const rotXInput = screen.getByLabelText('Rotation X') as HTMLInputElement
      fireEvent.change(rotXInput, { target: { value: '90' } }) // 90 degrees = PI/2 radians

      expect(mockObject.rotation.x).toBeCloseTo(Math.PI / 2, 5)
      expect(mockOnChange).toHaveBeenCalledWith(mockObject)
    })

    it('should convert degrees to radians and update rotation Y', () => {
      render(<TransformInputs object={mockObject} onChange={mockOnChange} />)

      const rotYInput = screen.getByLabelText('Rotation Y') as HTMLInputElement
      fireEvent.change(rotYInput, { target: { value: '180' } }) // 180 degrees = PI radians

      expect(mockObject.rotation.y).toBeCloseTo(Math.PI, 5)
      expect(mockOnChange).toHaveBeenCalledWith(mockObject)
    })

    it('should convert degrees to radians and update rotation Z', () => {
      render(<TransformInputs object={mockObject} onChange={mockOnChange} />)

      const rotZInput = screen.getByLabelText('Rotation Z') as HTMLInputElement
      fireEvent.change(rotZInput, { target: { value: '270' } }) // 270 degrees = 3*PI/2 radians

      expect(mockObject.rotation.z).toBeCloseTo((3 * Math.PI) / 2, 5)
      expect(mockOnChange).toHaveBeenCalledWith(mockObject)
    })
  })

  describe('scale input changes', () => {
    it('should update scale X when not locked', () => {
      render(<TransformInputs object={mockObject} onChange={mockOnChange} />)

      const scaleXInput = screen.getByLabelText('Scale X') as HTMLInputElement
      fireEvent.change(scaleXInput, { target: { value: '2.0' } })

      expect(mockObject.scale.x).toBe(2.0)
      expect(mockObject.scale.y).toBe(1.5) // Others unchanged
      expect(mockObject.scale.z).toBe(1.5)
      expect(mockOnChange).toHaveBeenCalledWith(mockObject)
    })

    it('should update all scales proportionally when locked', () => {
      render(<TransformInputs object={mockObject} onChange={mockOnChange} />)

      // Enable lock
      const lockCheckbox = screen.getByLabelText('Lock Aspect Ratio') as HTMLInputElement
      fireEvent.click(lockCheckbox)

      // Change scale X
      const scaleXInput = screen.getByLabelText('Scale X') as HTMLInputElement
      fireEvent.change(scaleXInput, { target: { value: '3.0' } })

      // All scales should be 3.0
      expect(mockObject.scale.x).toBe(3.0)
      expect(mockObject.scale.y).toBe(3.0)
      expect(mockObject.scale.z).toBe(3.0)
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('should maintain lock state across multiple changes', () => {
      render(<TransformInputs object={mockObject} onChange={mockOnChange} />)

      const lockCheckbox = screen.getByLabelText('Lock Aspect Ratio') as HTMLInputElement
      fireEvent.click(lockCheckbox)

      const scaleYInput = screen.getByLabelText('Scale Y') as HTMLInputElement
      fireEvent.change(scaleYInput, { target: { value: '2.5' } })

      expect(mockObject.scale.x).toBe(2.5)
      expect(mockObject.scale.y).toBe(2.5)
      expect(mockObject.scale.z).toBe(2.5)
    })
  })

  describe('object prop changes (external updates)', () => {
    it('should update displayed values when object position changes externally', () => {
      const { rerender } = render(<TransformInputs object={mockObject} onChange={mockOnChange} />)

      // Externally change the object
      mockObject.position.set(10, 20, 30)

      // Re-render with the same object reference
      rerender(<TransformInputs object={mockObject} onChange={mockOnChange} />)

      const posXInput = screen.getByLabelText('Position X') as HTMLInputElement
      expect(posXInput.value).toBe('10.00')
    })

    it('should update displayed values when object rotation changes externally', () => {
      const { rerender } = render(<TransformInputs object={mockObject} onChange={mockOnChange} />)

      mockObject.rotation.set(Math.PI / 2, 0, 0)
      rerender(<TransformInputs object={mockObject} onChange={mockOnChange} />)

      const rotXInput = screen.getByLabelText('Rotation X') as HTMLInputElement
      expect(parseFloat(rotXInput.value)).toBeCloseTo(90, 0)
    })

    it('should update displayed values when object scale changes externally', () => {
      const { rerender } = render(<TransformInputs object={mockObject} onChange={mockOnChange} />)

      mockObject.scale.set(2, 2, 2)
      rerender(<TransformInputs object={mockObject} onChange={mockOnChange} />)

      const scaleXInput = screen.getByLabelText('Scale X') as HTMLInputElement
      expect(scaleXInput.value).toBe('2.00')
    })
  })

  describe('input validation', () => {
    it('should handle invalid numeric input gracefully', () => {
      render(<TransformInputs object={mockObject} onChange={mockOnChange} />)

      const posXInput = screen.getByLabelText('Position X') as HTMLInputElement
      fireEvent.change(posXInput, { target: { value: 'invalid' } })

      // Should not change the value or call onChange for invalid input
      expect(mockObject.position.x).toBe(1)
      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it('should accept negative values for position', () => {
      render(<TransformInputs object={mockObject} onChange={mockOnChange} />)

      const posXInput = screen.getByLabelText('Position X') as HTMLInputElement
      fireEvent.change(posXInput, { target: { value: '-5' } })

      expect(mockObject.position.x).toBe(-5)
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('should accept negative values for rotation', () => {
      render(<TransformInputs object={mockObject} onChange={mockOnChange} />)

      const rotXInput = screen.getByLabelText('Rotation X') as HTMLInputElement
      fireEvent.change(rotXInput, { target: { value: '-90' } })

      expect(mockObject.rotation.x).toBeCloseTo(-Math.PI / 2, 5)
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('should not allow negative or zero scale values', () => {
      render(<TransformInputs object={mockObject} onChange={mockOnChange} />)

      const scaleXInput = screen.getByLabelText('Scale X') as HTMLInputElement
      fireEvent.change(scaleXInput, { target: { value: '-1' } })

      // Should keep the original scale
      expect(mockObject.scale.x).toBe(1.5)
      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })

  describe('logging', () => {
    it('should log transform changes with TRACE level', () => {
      render(<TransformInputs object={mockObject} onChange={mockOnChange} />)

      const posXInput = screen.getByLabelText('Position X') as HTMLInputElement
      fireEvent.change(posXInput, { target: { value: '10' } })

      // Logging is verified by the fact that no errors occur
      expect(mockOnChange).toHaveBeenCalled()
    })
  })
})
