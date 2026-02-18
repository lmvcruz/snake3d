# 3D Snake Game

A 3D snake game built with React, TypeScript, and Three.js to learn modern web graphics.

## Technology Stack

- **React** - UI framework
- **TypeScript** - Type-safe development
- **Three.js** - 3D graphics rendering with WebGL
- **Vite** - Fast build tool and dev server

## Project Structure

```
snake3d/
├── src/
│   ├── components/
│   │   ├── Game.tsx          # Main game component with Three.js scene
│   │   └── ModeSelection.tsx # Mode selection menu
│   ├── App.tsx               # Main app component
│   ├── App.css               # App styles
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── PROJECT_PLAN.md           # Detailed project planning document
```

## Game Modes

### Warm-up Mode
- Snake moves only when you press directional keys
- Practice mode without time pressure
- Perfect for learning the controls

### Arena Mode
- Snake moves continuously forward
- Classic snake gameplay
- Requires quick reactions and planning

## Getting Started

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

The game will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm preview
```

## Current Implementation Status

✅ **Phase 1: Setup & Basic Rendering** (COMPLETED)
- [x] Project scaffolding with Vite, React, TypeScript
- [x] Three.js integration with WebGL renderer
- [x] Basic 3D scene with inclined camera view
- [x] Arena rendering (floor + walls)
- [x] Initial snake representation (green sphere)
- [x] Target object (red sphere)
- [x] Basic lighting setup
- [x] Mode selection screen

🚧 **Phase 2: Movement Engine** (NEXT)
- [ ] Snake data structure (array of sphere positions)
- [ ] Unified movement system with direction and velocity
- [ ] Keyboard input handling
- [ ] Warm-up mode behavior (velocity = 0)
- [ ] Arena mode behavior (velocity > 0)

📋 **Phase 3: Collision & Game Rules** (PLANNED)
- [ ] Wall collision detection
- [ ] Self-collision detection
- [ ] Target collection mechanics
- [ ] Snake growth on target collection
- [ ] Game over conditions

📋 **Phase 4: Polish & Features** (PLANNED)
- [ ] Drag-and-drop targets (arena mode)
- [ ] Score tracking
- [ ] Textures and improved materials
- [ ] Smooth animations
- [ ] Sound effects (optional)

## Controls

- **Arrow Keys** or **WASD** - Change snake direction
- **ESC** - Pause game (coming soon)
- **R** - Restart game (coming soon)

## Learning Goals

This project is designed to learn:
- 3D graphics programming with Three.js and WebGL
- React integration with canvas-based rendering
- TypeScript for type-safe game development
- Game architecture and state management
- Performance optimization for real-time graphics

## Development Notes

See [PROJECT_PLAN.md](PROJECT_PLAN.md) for detailed project planning, architecture decisions, and feature specifications.

## License

MIT
