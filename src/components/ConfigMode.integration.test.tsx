import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ConfigMode from './ConfigMode'

// Mock EXRLoader to prevent actual EXR file loading
vi.mock('three/examples/jsm/loaders/EXRLoader.js', () => {
  class MockEXRLoader {
    load(url: string, onLoad?: Function, onProgress?: Function, onError?: Function) {
      // Simulate immediate error - file not found in test environment
      setTimeout(() => {
        if (onError) {
          const error = new Error(`Failed to parse EXR from ${url}`)
          error.name = 'EXRLoaderError'
          onError(error)
        }
      }, 0)
    }

    setPath() {
      return this
    }

    setDataType() {
      return this
    }
  }

  return {
    EXRLoader: MockEXRLoader
  }
})

describe('ConfigMode Integration', () => {
  let rafSpy: ReturnType<typeof vi.spyOn>
  let rafCallbacks: FrameRequestCallback[] = []

  beforeEach(() => {
    rafCallbacks = []

    // Mock requestAnimationFrame to capture callbacks without running them continuously
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
      rafCallbacks.push(callback)
      return rafCallbacks.length
    })

    // Mock cancelAnimationFrame
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})

    // Mock canvas 2D context for normal map generation
    HTMLCanvasElement.prototype.getContext = vi.fn((contextType, options) => {
      if (contextType === '2d') {
        // Mock Canvas 2D API for createPerlinNoiseNormalMap
        const mockImageData = {
          data: new Uint8ClampedArray(1024 * 1024 * 4), // Pre-allocated array
          width: 1024,
          height: 1024,
        }
        return {
          canvas: document.createElement('canvas'),
          createImageData: vi.fn(() => mockImageData),
          putImageData: vi.fn(),
          getImageData: vi.fn(() => mockImageData),
          fillRect: vi.fn(),
          clearRect: vi.fn(),
          strokeRect: vi.fn(),
          fillText: vi.fn(),
          measureText: vi.fn(() => ({ width: 0 })),
          drawImage: vi.fn(),
          save: vi.fn(),
          restore: vi.fn(),
          scale: vi.fn(),
          rotate: vi.fn(),
          translate: vi.fn(),
          transform: vi.fn(),
          setTransform: vi.fn(),
          resetTransform: vi.fn(),
          createLinearGradient: vi.fn(() => ({
            addColorStop: vi.fn(),
          })),
          createRadialGradient: vi.fn(() => ({
            addColorStop: vi.fn(),
          })),
          createPattern: vi.fn(() => ({})),
          beginPath: vi.fn(),
          closePath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          bezierCurveTo: vi.fn(),
          quadraticCurveTo: vi.fn(),
          arc: vi.fn(),
          arcTo: vi.fn(),
          ellipse: vi.fn(),
          rect: vi.fn(),
          fill: vi.fn(),
          stroke: vi.fn(),
          clip: vi.fn(),
          isPointInPath: vi.fn(() => false),
          isPointInStroke: vi.fn(() => false),
        }
      }

      // Mock WebGL context
      if (contextType === 'webgl2' || contextType === 'webgl') {
        return {
          canvas: document.createElement('canvas'),
          drawingBufferWidth: 800,
          drawingBufferHeight: 600,
          getExtension: vi.fn((name) => {
            // Return proper extension objects based on extension name
            if (name === 'OES_vertex_array_object' || name === 'OES_element_index_uint') {
              return {
                createVertexArrayOES: vi.fn(() => ({})),
                deleteVertexArrayOES: vi.fn(),
                isVertexArrayOES: vi.fn(() => true),
                bindVertexArrayOES: vi.fn(),
                VERTEX_ARRAY_BINDING_OES: 0x85B5,
              }
            }
            if (name === 'WEBGL_draw_buffers') {
              return {
                drawBuffersWEBGL: vi.fn(),
              }
            }
            if (name === 'EXT_texture_filter_anisotropic' || name === 'WEBKIT_EXT_texture_filter_anisotropic') {
              return {
                TEXTURE_MAX_ANISOTROPY_EXT: 0x84FE,
                MAX_TEXTURE_MAX_ANISOTROPY_EXT: 0x84FF,
              }
            }
            // Return generic extension object for others
            return {}
          }),
          getParameter: vi.fn((param) => {
            // Handle both numeric constants and string names
            // VERSION constants
            if (param === 0x1F00 || param === 'VERSION') return 'WebGL 2.0'
            if (param === 0x1F01 || param === 'SHADING_LANGUAGE_VERSION') return 'WebGL GLSL ES 3.00'
            if (param === 0x1F02 || param === 'VENDOR') return 'Test Vendor'
            if (param === 0x1F03 || param === 'RENDERER') return 'Test Renderer'
            // Numeric limits
            if (param === 0x8B8D) return 16 // MAX_VERTEX_ATTRIBS
            if (param === 0x8869) return 16 // MAX_TEXTURE_IMAGE_UNITS
            if (param === 0x8DFD) return 4096 // MAX_TEXTURE_SIZE
            if (param === 0x851C) return 32768 // MAX_CUBE_MAP_TEXTURE_SIZE
            if (param === 0x8CDF) return 16 // MAX_RENDERBUFFER_SIZE
            if (param === 0x8073) return [] // COMPRESSED_TEXTURE_FORMATS
            if (param === 0x0D33) return 16 // MAX_VIEWPORT_DIMS
            if (param === 0x846D) return 4 // ALIASED_POINT_SIZE_RANGE
            if (param === 0x846E) return [1, 1] // ALIASED_LINE_WIDTH_RANGE
            // Default: return string for safety (indexOf compatibility)
            return 'unknown'
          }),
          getSupportedExtensions: vi.fn(() => []), // Return empty array
          createProgram: vi.fn(() => ({})),
          createShader: vi.fn(() => ({})),
          shaderSource: vi.fn(),
          compileShader: vi.fn(),
          attachShader: vi.fn(),
          linkProgram: vi.fn(),
          useProgram: vi.fn(),
          getShaderParameter: vi.fn(() => true),
          getProgramParameter: vi.fn((program, pname) => {
            // Return appropriate values for program queries
            if (pname === 0x8B84) return 0 // ACTIVE_UNIFORMS
            if (pname === 0x8B89) return 0 // ACTIVE_ATTRIBUTES
            if (pname === 0x8B82) return true // LINK_STATUS
            return true
          }),
          getProgramInfoLog: vi.fn(() => ''),
          getShaderInfoLog: vi.fn(() => ''),
          getActiveUniform: vi.fn(() => ({
            name: 'mockUniform',
            size: 1,
            type: 0x1406 // FLOAT
          })),
          getActiveAttrib: vi.fn(() => ({
            name: 'mockAttrib',
            size: 1,
            type: 0x1406 // FLOAT
          })),
          enable: vi.fn(),
          disable: vi.fn(),
          clear: vi.fn(),
          clearColor: vi.fn(),
          clearDepth: vi.fn(),
          clearStencil: vi.fn(),
          colorMask: vi.fn(),
          viewport: vi.fn(),
          getUniformLocation: vi.fn(() => ({})),
          getAttribLocation: vi.fn(() => 0),
          enableVertexAttribArray: vi.fn(),
          vertexAttribPointer: vi.fn(),
          uniform1f: vi.fn(),
          uniform2f: vi.fn(),
          uniform3f: vi.fn(),
          uniform4f: vi.fn(),
          uniformMatrix4fv: vi.fn(),
          createBuffer: vi.fn(() => ({})),
          bindBuffer: vi.fn(),
          bufferData: vi.fn(),
          bufferSubData: vi.fn(),
          deleteBuffer: vi.fn(),
          drawArrays: vi.fn(),
          drawElements: vi.fn(),
          createTexture: vi.fn(() => ({})),
          bindTexture: vi.fn(),
          texImage2D: vi.fn(),
          texParameteri: vi.fn(),
          createFramebuffer: vi.fn(() => ({})),
          bindFramebuffer: vi.fn(),
          framebufferTexture2D: vi.fn(),
          framebufferRenderbuffer: vi.fn(),
          checkFramebufferStatus: vi.fn(() => 0x8cd5), // FRAMEBUFFER_COMPLETE
          createRenderbuffer: vi.fn(() => ({})),
          bindRenderbuffer: vi.fn(),
          renderbufferStorage: vi.fn(),
          deleteRenderbuffer: vi.fn(),
          deleteTexture: vi.fn(),
          deleteFramebuffer: vi.fn(),
          deleteProgram: vi.fn(),
          deleteShader: vi.fn(),
          blendFunc: vi.fn(),
          blendEquation: vi.fn(),
          depthFunc: vi.fn(),
          depthMask: vi.fn(),
          cullFace: vi.fn(),
          frontFace: vi.fn(),
          pixelStorei: vi.fn(),
          activeTexture: vi.fn(),
          generateMipmap: vi.fn(),
          scissor: vi.fn(),
          stencilFunc: vi.fn(),
          stencilOp: vi.fn(),
          stencilMask: vi.fn(),
          lineWidth: vi.fn(),
          polygonOffset: vi.fn(),
          sampleCoverage: vi.fn(),
          compressedTexImage2D: vi.fn(),
          readPixels: vi.fn(),
          drawBuffers: vi.fn(),
          getContextAttributes: vi.fn(() => ({
            alpha: true,
            depth: true,
            stencil: true,
            antialias: true,
            premultipliedAlpha: true,
            preserveDrawingBuffer: false,
            powerPreference: 'default',
            failIfMajorPerformanceCaveat: false,
          })),
          isContextLost: vi.fn(() => false),
        }
      }
      return null
    }) as any
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render without crashing', async () => {
    const onBackToMenu = vi.fn()

    render(<ConfigMode onBackToMenu={onBackToMenu} />)

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText(/Scene Overview/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should render ControlPanel with ObjectTree', async () => {
    const onBackToMenu = vi.fn()

    render(<ConfigMode onBackToMenu={onBackToMenu} />)

    // Wait for component to initialize
    await waitFor(() => {
      // Check if ControlPanel sections are present
      const controlsHeader = screen.getByText('Controls')
      expect(controlsHeader).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should initialize ObjectTree with scene objects', async () => {
    const onBackToMenu = vi.fn()

    render(<ConfigMode onBackToMenu={onBackToMenu} />)

    // Wait for scene initialization
    await waitFor(() => {
      // Look for Scene Objects section (if expanded)
      const sceneObjectsSection = screen.queryByText('📋 Scene Objects')
      // It should exist (even if collapsed)
      expect(sceneObjectsSection).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should handle missing optional props gracefully', async () => {
    const onBackToMenu = vi.fn()

    // Should not crash even without full initialization
    const { container } = render(<ConfigMode onBackToMenu={onBackToMenu} />)

    expect(container).toBeTruthy()
  })
})
