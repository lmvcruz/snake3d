export const wallVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    // Transform to world space for consistent 3D noise sampling
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const wallFragmentShader = `
  uniform float time;
  uniform vec3 baseColor;
  uniform float noiseScale;
  uniform float noiseStrength;
  uniform float brightness;
  uniform vec3 ambientLightColor;
  uniform float ambientLightIntensity;
  uniform vec3 directionalLightColor;
  uniform float directionalLightIntensity;
  uniform vec3 directionalLightDirection;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  // 3D pseudo-random function
  float random3D(vec3 st) {
    return fract(sin(dot(st.xyz, vec3(12.9898, 78.233, 45.164))) * 43758.5453123);
  }

  // 3D smooth noise for true spatial continuity
  float noise3D(vec3 st) {
    vec3 i = floor(st);
    vec3 f = fract(st);

    // 8 corners of the cube
    float a = random3D(i);
    float b = random3D(i + vec3(1.0, 0.0, 0.0));
    float c = random3D(i + vec3(0.0, 1.0, 0.0));
    float d = random3D(i + vec3(1.0, 1.0, 0.0));
    float e = random3D(i + vec3(0.0, 0.0, 1.0));
    float f2 = random3D(i + vec3(1.0, 0.0, 1.0));
    float g = random3D(i + vec3(0.0, 1.0, 1.0));
    float h = random3D(i + vec3(1.0, 1.0, 1.0));

    // Smooth interpolation
    vec3 u = f * f * (3.0 - 2.0 * f);

    // Trilinear interpolation
    return mix(
      mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
      mix(mix(e, f2, u.x), mix(g, h, u.x), u.y),
      u.z
    );
  }

  // 3D Fractal Brownian Motion
  float fbm3D(vec3 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for(int i = 0; i < 4; i++) {
      value += amplitude * noise3D(st * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    // Sample 3D noise directly from world position
    float n = fbm3D(vWorldPosition * noiseScale);

    // Apply noise to base color
    vec3 materialColor = baseColor + vec3(n * noiseStrength);

    // Calculate lighting
    vec3 normal = normalize(vNormal);

    // Ambient light
    vec3 ambient = ambientLightColor * ambientLightIntensity;

    // Directional light (Lambertian diffuse)
    float diffuseFactor = max(dot(normal, -directionalLightDirection), 0.0);
    vec3 diffuse = directionalLightColor * directionalLightIntensity * diffuseFactor;

    // Combine lighting with material color
    vec3 finalColor = materialColor * (ambient + diffuse) * brightness;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`
