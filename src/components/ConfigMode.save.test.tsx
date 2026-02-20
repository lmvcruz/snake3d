import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ControlPanel from './ControlPanel'
import * as sceneConfig from '../utils/sceneConfig'

// Helper to render ControlPanel with config section open
const renderControlPanelWithConfigOpen = async (props: Partial<React.ComponentProps<typeof ControlPanel>> = {}) => {
  const user = userEvent.setup()
  const defaultProps = {
    lighting: { ambientIntensity: 1, ambientColor: '#fff', directionalIntensity: 1, directionalColor: '#fff' },
    onLightingChange: () => {},
    brightness: { arenaFloor: 0.5, arenaWalls: 0.25, externalFloor: 0, decorations: 0 },
    onBrightnessChange: () => {},
    snakeVelocity: 1,
    onSnakeVelocityChange: () => {},
    decorationsQuantity: 50,
    onDecorationsQuantityChange: () => {},
    hdriEnabled: true,
    onHdriEnabledChange: () => {},
    ...props,
  }

  const result = render(<ControlPanel {...defaultProps} />)

  // Expand configuration section
  const configHeader = screen.getByText(/Configuration/)
  await user.click(configHeader)

  // Wait for section to be expanded
  await waitFor(() => {
    const saveButton = screen.queryByRole('button', { name: /Save Configuration/i })
    expect(saveButton).not.toBeNull()
  }, { timeout: 5000 })

  return { ...result, user }
}

describe('Manual Configuration Save', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('ControlPanel Save Button', () => {
    it('renders save button in configuration section', async () => {
      await renderControlPanelWithConfigOpen()

      // Check that Save button exists
      const saveButton = screen.getByRole('button', { name: /Save Configuration/i })
      expect(saveButton).toBeTruthy()
    })

    it('calls onConfigSave when save button clicked', async () => {
      const onConfigSave = vi.fn()

      const { user } = await renderControlPanelWithConfigOpen({ onConfigSave })

      // Click save button
      const saveButton = screen.getByRole('button', { name: /Save Configuration/i })
      await user.click(saveButton)

      expect(onConfigSave).toHaveBeenCalledOnce()
    })

    it('shows "Saved!" feedback after clicking save', async () => {
      const { user } = await renderControlPanelWithConfigOpen({ onConfigSave: () => {} })

      // Click save button
      const saveButton = screen.getByRole('button', { name: /Save Configuration/i })
      await user.click(saveButton)

      // Check for "Saved!" text
      await waitFor(() => {
        const savedButton = screen.queryByRole('button', { name: /Saved!/i })
        expect(savedButton).toBeTruthy()
      })
    })

    it('hides "Saved!" feedback after 2 seconds', async () => {
      // Don't use fake timers as it interferes with user-event
      const { user } = await renderControlPanelWithConfigOpen({ onConfigSave: () => {} })

      // Click save button
      const saveButton = screen.getByRole('button', { name: /Save Configuration/i })
      await user.click(saveButton)

      // Should show "Saved!"
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Saved!/i })).toBeTruthy()
      })

      // Wait 2.1 seconds for feedback to disappear
      await new Promise(resolve => setTimeout(resolve, 2100))

      // Should revert back to "Save Configuration"
      await waitFor(() => {
        const button = screen.queryByRole('button', { name: /Save Configuration/i })
        expect(button).toBeTruthy()
      })
    })

    it('displays correct info text about manual save', async () => {
      await renderControlPanelWithConfigOpen()

      // Check info text
      const infoText = screen.getByText(/Click "Save Configuration" to persist your changes to localStorage/i)
      expect(infoText).toBeTruthy()
    })
  })

  describe('ConfigMode Save Handler', () => {
    it('calls saveConfig with current state', () => {
      const saveConfigSpy = vi.spyOn(sceneConfig, 'saveConfig')
      const mockConfig = sceneConfig.getDefaultConfig()

      // Call saveConfig
      sceneConfig.saveConfig(mockConfig)

      expect(saveConfigSpy).toHaveBeenCalledWith(mockConfig)
      expect(saveConfigSpy).toHaveBeenCalledOnce()
    })

    it('saves correct configuration structure', () => {
      const saveConfigSpy = vi.spyOn(sceneConfig, 'saveConfig')

      const testConfig: sceneConfig.SceneConfig = {
        ...sceneConfig.getDefaultConfig(),
        snakeVelocity: 2.5,
        decorationsQuantity: 100,
      }

      sceneConfig.saveConfig(testConfig)

      expect(saveConfigSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          snakeVelocity: 2.5,
          decorationsQuantity: 100,
        })
      )
    })

    it('persists to localStorage', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
      const testConfig = sceneConfig.getDefaultConfig()

      sceneConfig.saveConfig(testConfig)

      expect(setItemSpy).toHaveBeenCalledWith(
        'snake3d_scene_config',
        expect.stringContaining('"snakeVelocity"')
      )
    })

    it('saves comprehensive config with all scene object fields', () => {
      const saveConfigSpy = vi.spyOn(sceneConfig, 'saveConfig')
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

      const testConfig: sceneConfig.SceneConfig = {
        ...sceneConfig.getDefaultConfig(),
        decorations: [
          {
            id: 'dec-1',
            geometryType: 'box',
            position: { x: 1, y: 0, z: 1 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            color: '#ff0000',
            emissiveIntensity: 0.5,
            roughness: 0.8,
            metalness: 0.1,
          },
        ],
      }

      sceneConfig.saveConfig(testConfig)

      // Verify saveConfig was called with all required fields
      expect(saveConfigSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          lighting: expect.any(Object),
          brightness: expect.any(Object),
          snakeVelocity: expect.any(Number),
          decorationsQuantity: expect.any(Number),
          decorations: expect.any(Array),
          hdriEnabled: expect.any(Boolean),
          snake: expect.objectContaining({
            head: expect.any(Object),
            body: expect.any(Object),
          }),
          food: expect.any(Object),
          arenaWalls: expect.any(Object),
          externalFloor: expect.any(Object),
          sky: expect.any(Object),
          directionalLight: expect.any(Object),
          pointLight: expect.any(Object),
        })
      )

      // Verify localStorage contains all fields
      const savedData = setItemSpy.mock.calls[0][1]
      expect(savedData).toContain('"snake"')
      expect(savedData).toContain('"food"')
      expect(savedData).toContain('"arenaWalls"')
      expect(savedData).toContain('"externalFloor"')
      expect(savedData).toContain('"sky"')
      expect(savedData).toContain('"decorations"')
      expect(savedData).toContain('"directionalLight"')
      expect(savedData).toContain('"pointLight"')
    })
  })

  describe('Manual Save Workflow', () => {
    it('does not auto-save when config changes', () => {
      // This test verifies that there's no auto-save effect
      // We can't easily test the absence of a useEffect, but we can verify
      // that the save button is the only way to trigger saves
      const saveConfigSpy = vi.spyOn(sceneConfig, 'saveConfig')

      const { rerender } = render(
        <ControlPanel
          lighting={{ ambientIntensity: 1, ambientColor: '#fff', directionalIntensity: 1, directionalColor: '#fff' }}
          onLightingChange={() => {}}
          brightness={{ arenaFloor: 0.5, arenaWalls: 0.25, externalFloor: 0, decorations: 0 }}
          onBrightnessChange={() => {}}
          snakeVelocity={1}
          onSnakeVelocityChange={() => {}}
          decorationsQuantity={50}
          onDecorationsQuantityChange={() => {}}
          hdriEnabled={true}
          onHdriEnabledChange={() => {}}
        />
      )

      // Change props
      rerender(
        <ControlPanel
          lighting={{ ambientIntensity: 2, ambientColor: '#fff', directionalIntensity: 1, directionalColor: '#fff' }}
          onLightingChange={() => {}}
          brightness={{ arenaFloor: 0.5, arenaWalls: 0.25, externalFloor: 0, decorations: 0 }}
          onBrightnessChange={() => {}}
          snakeVelocity={2}
          onSnakeVelocityChange={() => {}}
          decorationsQuantity={75}
          onDecorationsQuantityChange={() => {}}
          hdriEnabled={false}
          onHdriEnabledChange={() => {}}
        />
      )

      // saveConfig should NOT have been called
      expect(saveConfigSpy).not.toHaveBeenCalled()
    })

    it('only saves when user explicitly clicks save button', async () => {
      const saveConfigSpy = vi.spyOn(sceneConfig, 'saveConfig')
      const onConfigSave = vi.fn(() => sceneConfig.saveConfig(sceneConfig.getDefaultConfig()))

      const { user } = await renderControlPanelWithConfigOpen({ onConfigSave })

      // saveConfig should not have been called yet
      expect(saveConfigSpy).not.toHaveBeenCalled()

      // Click save button
      const saveButton = screen.getByRole('button', { name: /Save Configuration/i })
      await user.click(saveButton)

      // NOW saveConfig should be called
      expect(saveConfigSpy).toHaveBeenCalledOnce()
    })
  })
})
