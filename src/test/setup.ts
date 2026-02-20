import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})

// Mock canvas 2D context for tests
HTMLCanvasElement.prototype.getContext = function (contextId: string) {
  if (contextId === '2d') {
    return {
      createImageData: (width: number, height: number) => ({
        data: new Uint8ClampedArray(width * height * 4),
        width,
        height,
      }),
      putImageData: () => {},
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({
        data: new Uint8ClampedArray(0),
        width: 0,
        height: 0,
      }),
      canvas: this,
      drawImage: () => {},
    } as any
  }
  return null
}

// Mock Three.js WebGL renderer to avoid context errors in tests
// Use importOriginal to keep all other Three.js functionality intact
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>()

  const noop = () => {}

  class MockWebGLRenderer {
    domElement = document.createElement('canvas')
    setSize = noop
    setPixelRatio = noop
    getPixelRatio = () => 1
    getSize = (target: any) => {
      target.x = 800
      target.y = 600
      return target
    }
    getRenderTarget = () => null
    setRenderTarget = noop
    clear = noop
    render = noop
    dispose = noop
    shadowMap = { enabled: false, type: actual.PCFSoftShadowMap }
    capabilities = {
      isWebGL2: true,
      precision: 'highp',
      logarithmicDepthBuffer: false,
      maxTextures: 16,
      maxVertexTextures: 16,
      maxTextureSize: 16384,
      maxCubemapSize: 16384,
      maxAttributes: 16,
      maxVertexUniforms: 1024,
      maxVaryings: 30,
      maxFragmentUniforms: 1024,
      vertexTextures: true,
      maxSamples: 4,
    }
    extensions = {
      get: () => ({ isWebGL2: true }),
    }
    state = {
      buffers: {
        color: { setClear: noop },
        depth: { setTest: noop, setMask: noop },
        stencil: { setTest: noop, setMask: noop, setFunc: noop, setOp: noop },
      },
    }
  }

  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer as any,
  }
})

// Mock Three.js postprocessing effects
vi.mock('three/examples/jsm/postprocessing/EffectComposer.js', () => {
  const noop = () => {}

  class MockEffectComposer {
    passes: any[] = []

    constructor() {}

    addPass(pass: any) {
      this.passes.push(pass)
    }

    render() {}

    setSize() {}

    setPixelRatio() {}

    dispose() {}
  }

  return {
    EffectComposer: MockEffectComposer,
  }
})

vi.mock('three/examples/jsm/postprocessing/RenderPass.js', () => {
  class MockRenderPass {
    constructor(scene: any, camera: any) {}

    dispose() {}
  }

  return {
    RenderPass: MockRenderPass,
  }
})

vi.mock('three/examples/jsm/postprocessing/OutlinePass.js', () => {
  class MockColor {
    r = 0
    g = 0
    b = 0

    set(color: string) {
      // Parse hex color string
      if (color.startsWith('#')) {
        const hex = color.slice(1)
        this.r = parseInt(hex.slice(0, 2), 16) / 255
        this.g = parseInt(hex.slice(2, 4), 16) / 255
        this.b = parseInt(hex.slice(4, 6), 16) / 255
      }
      return this
    }
  }

  class MockOutlinePass {
    selectedObjects: any[] = []
    edgeStrength = 3
    edgeGlow = 0.5
    edgeThickness = 2
    pulsePeriod = 0
    visibleEdgeColor = new MockColor()
    hiddenEdgeColor = new MockColor()

    constructor(resolution: any, scene: any, camera: any) {
      // Set default yellow color
      this.visibleEdgeColor.set('#ffff00')
      this.hiddenEdgeColor.set('#190a05')
    }

    dispose() {}
  }

  return {
    OutlinePass: MockOutlinePass,
  }
})

vi.mock('three/examples/jsm/postprocessing/OutputPass.js', () => {
  class MockOutputPass {
    constructor() {}

    dispose() {}
  }

  return {
    OutputPass: MockOutputPass,
  }
})
