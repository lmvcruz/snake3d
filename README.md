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
│   ├── game/
│   │   ├── Snake.ts          # Snake game logic class
│   │   ├── Snake.test.ts     # Snake unit tests
│   │   ├── Arena.ts          # Arena/playing field class
│   │   └── Arena.test.ts     # Arena unit tests
│   ├── utils/
│   │   ├── logger.ts         # Logging utility
│   │   └── logger.test.ts    # Logger unit tests
│   ├── test/
│   │   └── setup.ts          # Test configuration
│   ├── App.tsx               # Main app component
│   ├── App.css               # App styles
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── logging-server.js         # Backend logging service
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── PROJECT_PLAN.md           # Detailed project planning
├── LOGGING.md                # Logging system documentation
└── README.md                 # This file
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

### Run Tests
```bash
npm test              # Run tests in watch mode
npm test -- --run     # Run tests once
npm run test:ui       # Run tests with UI
npm run test:coverage # Run tests with coverage report
```

### Start Logging Server (Optional)
```bash
npm run logging-server
```

See [LOGGING.md](LOGGING.md) for details on the logging system.

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm preview
```

## Architecture

The project follows TDD (Test-Driven Development) principles with clear separation of concerns:

### Game Logic Classes

**Snake** (`src/game/Snake.ts`)
- Manages snake state (position, direction, velocity)
- Handles movement and growth
- Collision detection (self-collision and position checking)
- Fully tested with 22 unit tests

**Arena** (`src/game/Arena.ts`)
- Defines playing field boundaries
- Wall collision detection
- Random position generation
- Distance calculations
- Fully tested with 21 unit tests

**Logger** (`src/utils/logger.ts`)
- In-memory log storage
- Optional file logging via backend service
- Multiple log levels (DEBUG, INFO, WARN, ERROR)
- Export and download functionality
- Fully tested with 8 unit tests

### Test Coverage

All game logic is thoroughly tested:
- ✅ 51 tests passing
- ✅ Snake class: 22 tests
- ✅ Arena class: 21 tests
- ✅ Logger utility: 8 tests

Run `npm test` to execute the test suite.

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
- [x] Unit testing framework (Vitest)
- [x] Logging utility with file output support
- [x] Snake class with TDD (22 tests)
- [x] Arena class with TDD (21 tests)
- [x] Git repository initialized

🚧 **Phase 2: Movement Engine** (IN PROGRESS)
- [x] Snake data structure (array of sphere positions)
- [x] Unified movement system with direction and velocity
- [x] Collision detection (self and walls)
- [ ] Integrate Snake and Arena classes with Game component
- [ ] Keyboard input handling
- [ ] Warm-up mode behavior (velocity = 0)
- [ ] Arena mode behavior (velocity > 0)

📋 **Phase 3: Game Rules** (PLANNED)
- [ ] Target collection mechanics
- [ ] Snake growth on target collection
- [ ] Game over conditions
- [ ] Score tracking
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
