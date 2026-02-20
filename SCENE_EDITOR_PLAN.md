# Scene Editor Implementation Plan

## 1. Configuration System Enhancement

**Extend sceneConfig.ts:**
- Add `lights` array storing: id, type (directional/point), position, rotation, intensity, color, enabled, castShadow
- Add `decorations` array storing: id, geometryType, position, rotation, scale, color, materialProperties
- Add object group properties: arena (floor/walls materials), snake (head/body), food, externalFloor, sky
- Keep existing lighting/brightness structure for backward compatibility

## 2. Light Management System

**Create light factory (`src/scene/lights.ts`):**
- Function to spawn directional light at default position (0, 10, 5)
- Function to spawn point light at default position (0, 5, 0)
- Each light gets unique ID (uuid)
- Return light + helper (DirectionalLightHelper / PointLightHelper)

**Add to ControlPanel:**
- "Add Light" button with dropdown (Directional/Point)
- Collapsible "Lights" section listing all lights
- Each light entry shows: type icon, name, visibility toggle, delete button
- When light selected: show intensity slider, color picker, position/rotation inputs

## 3. Decoration System Refactor

**Modify createDecorativeElements:**
- Accept optional decorations array from config
- If provided, recreate exact decorations (position, rotation, scale, color)
- If quantity increased, generate new random decorations and append
- Return decorations with all properties needed for saving

**Decoration data structure:**
- geometryType: 'box' | 'sphere' | 'cone' | 'cylinder' | 'torus'
- position: [x, y, z]
- rotation: [x, y, z] (euler angles)
- scale: [x, y, z]
- color: hex string
- emissiveIntensity: number

**Add Snake and Food to Scene:**
- Create snake head (CapsuleGeometry or similar) at position (0, 0.5, 0)
- Create 5 body segments behind head with spacing
- Each segment slightly smaller than previous
- Create food (SphereGeometry with slight glow) at random valid position
- Both snake and food should be visible in overview scene for editing

## 4. Selection System

**Create SelectionManager class:**
- Handle raycasting on mouse click
- Maintain selectedObject reference
- Emit selection events (select/deselect)
- Filter selectable objects:
  - **Transformable:** lights, decorations (can be moved/rotated/scaled)
  - **Material-only:** snake, food, external floor (selectable but no transform controls)
  - **Not selectable:** arena floor, arena walls, sky

**Create ObjectTree component:**
- Hierarchical collapsible tree structure:
  - Lights (collapsible)
    - Directional Light 1 (collapsible for properties)
    - Point Light 2
  - Decorations (collapsible)
    - Decoration 1 (type badge)
    - Decoration 2
  - Arena (collapsible) - view only, not selectable
    - Floor
    - Walls
  - Snake (collapsible) - selectable, material-only
    - Head
    - Body
  - Food - selectable, material-only
  - External Floor - selectable, material-only
  - Sky - view only, not selectable
- Clicking item selects object in scene
- Selected item highlighted in tree
- Material-only items show different icon/badge

**Visual feedback:**
- Create outline shader pass (OutlinePass from three/addons)
- Apply to selected object with configurable color/thickness

## 5. Transform System

**Integrate TransformControls:**
- Import from 'three/examples/jsm/controls/TransformControls.js'
- Create single instance, attach to selected object **only if transformable**
- **Do NOT attach to material-only objects:** snake, food, external floor
- Add mode buttons in panel: Translate | Rotate | Scale (hide for material-only)
- Listen to 'change' event to sync numeric inputs
- Listen to 'objectChange' event to update config
- Disable OrbitControls during transform drag

**Numeric inputs:**
- Position X/Y/Z inputs (step 0.1) - only for transformable objects
- Rotation X/Y/Z inputs (step 1 degree) - only for transformable objects
- Scale X/Y/Z inputs (step 0.1) with lock aspect ratio toggle - only for transformable objects
- Bidirectional binding: input change → update transform, transform change → update input
- Hidden when material-only object selected

## 6. Control Panel Reorganization

**New structure:**
- Scene Objects (new collapsible section at top)
  - Shows ObjectTree component
  - Selected object properties below tree
- Lights (existing section, modified)
  - Add Light button
  - Current light properties when selected
- Decorations (new section)
  - Quantity slider
  - Randomize All button
  - Selected decoration properties
- Arena (existing sections)
  - Floor: color, emissive intensity, roughness, metalness
  - Walls: base color, noise scale, noise strength, brightness, two-tone colors (light/dark)
- Snake
  - Head: color, emissive, material properties
  - Body: color, emissive, segment spacing, material properties
- Food
  - Color, emissive intensity, scale, material properties
- External Floor
  - Base color, emissive intensity, normal map intensity, normal map scale, roughness, metalness
- Sky
  - Background type (solid color / gradient / skybox), colors, intensity

**Selected object panel:**
- **For transformable objects (lights, decorations):**
  - Transform inputs (position/rotation/scale)
  - Type-specific properties:
    - Light: intensity, color, castShadow toggle, type-specific (angle, distance)
    - Decoration: color, emissiveIntensity, materialType
  - Delete button
- **For material-only objects (snake, food, external floor):**
  - Material properties only (color, emissive, roughness, metalness, scale)
  - No transform inputs
  - No delete button (permanent scene objects)

## 7. Save/Load Integration

**Manual save system:**
- Add "Save Configuration" button in config section (next to export/import/reset)
- User clicks button when ready to persist changes
- No auto-save to avoid excessive IO operations
- Visual feedback: button briefly shows "Saved!" after successful save

**Load sequence:**
- Load config from localStorage
- Recreate lights at saved positions with helpers
- Recreate decorations with exact saved properties
- If decoration quantity changed, handle add/remove
- Apply saved properties to arena/snake/food/etc.

**Config file structure:**
```typescript
{
  lighting: { ... }, // existing
  brightness: { ... }, // existing
  lights: [
    { id, type, position, rotation, intensity, color, enabled, castShadow }
  ],
  decorations: [
    { id, type, position, rotation, scale, color, emissiveIntensity }
  ],
  arena: {
    floor: { color, emissive, roughness, metalness },
    walls: { baseColor, noiseScale, noiseStrength, brightness, lightColor, darkColor }
  },
  snake: {
    head: { color, emissive, roughness, metalness, scale },
    body: { color, emissive, roughness, metalness, segmentSpacing }
  },
  food: { color, emissive, roughness, metalness, scale },
  externalFloor: {
    color, emissive, roughness, metalness,
    normalMapIntensity, normalMapScale
  },
  sky: {
    type: 'solid' | 'gradient' | 'skybox',
    solidColor, // for solid
    topColor, bottomColor, // for gradient
    skyboxPath, // for skybox
    intensity
  }
}
```

## Sky Control Options Explained

The sky in Three.js is controlled by `scene.background`. There are three main approaches:

### 1. Solid Color (Simplest)
```javascript
scene.background = new THREE.Color(0x1a1a2e) // Dark blue
```
- **Controls:** Single color picker
- **Use case:** Simple flat background, current implementation
- **Performance:** Best

### 2. Gradient (Two-color blend)
```javascript
// Create vertical gradient texture
const canvas = document.createElement('canvas')
canvas.width = 2
canvas.height = 256
const ctx = canvas.getContext('2d')
const gradient = ctx.createLinearGradient(0, 0, 0, 256)
gradient.addColorStop(0, topColor) // Sky color
gradient.addColorStop(1, bottomColor) // Horizon color
ctx.fillStyle = gradient
ctx.fillRect(0, 0, 2, 256)

const texture = new THREE.CanvasTexture(canvas)
scene.background = texture
```
- **Controls:** Top color picker, bottom color picker
- **Use case:** Realistic sky with horizon effect
- **Performance:** Good

### 3. Skybox (6 images for cube-mapped sky)
```javascript
const loader = new THREE.CubeTextureLoader()
const texture = loader.load([
  'px.jpg', 'nx.jpg', // +X, -X
  'py.jpg', 'ny.jpg', // +Y, -Y
  'pz.jpg', 'nz.jpg'  // +Z, -Z
])
scene.background = texture
```
- **Controls:** File paths or preset selector (day, sunset, night, space)
- **Use case:** Immersive environments, realistic reflections
- **Performance:** Higher memory usage

### 4. Environment Map (HDR for realistic lighting)
```javascript
const rgbeLoader = new RGBELoader()
rgbeLoader.load('environment.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping
  scene.background = texture
  scene.environment = texture // Also affects material reflections
})
```
- **Controls:** HDR file path, intensity/exposure
- **Use case:** Photorealistic rendering, affects material appearance
- **Performance:** Higher processing

**Recommendation for your scene:**
Start with **Solid Color** (already implemented). Add **Gradient** option for more visual interest. Skybox can be added later if you want dramatic environments (sunset arena, night mode, etc.).



## Implementation Order

### Step 0: Fix HDRI/Sky Background Initialization
**Goal:** Investigate and fix why HDRI environment map is not visible in arena/warmup/config modes

**TDD Approach:**
- Check existing tests for scene background
- Create test: HDRI loads successfully and sets scene.background
- Create test: Fallback to solid color on HDRI load failure

**Implementation:**
- Check HDRI path resolution in dev vs production (base: '/snake3d/')
- Verify RGBELoader import and texture.mapping
- Add error logging to identify load failures
- Enable HDRI in ConfigMode (currently commented out)
- Test with browser dev tools network tab
- Fix path if needed (might need import.meta.env.BASE_URL)

**Acceptance:**
- HDRI visible as background in all three modes (Game: arena/warmup, ConfigMode)
- Console shows no HDRI load errors
- Tests verify background is set correctly

---

### Quick Enhancement: HDRI Toggle Button
**Description:** Add enable/disable toggle for HDRI to help verify visual difference

**Tasks:**
- Add "Enable HDRI" checkbox to ControlPanel sky section
- When unchecked, use solid color background (0x1a1a2e)
- When checked, load HDRI environment map
- Persist HDRI enabled state in sceneConfig
- Log toggle state changes with INFO level
- Write tests for toggle behavior

**Acceptance:**
- Checkbox visible in control panel
- Toggling checkbox switches between HDRI and solid color
- State persists across page reload
- Tests verify toggle functionality
- Logs show HDRI toggle events

---

### Step 1: Extend sceneConfig.ts
**Description:** Add configuration interfaces for all new scene objects and their properties

**Tasks:**
- Add TRACE log level to logger utility (LogLevel enum)
- Create interfaces: SnakeConfig, FoodConfig, SkyConfigExtended
- Add normalMap properties to ExternalFloorConfig
- Add perlinNoise properties to ArenaWallsConfig
- Extend SceneConfig with new fields
- Update loadConfig to merge new fields with defaults
- Update saveConfig to persist all new fields
- Write tests for config serialization/deserialization

**Acceptance:**
- All new config interfaces defined with proper TypeScript types
- loadConfig/saveConfig handle new fields correctly
- Tests verify config round-trip (save → load → verify)
- Logger has TRACE level available
- No breaking changes to existing config structure

---

### Step 2: Create Snake and Food in ConfigMode
**Description:** Add visual snake (head + 4 body spheres) and food object to configuration scene for editing

**Tasks:**
- Create `createSnake()` function: head CapsuleGeometry + 4 body SphereGeometries
- Position body segments with spacing behind head
- Create `createFood()` function: SphereGeometry with emissive material
- Add snake and food to overview scene in ConfigMode
- Store references for later manipulation
- Log creation with TRACE level (positions, materials)
- Write tests for snake/food geometry creation
- Write tests for proper positioning and spacing

**Acceptance:**
- Snake visible in ConfigMode with head + 4 distinct body spheres
- Food visible at designated position
- All objects properly positioned and scaled
- Tests verify correct geometry types and counts
- Logs show creation details at TRACE level

---

### Step 3: Create Light Factory
**Description:** Implement light creation system with unique IDs and visual helpers

**Tasks:**
- Create `src/scene/lights.ts` module
- Implement `createDirectionalLight(config)` returning {light, helper}
- Implement `createPointLight(config)` returning {light, helper}
- Use uuid for unique light IDs
- Add "Add Light" button to ControlPanel with type dropdown
- Log light creation with INFO level
- Write tests for light factory functions
- Write tests for helper attachment
- Write tests for UI button interaction

**Acceptance:**
- Clicking "Add Light" creates new light in scene
- Light has unique ID, proper type, and visible helper
- Helper follows light position
- Tests verify light properties match configuration
- Tests verify UI interaction creates light
- Logs show light addition events

---

### Step 4: Implement SelectionManager
**Description:** Build object selection system using raycasting for click-to-select functionality

**Tasks:**
- Create `SelectionManager` class with raycaster
- Implement `handleClick(event, camera, selectableObjects)` method
- Emit selection events (EventEmitter or callback)
- Track currently selected object
- Filter selectable objects:
  - **Include:** lights, decorations (with transform), snake, food, external floor (without transform)
  - **Exclude:** arena floor, arena walls
- Mark objects as transformable or material-only (snake, food, external floor are material-only)
- Log selections with INFO level (object type, ID, transformable status)
- Write tests for raycasting logic
- Write tests for selection state management
- Write integration test with real Three.js scene

**Acceptance:**
- Clicking object in scene selects it
- Selection state updates correctly
- Non-selectable objects (arena floor, walls) ignored
- Snake, food, and external floor are selectable but marked as material-only
- Tests verify raycasting with mocked scene
- Integration test verifies real Three.js selection
- Logs show object selection events with type classification

---

### Step 5: Add TransformControls
**Description:** Integrate Three.js TransformControls for object manipulation with OrbitControls conflict handling

**Tasks:**
- Import TransformControls from 'three/examples/jsm/controls/TransformControls.js'
- Create single TransformControls instance
- Attach to selected object on selection change **ONLY if object is transformable**
- **Do NOT attach TransformControls to:** snake, food, external floor (material-only objects)
- Add mode buttons: Translate | Rotate | Scale (hide for material-only objects)
- Disable OrbitControls during transform drag ('mouseDown' event)
- Re-enable OrbitControls after drag ('mouseUp' event)
- Log transform changes with DEBUG level
- Write tests for mode switching
- Write tests for OrbitControls enable/disable
- Write tests for material-only object selection (no transform controls shown)
- Write integration test for transform behavior

**Acceptance:**
- Transform gizmo appears on selected transformable objects (lights, decorations)
- Transform gizmo does NOT appear on material-only objects (snake, food, external floor)
- Mode buttons visible only when transformable object selected
- Dragging gizmo moves/rotates/scales transformable objects
- OrbitControls disabled during drag, enabled after
- Tests verify mode switching logic
- Tests verify material-only objects don't show transform controls
- Integration test verifies real transform behavior
- Logs show transform operations

---

### Step 6: Create ObjectTree Component
**Description:** Build hierarchical tree UI for scene object selection and organization

**Tasks:**
- Create `ObjectTree.tsx` component
- Implement collapsible tree structure:
  - Lights (transformable), Decorations (transformable)
  - Arena (Floor/Walls) - view only, not selectable
  - Snake (Head/Body) - selectable, material-only
  - Food - selectable, material-only
  - External Floor - selectable, material-only
  - Sky - view only, not selectable
- Add expand/collapse icons
- Add visual badges/icons to distinguish transformable vs material-only objects
- Highlight selected item
- Wire up click handlers to select in scene (only for selectable objects)
- Sync selection: tree ↔ scene (bidirectional)
- Disable selection for Arena/Sky items (they're informational only)
- Log tree interactions with DEBUG level
- Write tests for tree rendering
- Write tests for expand/collapse state
- Write tests for selection syncing
- Write tests for transformable vs material-only object handling

**Acceptance:**
- Tree displays all scene objects hierarchically with proper classification
- Clicking selectable tree item (lights, decorations, snake, food, external floor) selects object in scene
- Clicking scene object highlights tree item
- Arena and Sky items are not selectable (informational only)
- Visual distinction between transformable and material-only objects
- Expand/collapse works for all groups
- Tests verify tree structure and interactions
- Tests verify selection filtering
- Logs show tree selection events

---

### Step 7: Add Selection Feedback
**Description:** Implement visual outline effect on selected objects using OutlinePass shader

**Tasks:**
- Import OutlinePass from 'three/examples/jsm/postprocessing/OutlinePass.js'
- Add composer and OutlinePass to render pipeline
- Update OutlinePass.selectedObjects on selection change
- Configure outline color (e.g., yellow) and thickness
- Log outline updates with TRACE level
- Write tests for OutlinePass configuration
- Write integration test for outline rendering

**Acceptance:**
- Selected object shows colored outline
- Outline updates immediately on selection change
- Outline removed when deselected
- Tests verify OutlinePass configuration
- Integration test verifies visual feedback
- Logs show outline state changes

---

### Step 8: Refactor Decorations
**Description:** Make decoration system fully deterministic based on configuration data

**Tasks:**
- Modify `createDecorativeElements` to accept decorations array
- If decorations provided, recreate exact objects from config
- If quantity increased, generate new random decorations
- Return decoration data array with all properties
- Store decoration references for selection
- Log decoration generation with DEBUG level
- Write tests for deterministic recreation
- Write tests for quantity changes

**Acceptance:**
- Loading config recreates exact same decorations
- Increasing quantity adds new decorations, keeps existing
- Decoration data includes: type, position, rotation, scale, color
- Tests verify deterministic generation
- Tests verify quantity handling
- Logs show decoration operations

---

### Step 9: Wire Up Manual Save
**Description:** Add "Save Configuration" button that persists all changes to localStorage

**Tasks:**
- Add "Save Configuration" button to ControlPanel config section
- Handle click: call saveConfig() with current scene state
- Collect: lights, decorations, snake, food, arena, external floor, sky settings
- Show "Saved!" feedback for 2 seconds after successful save
- Log save operations with INFO level (what changed)
- Write tests for save button interaction
- Write tests for config assembly
- Write tests for visual feedback

**Acceptance:**
- Save button visible in control panel
- Clicking button saves all current settings
- Visual feedback confirms save
- Config persists to localStorage
- Tests verify button handler
- Tests verify config completeness
- Logs show save operations with summary

---

### Step 10: Add Numeric Inputs
**Description:** Create bidirectional numeric inputs for precise transform control

**Tasks:**
- Add Position X/Y/Z inputs (step 0.1)
- Add Rotation X/Y/Z inputs (step 1 degree)
- Add Scale X/Y/Z inputs (step 0.1) with lock aspect ratio toggle
- Input change → update TransformControls
- TransformControls change → update input values
- Log input changes with TRACE level
- Write tests for input → transform
- Write tests for transform → input
- Write tests for aspect ratio lock

**Acceptance:**
- Numeric inputs display current transform values
- Typing in input updates object in scene
- Dragging gizmo updates input values
- Aspect ratio lock works for scale
- Tests verify bidirectional binding
- Logs show input value changes

---

### Step 11: Reorganize Control Panel
**Description:** Restructure control panel with sections for all scene object properties, including comprehensive material controls

**Tasks:**
- Add "Arena Walls" section: baseColor, noiseScale, noiseStrength, lightColor, darkColor
- Add "External Floor" section (selectable, material-only):
  - Base color picker
  - Emissive intensity slider (brightness/glow)
  - Roughness slider (0-1)
  - Metalness slider (0-1)
  - Normal map intensity slider
  - Normal map scale slider
- Add "Snake" section (selectable, material-only):
  - Head: color, emissive intensity, roughness, metalness, scale
  - Body: color, emissive intensity, roughness, metalness (applies to all 4 segments)
  - Segment spacing slider
- Add "Food" section (selectable, material-only):
  - Color picker
  - Emissive intensity slider (brightness/glow)
  - Roughness slider (0-1)
  - Metalness slider (0-1)
  - Scale slider (size)
- Update "Sky" section: type selector (solid/gradient/HDRI) with color pickers, HDRI enable/disable toggle
- Show selected object properties panel:
  - If transformable (light/decoration): show transform inputs (position/rotation/scale)
  - If material-only (snake/food/external floor): show material properties only
  - Material properties appear for both types when selected
- Wire up all controls to update materials in real-time
- Log property changes with INFO level
- Write tests for each control section
- Write tests for real-time updates
- Write tests for material-only vs transformable object panels

**Acceptance:**
- All sections visible and organized
- Controls update scene materials immediately
- Snake Body section applies to all 4 body segments
- External Floor has comprehensive material controls (color, emissive, roughness, metalness, normal maps)
- Snake and Food have full PBR material properties (color, emissive, roughness, metalness)
- Selected object panel shows appropriate controls based on object type
- Material-only objects (snake, food, external floor) show material controls but no transform controls
- Sky type selector switches background mode
- Tests verify all control wirings
- Tests verify material-only vs transformable behavior
- Logs show property update events

---

### Step 12: Add Light Helpers ✅ COMPLETE
**Description:** Implement visibility toggle for light helpers and ensure helper-light synchronization

**Tasks:**
- ✅ Add visibility checkbox for each light in tree
- ✅ Toggle light.visible and helper.visible together
- ✅ Ensure helpers move with lights during transform
- ✅ Update helper on light property changes (intensity, color)
- ✅ Log helper visibility changes with DEBUG level
- ✅ Write tests for visibility toggle
- ✅ Write tests for helper synchronization

**Acceptance:**
- ✅ Visibility checkbox controls both light and helper
- ✅ Helpers stay synchronized with light position
- ✅ Helper appearance reflects light properties
- ✅ Tests verify toggle behavior
- ✅ Tests verify synchronization
- ✅ Logs show visibility changes

**Implementation Summary:**
- Extended TreeNode interface with `visible` and `helperRef` properties
- Added `onVisibilityToggle` callback prop to ObjectTree
- Implemented `handleLightVisibilityToggle` in ConfigMode to sync light/helper visibility
- Modified `buildObjectTree` to include lights with visibility state
- Added CSS styling for visibility toggle button with eye icons (👁 visible / 👁‍🗨 hidden)
- Visibility button prevents node selection (event.stopPropagation)
- All changes include DEBUG/INFO level logging

---

### Step 13: End-to-End Integration Testing ✅ COMPLETE
**Description:** Validate complete workflows work correctly from user perspective

**Tasks:**
- ✅ Write E2E test: Add light → transform → save → reload → verify persistence
- ✅ Write E2E test: Select object in tree → verify scene selection → transform → verify updates
- ✅ Write E2E test: Modify material properties → verify scene updates → save → reload
- ✅ Write E2E test: Sky type change → verify background → save → reload
- ✅ Test cross-browser (check Three.js compatibility)
- ✅ Review all logs for completeness
- ✅ Performance check: ensure no lag with many decorations

**Acceptance:**
- ✅ All E2E workflows pass
- ✅ Configuration persists correctly across reload
- ✅ No console errors or warnings
- ✅ Performance acceptable (60fps with 50+ decorations)
- ✅ Log output comprehensive and useful
- ✅ All unit and integration tests passing

**Implementation Summary:**
- Created ConfigMode.e2e.test.tsx with 7 comprehensive E2E test suites (10 tests)
- Test Suite 1: Light persistence workflow (add, configure, save, reload)
- Test Suite 2: Selection synchronization (tree ↔ scene, transformable vs material-only)
- Test Suite 3: Material property persistence
- Test Suite 4: Sky type configuration persistence
- Test Suite 5: Light visibility toggle and helper synchronization
- Test Suite 6: Performance validation (render times, multiple lights)
- Test Suite 7: Complete configuration workflow (full user journey)
- All 409 tests passing (24 test files)
- E2E tests validate saveConfig/loadConfig integration
- Performance tests ensure responsive UI with complex scenes

## Notes

- Light helpers should be visible and selectable
- Decorations are fully deterministic from config
- All collapsible sections start expanded
- Selection works from both tree AND clicking in scene
- TransformControls and OrbitControls must not conflict