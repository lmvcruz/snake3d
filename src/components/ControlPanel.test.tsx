import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within, waitFor, act } from '@testing-library/react'
import ControlPanel from './ControlPanel'

describe('ControlPanel', () => {
  const defaultProps = {
    lighting: {
      ambientIntensity: 1.6,
      ambientColor: '#ffffff',
      directionalIntensity: 2.6,
      directionalColor: '#ffffff',
    },
    onLightingChange: vi.fn(),
    brightness: {
      arenaFloor: 0.5,
      arenaWalls: 0.25,
      externalFloor: 0.0,
      decorations: 0.0,
    },
    onBrightnessChange: vi.fn(),
    snakeVelocity: 1,
    onSnakeVelocityChange: vi.fn(),
    decorationsQuantity: 50,
    onDecorationsQuantityChange: vi.fn(),
    hdriEnabled: true,
    onHdriEnabledChange: vi.fn(),
  }

  describe('Custom Lights Section', () => {
    it('should render Custom Lights section', () => {
      render(<ControlPanel {...defaultProps} />)

      expect(screen.getByText('💡 Custom Lights')).toBeInTheDocument()
    })

    it('should show light controls when section is expanded', () => {
      render(<ControlPanel {...defaultProps} />)

      // Click to expand the Custom Lights section
      const header = screen.getByText('💡 Custom Lights')
      fireEvent.click(header)

      expect(screen.getByText('Add New Light')).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
    })

    it('should have directional light selected by default', () => {
      render(<ControlPanel {...defaultProps} />)

      // Expand section
      fireEvent.click(screen.getByText('💡 Custom Lights'))

      const select = screen.getByRole('combobox')
      expect(select).toHaveValue('directional')
    })

    it('should allow changing light type in dropdown', () => {
      render(<ControlPanel {...defaultProps} />)

      // Expand section
      fireEvent.click(screen.getByText('💡 Custom Lights'))

      const select = screen.getByRole('combobox')

      // Change to point light
      fireEvent.change(select, { target: { value: 'point' } })
      expect(select).toHaveValue('point')

      // Change back to directional
      fireEvent.change(select, { target: { value: 'directional' } })
      expect(select).toHaveValue('directional')
    })

    it('should call onAddLight with directional type when Add button clicked', () => {
      const onAddLight = vi.fn()
      render(<ControlPanel {...defaultProps} onAddLight={onAddLight} />)

      // Expand section
      fireEvent.click(screen.getByText('💡 Custom Lights'))

      // Click Add button (directional is default)
      const addButton = screen.getByRole('button', { name: 'Add' })
      fireEvent.click(addButton)

      expect(onAddLight).toHaveBeenCalledTimes(1)
      expect(onAddLight).toHaveBeenCalledWith('directional')
    })

    it('should call onAddLight with point type when point light selected', () => {
      const onAddLight = vi.fn()
      render(<ControlPanel {...defaultProps} onAddLight={onAddLight} />)

      // Expand section
      fireEvent.click(screen.getByText('💡 Custom Lights'))

      // Change to point light
      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'point' } })

      // Click Add button
      const addButton = screen.getByRole('button', { name: 'Add' })
      fireEvent.click(addButton)

      expect(onAddLight).toHaveBeenCalledTimes(1)
      expect(onAddLight).toHaveBeenCalledWith('point')
    })

    it('should allow adding multiple lights', () => {
      const onAddLight = vi.fn()
      render(<ControlPanel {...defaultProps} onAddLight={onAddLight} />)

      // Expand section
      fireEvent.click(screen.getByText('💡 Custom Lights'))

      const addButton = screen.getByRole('button', { name: 'Add' })
      const select = screen.getByRole('combobox')

      // Add directional light
      fireEvent.click(addButton)
      expect(onAddLight).toHaveBeenNthCalledWith(1, 'directional')

      // Change to point and add
      fireEvent.change(select, { target: { value: 'point' } })
      fireEvent.click(addButton)
      expect(onAddLight).toHaveBeenNthCalledWith(2, 'point')

      // Add another point light
      fireEvent.click(addButton)
      expect(onAddLight).toHaveBeenNthCalledWith(3, 'point')

      expect(onAddLight).toHaveBeenCalledTimes(3)
    })

    it('should not crash if onAddLight is undefined', () => {
      render(<ControlPanel {...defaultProps} />)

      // Expand section
      fireEvent.click(screen.getByText('💡 Custom Lights'))

      // Click Add button - should not crash
      const addButton = screen.getByRole('button', { name: 'Add' })
      expect(() => fireEvent.click(addButton)).not.toThrow()
    })

    it('should have dropdown with correct options', () => {
      render(<ControlPanel {...defaultProps} />)

      // Expand section
      fireEvent.click(screen.getByText('💡 Custom Lights'))

      const select = screen.getByRole('combobox')
      const options = within(select).getAllByRole('option')

      expect(options).toHaveLength(2)
      expect(options[0]).toHaveTextContent('Directional Light')
      expect(options[0]).toHaveValue('directional')
      expect(options[1]).toHaveTextContent('Point Light')
      expect(options[1]).toHaveValue('point')
    })

    it('should maintain selected light type after adding', () => {
      const onAddLight = vi.fn()
      render(<ControlPanel {...defaultProps} onAddLight={onAddLight} />)

      // Expand section
      fireEvent.click(screen.getByText('💡 Custom Lights'))

      const select = screen.getByRole('combobox')
      const addButton = screen.getByRole('button', { name: 'Add' })

      // Change to point light
      fireEvent.change(select, { target: { value: 'point' } })
      expect(select).toHaveValue('point')

      // Add light
      fireEvent.click(addButton)

      // Selection should remain as point
      expect(select).toHaveValue('point')
    })
  })

  describe('Basic Functionality', () => {
    it('should render without crashing', () => {
      render(<ControlPanel {...defaultProps} />)
      expect(screen.getByText('Controls')).toBeInTheDocument()
    })

    it('should collapse and expand when collapse button clicked', () => {
      render(<ControlPanel {...defaultProps} />)

      const collapseButton = screen.getByTitle('Collapse')

      // Initial state - expanded
      expect(screen.getByText('💡 Lighting')).toBeInTheDocument()

      // Collapse
      fireEvent.click(collapseButton)
      expect(screen.queryByText('💡 Lighting')).not.toBeInTheDocument()

      // Expand
      const expandButton = screen.getByTitle('Expand')
      fireEvent.click(expandButton)
      expect(screen.getByText('💡 Lighting')).toBeInTheDocument()
    })
  })

  describe('Save Configuration', () => {
    it('should render Save Configuration button', () => {
      render(<ControlPanel {...defaultProps} />)

      // Expand Configuration section
      fireEvent.click(screen.getByText('⚙️ Configuration'))

      expect(screen.getByRole('button', { name: /Save Configuration/ })).toBeInTheDocument()
    })

    it('should call onConfigSave when Save Configuration button clicked', () => {
      const onConfigSave = vi.fn()
      render(<ControlPanel {...defaultProps} onConfigSave={onConfigSave} />)

      // Expand Configuration section
      fireEvent.click(screen.getByText('⚙️ Configuration'))

      // Click Save Configuration button
      const saveButton = screen.getByRole('button', { name: /Save Configuration/ })
      fireEvent.click(saveButton)

      expect(onConfigSave).toHaveBeenCalledTimes(1)
    })

    it('should show "Saved!" feedback after clicking save', () => {
      vi.useFakeTimers()
      const onConfigSave = vi.fn()
      render(<ControlPanel {...defaultProps} onConfigSave={onConfigSave} />)

      // Expand Configuration section
      fireEvent.click(screen.getByText('⚙️ Configuration'))

      // Click Save Configuration button
      const saveButton = screen.getByRole('button', { name: /Save Configuration/ })
      fireEvent.click(saveButton)

      // Should show "Saved!" feedback
      expect(screen.getByRole('button', { name: /✓ Saved!/ })).toBeInTheDocument()

      // After 2 seconds, should return to normal text
      act(() => {
        vi.runAllTimers()
      })

      expect(screen.queryByRole('button', { name: /✓ Saved!/ })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /💾 Save Configuration/ })).toBeInTheDocument()

      vi.useRealTimers()
    })

    it('should not crash if onConfigSave is undefined', () => {
      render(<ControlPanel {...defaultProps} />)

      // Expand Configuration section
      fireEvent.click(screen.getByText('⚙️ Configuration'))

      // Click Save Configuration button - should not crash
      const saveButton = screen.getByRole('button', { name: /Save Configuration/ })
      expect(() => fireEvent.click(saveButton)).not.toThrow()
    })

    it('should display configuration help text', () => {
      render(<ControlPanel {...defaultProps} />)

      // Expand Configuration section
      fireEvent.click(screen.getByText('⚙️ Configuration'))

      // Check for help text
      expect(screen.getByText(/Click "Save Configuration" to persist your changes/)).toBeInTheDocument()
    })
  })
})
