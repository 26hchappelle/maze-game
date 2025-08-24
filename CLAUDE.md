# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Browser-based maze escape game built with TypeScript and HTML5 Canvas. Players navigate procedurally generated mazes while being pursued by an enemy AI, collecting power-ups across 6 increasingly difficult levels.

## Essential Commands

```bash
# Development
npm run dev          # Start Vite dev server at localhost:5173 with HMR

# Build & Deploy  
npm run build        # TypeScript check + Vite production build
npm run preview      # Preview production build locally
npm run deploy       # Build and deploy to Vercel
```

## Architecture

### Core Components
- **game.ts**: Main game loop, state management, input processing, collision detection
- **maze.ts**: Recursive backtracking maze generation with A* pathfinding for enemy AI
- **renderer.ts**: Canvas rendering with fog of war, smooth animations, visual effects
- **sounds.ts**: Web Audio API sound generation (no external files)
- **palettes.ts**: 6 themed color palettes with complete UI theming
- **types.ts**: TypeScript interfaces for GameState, Cell, Position, PowerUp, ColorPalette

### Key Patterns
- **State Management**: Centralized GameState object tracks all game data
- **Grid Movement**: Player/enemy move cell-by-cell with smooth visual interpolation
- **Event-driven Input**: Keyboard state tracking for continuous movement
- **Procedural Generation**: Each level generates unique maze with scaling difficulty

### Game Flow
1. Palette selection screen (6 themed options)
2. Level progression (1-6) with increasing maze size and enemy speed
3. Victory screen after level 6 completion
4. Game over returns to palette selection

## Technical Details

### TypeScript Configuration
- Target: ES2020
- Strict mode enabled
- Module resolution: bundler
- No unused locals/parameters warnings

### Build System
- **Vite**: Fast dev server with HMR, optimized production builds
- **Output**: Single HTML + bundled JS/CSS (~15KB gzipped)
- **Deployment**: Auto-deploys to Vercel on push to main

### Canvas Rendering Pipeline
1. Clear canvas
2. Render maze cells with fog of war (radius 3 visibility)
3. Render exit, power-ups, enemy trail
4. Render player with smooth animation
5. Display active power-up indicators

### Enemy AI System
- A* pathfinding recalculated on player movement
- Spawns at player start position after 5 seconds
- Speed increases 20% per level (400ms → 50ms minimum)

### Power-up System (5-second duration each)
- **Speed**: 2x player movement speed
- **Invincibility**: Immune to enemy collision
- **Reveal**: Shows entire maze
- **Freeze**: Stops enemy movement

## Development Notes

### Mobile Support
- D-pad controls with large touch targets (72px buttons)
- Responsive canvas sizing
- No swipe gestures needed

### Performance Targets
- 60 FPS rendering with requestAnimationFrame
- Minimal memory usage (only current level in memory)
- Efficient A* pathfinding with caching

### Secret Features
- Press '9' for cheat mode (permanent invincibility + full map reveal)