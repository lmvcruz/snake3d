import * as THREE from 'three'

export interface LightingResult {
  ambientLight: THREE.AmbientLight
  hemisphereLight: THREE.HemisphereLight
  directionalLight: THREE.DirectionalLight
  updateLighting: (params: {
    ambientIntensity?: number
    ambientColor?: string
    directionalIntensity?: number
    directionalColor?: string
  }) => void
}

export function setupLighting(
  scene: THREE.Scene,
  wallMaterial: THREE.ShaderMaterial
): LightingResult {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.6)
  scene.add(ambientLight)

  // Hemisphere light for natural outdoor lighting
  const hemisphereLight = new THREE.HemisphereLight(
    0x87ceeb, // Sky color (light blue)
    0x362816, // Ground color (dark brown)
    0.6
  )
  hemisphereLight.position.set(0, 50, 0)
  scene.add(hemisphereLight)

  // Directional light (sun) with shadows
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2.6)
  directionalLight.position.set(10, 20, 10)
  directionalLight.castShadow = true

  // Configure shadow properties
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  directionalLight.shadow.camera.near = 0.5
  directionalLight.shadow.camera.far = 500
  directionalLight.shadow.camera.left = -30
  directionalLight.shadow.camera.right = 30
  directionalLight.shadow.camera.top = 30
  directionalLight.shadow.camera.bottom = -30
  directionalLight.shadow.bias = -0.0001

  scene.add(directionalLight)

  // Function to update lighting from external controls
  const updateLighting = (
    params: {
      ambientIntensity?: number
      ambientColor?: string
      directionalIntensity?: number
      directionalColor?: string
    }
  ) => {
    if (params.ambientIntensity !== undefined) {
      ambientLight.intensity = params.ambientIntensity
      wallMaterial.uniforms.ambientLightIntensity.value = params.ambientIntensity
    }
    if (params.ambientColor !== undefined) {
      ambientLight.color.set(params.ambientColor)
      wallMaterial.uniforms.ambientLightColor.value.set(params.ambientColor)
    }
    if (params.directionalIntensity !== undefined) {
      directionalLight.intensity = params.directionalIntensity
      wallMaterial.uniforms.directionalLightIntensity.value = params.directionalIntensity
    }
    if (params.directionalColor !== undefined) {
      directionalLight.color.set(params.directionalColor)
      wallMaterial.uniforms.directionalLightColor.value.set(params.directionalColor)
    }
  }

  return {
    ambientLight,
    hemisphereLight,
    directionalLight,
    updateLighting
  }
}
