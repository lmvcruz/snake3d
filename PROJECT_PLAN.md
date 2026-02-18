# 3D Snake Game - Project Plan

## Project Overview
A 3D snake game implemented with modern web technologies to learn and explore various tools and frameworks.

## Game Description
- **Core Gameplay**: Classic snake game mechanics in a 3D environment
- **Visual Design**:
  - Snake: Composed of a group of spheres that follow each other
  - Arena: Flat playing field displayed at an inclined angle in the scene
  - Floor: Textured surface for visual appeal
  - Walls: Boundaries around the arena
- **Camera**: Inclined perspective to show the 3D nature of the game

## Technology Stack

### Technologies
- **Three.js**: 3D rendering library with WebGL renderer
- **TypeScript**: Type-safe development
- **React**: UI framework for game interface and controls

### Decision Notes
- Using Three.js with WebGL renderer for maximum compatibility
- WebGL provides sufficient performance for this project
- Keeping the stack simple to focus on learning core concepts

## Project Goals
1. Learn 3D graphics rendering in the browser
2. Understand modern web graphics APIs
3. Gain experience with TypeScript and React
4. Explore performance optimization techniques
5. Build a fun, playable game

## Game Modes

### Warm-up Mode
- **Purpose**: Practice and learn controls without pressure
- **Mechanics**:
  - Snake velocity = 0 (stationary)
  - Snake only moves when user presses directional keys
  - Each key press: velocity briefly activates for one step, then returns to 0
  - User has full control over timing of each move
- **Targets**: Static placement, cannot be moved

### Arena Mode
- **Purpose**: Classic gameplay with continuous movement
- **Mechanics**:
  - Snake has constant forward velocity (continuous motion)
  - Direction controlled by keyboard input
  - Snake automatically steps forward based on velocity
  - Player must react and plan ahead
- **Targets**: Can be drag-and-dropped to reposition during gameplay

### Unified Movement Engine
- Both modes share the same movement engine
- Velocity parameter differentiates behavior:
  - Warm-up: velocity = 0 (manual stepping)
  - Arena: velocity > 0 (automatic stepping)
- Direction is always controlled by keyboard input

## Technical Considerations

### Rendering Approach
- **Using**: Three.js with WebGL renderer
- Maximum browser compatibility
- Well-documented and mature ecosystem

### Architecture
- React for UI layer (menus, mode selection, score, controls)
- Three.js for 3D scene management
- TypeScript for type safety across the project
- Unified movement engine with velocity-based behavior
- Separate game logic from rendering

### Movement System
- **Direction**: Current facing direction of snake (controlled by keyboard)
- **Velocity**: Speed of automatic forward movement
  - 0 in warm-up mode (step on input only)
  - > 0 in arena mode (continuous motion)
- Single engine handles both modes by adjusting velocity

## Game Features (MVP)

### Mode Selection
- [ ] Initial page with two mode buttons:
  - Warm-up
  - Arena
- [ ] Mode switcher / return to menu

### Core Mechanics
- [ ] Unified movement engine with direction and velocity
- [ ] Direction control via keyboard (arrow keys or WASD)
- [ ] Velocity-based stepping:
  - Warm-up: 0 (step only on input)
  - Arena: constant forward motion
- [ ] Snake growth when reaching targets
- [ ] Collision detection:
  - Cannot touch own body
  - Cannot touch walls
- [ ] Game over and restart
- [ ] Score tracking

### Arena
- [ ] Rectangular playing field
- [ ] Textured floor
- [ ] Boundary walls
- [ ] Target spawning
- [ ] Drag-and-drop target repositioning (arena mode only)

### Controls
- [ ] Keyboard input (arrow keys or WASD)
- [ ] Pause functionality
- [ ] Game reset

### Visual Elements
- [ ] Smooth snake movement animation
- [ ] Camera angle (inclined view)
- [ ] Basic lighting
- [ ] Target objects (sphere or cube)
- [ ] Visual distinction between warm-up and arena modes

## Development Phases

### Phase 1: Setup & Basic Rendering
- Project scaffolding (React + TypeScript + Three.js + Vite)
- Basic 3D scene with camera and lighting
- Render arena (floor + walls)
- Display a single sphere (snake head)

### Phase 2: Movement Engine
- Snake data structure (array of sphere positions)
- Unified movement system with direction and velocity
- Input handling (direction changes)
- Implement warm-up mode behavior (velocity = 0)
- Implement arena mode behavior (velocity > 0)

### Phase 3: Collision & Game Rules
- Collision detection (walls, self-collision)
- Target spawning and collection
- Snake growth mechanism
- Game over conditions

### Phase 4: Mode Selection & UI
- Initial mode selection page
- Mode switching functionality
- Score system
- Game restart
- HUD elements

### Phase 5: Advanced Features
- Drag-and-drop target repositioning (arena mode)
- Textures and materials
- Smooth animations
- Performance optimization
- UI polish

### Phase 5 (Optional): Advanced Features
- Multiple difficulty levels
- Obstacles in arena
- Power-ups
- High score persistence
- Sound effects

## Next Steps
1. Set up project structure (React + TypeScript + Vite)
2. Install Three.js and React dependencies
3. Create basic 3D scene with inclined camera
4. Implement arena (floor + walls) rendering
5. Render snake as sphere array
6. Build unified movement engine

## Resources & References
- Three.js Documentation: https://threejs.org/docs/
- Three.js Examples: https://threejs.org/examples/
- React Three Fiber (alternative React integration): https://docs.pmnd.rs/react-three-fiber/
- TypeScript + React best practices
- Vite documentation: https://vitejs.dev/

## Questions to Resolve
- [ ] Use React Three Fiber or vanilla Three.js with React?
- [ ] State management approach (Context API, Zustand, Redux)?
- [ ] Grid-based or smooth coordinate movement?
- [ ] Target visuals and animations?
- [ ] Scoring system details?
