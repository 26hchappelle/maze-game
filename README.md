# Maze Escape Game

A browser-based maze escape game built with TypeScript and HTML5 Canvas. Players navigate through procedurally generated mazes while being pursued by an enemy, collecting power-ups and progressing through increasingly challenging levels.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Core Systems](#core-systems)
- [Game Features](#game-features)
- [Technical Implementation](#technical-implementation)
- [Development Setup](#development-setup)
- [Deployment](#deployment)

## Architecture Overview

### Technology Stack
- **Language**: TypeScript 5.3
- **Build Tool**: Vite 5.0
- **Rendering**: HTML5 Canvas API
- **Audio**: Web Audio API
- **Deployment**: Vercel (auto-deploy from GitHub)
- **Development Server**: Vite dev server with HMR

### Design Patterns
- **Component-based Architecture**: Separate classes for game logic, rendering, maze generation, and sound
- **State Management**: Centralized GameState interface tracking all game data
- **Event-driven Input**: Keyboard event listeners with state tracking for continuous movement
- **Procedural Generation**: Recursive backtracking algorithm for maze generation with additional complexity layers

## Project Structure

```
/game/
├── src/
│   ├── game.ts         # Main game loop and logic controller
│   ├── maze.ts         # Maze generation algorithms
│   ├── renderer.ts     # Canvas rendering system
│   ├── sounds.ts       # Web Audio API sound effects
│   ├── types.ts        # TypeScript interfaces and types
│   ├── main.ts         # Entry point and initialization
│   └── styles.css      # Game styling and UI
├── index.html          # HTML container and UI elements
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite build configuration
├── vercel.json         # Vercel deployment settings
└── CLAUDE.md          # AI assistant instructions
```

## Core Systems

### 1. Game Loop (`game.ts`)

The main game controller manages the game state and coordinates all subsystems.

**Key Components:**
- **State Management**: Maintains `GameState` object with all game data
- **Update Loop**: Processes input, updates entities, checks collisions
- **Level Progression**: Handles level transitions and difficulty scaling
- **Power-up System**: Manages power-up collection and effects

**Main Methods:**
```typescript
class Game {
  update(currentTime: number): void      // Main game loop
  processInput(): void                   // Handle keyboard input
  movePlayer(direction: Position): bool  // Grid-based movement
  updateEnemy(deltaTime: number): void   // Enemy AI updates
  startLevel(): void                      // Initialize new level
  completeLevel(): void                   // Handle level completion
  gameOver(): void                        // Handle game over state
}
```

**Game State Properties:**
```typescript
interface GameState {
  level: number                          // Current level (1-based)
  playerPosition: Position               // Grid position of player
  playerVisualPosition: Position         // Interpolated position for smooth animation
  enemyPosition: Position                // Grid position of enemy
  enemyActive: boolean                   // Whether enemy is chasing
  enemySpeed: number                     // Milliseconds between enemy moves
  powerUps: PowerUp[]                    // Active power-ups in level
  activePowerUps: Map<string, number>    // Currently active power-up effects
  exploredCells: Set<string>             // Cells revealed by player
  keysPressed: Set<string>               // Currently pressed keys
}
```

### 2. Maze Generation (`maze.ts`)

Procedural maze generation using recursive backtracking with enhancements.

**Algorithm Steps:**
1. **Base Generation**: Recursive backtracking creates perfect maze
2. **Add Loops**: Remove walls to create multiple paths (10-30 based on difficulty)
3. **Add Dead Ends**: Create branching paths for complexity (5-15 based on difficulty)
4. **Ensure Solvability**: Verify paths exist between all corners

**Key Methods:**
```typescript
class MazeGenerator {
  generate(difficulty: number): Cell[][]        // Generate complete maze
  generateMazeRecursive(x: number, y: number)  // Core recursive algorithm
  addLoops(count: number): void                // Create alternative paths
  addDeadEnds(count: number): void             // Add complexity
  ensureSolvable(): void                       // Verify maze has solutions
  findPath(start: Position, end: Position)     // A* pathfinding for enemy
}
```

**Cell Structure:**
```typescript
interface Cell {
  x: number, y: number                   // Grid coordinates
  walls: {                                // Wall configuration
    top: boolean,
    right: boolean,
    bottom: boolean,
    left: boolean
  }
  visited: boolean                        // Used during generation
}
```

### 3. Rendering System (`renderer.ts`)

Canvas-based rendering with pixelated retro aesthetic.

**Rendering Pipeline:**
1. Clear canvas
2. Render maze cells (with fog of war)
3. Render exit position
4. Render power-ups
5. Render enemy (with trail effect)
6. Render player
7. Display active power-up indicators

**Visual Features:**
- **Fog of War**: Only explored cells within radius 3 are visible
- **Smooth Animation**: Interpolation between grid positions
- **Pixelated Style**: GBA-inspired color palette and rendering
- **Visual Effects**: Pulsing exit, rotating power-ups, enemy trail

**Color Palette:**
```javascript
colors = {
  wall: '#4a3c7a',       // Purple walls
  floor: '#0f0720',      // Dark blue floor
  player: '#4ade80',     // Green player
  enemy: '#ff6b6b',      // Red enemy
  exit: '#fbbf24',       // Golden exit
  powerUp: {
    speed: '#3b82f6',    // Blue
    invincibility: '#a855f7',  // Purple
    reveal: '#f59e0b',   // Orange
    freeze: '#06b6d4'    // Cyan
  }
}
```

### 4. Sound System (`sounds.ts`)

Web Audio API-based sound generation (no external audio files).

**Sound Effects:**
- **Movement**: Short square wave beep (200Hz, 50ms)
- **Power-up Collection**: Rising sine wave (400-800Hz)
- **Level Complete**: Victory fanfare (C-E-G-C arpeggio)
- **Game Over**: Descending sawtooth (400-100Hz)
- **Enemy Near**: Low ominous tone (80Hz)
- **Enemy Spawn**: Alert pattern (alternating 300/200Hz)

**Implementation:**
```typescript
class SoundEffects {
  private audioContext: AudioContext
  createOscillator(frequency, type, duration, volume): void
  playMove(): void
  playPowerUp(): void
  playLevelComplete(): void
  playGameOver(): void
  toggle(): void  // Mute/unmute with 'M' key
}
```

## Game Features

### Player Movement
- **Grid-based**: Player moves cell by cell on the grid
- **Smooth Animation**: 200ms transition between cells
- **Continuous Movement**: Hold keys for repeated movement
- **8-directional Input**: Arrow keys or WASD
- **Wall Collision**: Cannot move through maze walls

### Enemy AI
- **Pathfinding**: A* algorithm to chase player
- **Delayed Start**: Spawns 5 seconds after level start
- **Speed Scaling**: 
  - Level 1: 400ms/move (2.5 moves/sec)
  - Increases 20% per level (multiplier: 0.8^(level-1))
  - Minimum: 50ms/move
- **Always Spawns**: At player's starting position
- **Collision Detection**: Game over on contact (unless invincible)

### Power-ups
Four types with 5-second duration:

1. **Speed (Blue)**: Player moves 2x faster
2. **Invincibility (Purple)**: Immune to enemy collision
3. **Reveal (Orange)**: Shows entire maze
4. **Freeze (Cyan)**: Stops enemy movement

**Spawn Rules:**
- 2-5 power-ups per level (increases with difficulty)
- Random positions excluding start/exit
- Collected on contact
- Effects clear between levels

### Level Progression

**Maze Sizing:**
- Level 1: 10×10 grid
- Each level: One dimension +2, other +3 (randomly chosen)
- Maximum: 40×40 grid

**Example Progression:**
```
Level 1: 10×10
Level 2: 12×13 or 13×12
Level 3: 14×16 or 15×15
Level 4: 16×19 or 18×17
```

**Difficulty Scaling:**
- More maze complexity (loops and dead ends)
- Faster enemy movement (20% per level)
- More power-ups available
- Larger maze size

### Fog of War
- Only cells within radius 3 of player are visible
- Explored cells remain partially visible (darkened)
- Reveal power-up shows entire maze temporarily
- Creates exploration-based gameplay

## Technical Implementation

### Input Handling
```typescript
// Continuous movement with key state tracking
private handleKeyDown(e: KeyboardEvent): void {
  this.state.keysPressed.add(e.key.toLowerCase());
}

private handleKeyUp(e: KeyboardEvent): void {
  this.state.keysPressed.delete(e.key.toLowerCase());
}

// Process held keys each frame
private processInput(): void {
  for (const [key, direction] of Object.entries(moves)) {
    if (this.state.keysPressed.has(key)) {
      this.movePlayer(direction);
    }
  }
}
```

### Collision Detection
```typescript
// Grid-based wall collision
private canMove(from: Position, direction: Position): boolean {
  const cell = this.maze[from.y][from.x];
  
  // Check wall in movement direction
  if (direction.y === -1 && cell.walls.top) return false;
  if (direction.y === 1 && cell.walls.bottom) return false;
  if (direction.x === -1 && cell.walls.left) return false;
  if (direction.x === 1 && cell.walls.right) return false;
  
  // Check bounds
  return newX >= 0 && newX < mazeWidth && 
         newY >= 0 && newY < mazeHeight;
}
```

### Animation System
```typescript
// Smooth movement between grid cells
private updatePlayerAnimation(deltaTime: number): void {
  if (this.state.isMoving) {
    this.state.moveProgress += deltaTime / this.animationSpeed;
    
    // Interpolate position
    this.state.playerVisualPosition = {
      x: prevX + (targetX - prevX) * this.state.moveProgress,
      y: prevY + (targetY - prevY) * this.state.moveProgress
    };
  }
}
```

## Development Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn package manager

### Installation
```bash
# Clone repository
git clone https://github.com/johnpsasser/game.git
cd game

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts
```json
{
  "dev": "vite",                    // Start dev server (localhost:5173)
  "build": "tsc && vite build",     // Build for production
  "preview": "vite preview",        // Preview production build
  "deploy": "npm run build && vercel --prod"  // Manual deploy
}
```

### Development Workflow
1. Run `npm run dev` to start local server
2. Make changes - hot reload updates automatically
3. Commit changes - triggers auto-deploy to Vercel
4. Test at production URL

## Deployment

### Vercel Configuration
The game auto-deploys to Vercel on push to main branch.

**Configuration (`vercel.json`):**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

### Build Output
- **HTML**: Single page with game container
- **JavaScript**: Bundled and minified game code
- **CSS**: Embedded styles
- **Total Size**: ~15KB gzipped

### Browser Compatibility
- Chrome 90+ (primary target)
- Firefox 88+
- Safari 14+
- Edge 90+

## Controls

- **Arrow Keys / WASD**: Move player
- **M**: Toggle sound on/off
- **Enter**: Restart when game over

## Game Rules

1. **Objective**: Reach the golden exit before the red enemy catches you
2. **Enemy**: Starts chasing after 5 seconds
3. **Power-ups**: Collect for temporary advantages
4. **Progression**: Each level increases difficulty
5. **Game Over**: Enemy collision sends back to level 1

## Performance Considerations

- **Rendering**: 60 FPS target with requestAnimationFrame
- **Maze Generation**: O(n²) complexity, generated once per level
- **Pathfinding**: A* algorithm, recalculated on player movement
- **Memory**: Minimal - only current level data in memory
- **Bundle Size**: ~15KB gzipped total

## Future Enhancements

Potential improvements for consideration:
- Multiple enemy types with different behaviors
- Persistent high scores with local storage
- Additional power-up types
- Mini-map display
- Mobile touch controls
- Multiplayer support
- Level editor
- Achievement system

## License

This is a learning project for game development education.

## Acknowledgments

Built with assistance from Claude Code for educational purposes.