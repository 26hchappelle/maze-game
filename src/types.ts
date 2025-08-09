export interface Position {
  x: number;
  y: number;
}

export interface FreePosition {
  x: number; // Pixel position
  y: number; // Pixel position
  gridX: number; // Current grid cell
  gridY: number; // Current grid cell
}

export interface Cell {
  x: number;
  y: number;
  walls: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
  visited: boolean;
}

export interface PowerUp {
  type: 'speed' | 'invincibility' | 'reveal' | 'freeze';
  position: Position;
  duration: number;
  collected: boolean;
}

export interface GameState {
  level: number;
  playerPosition: Position;
  playerVisualPosition: Position; // For smooth animation
  playerStartPosition: Position; // Track where player started
  enemyPosition: Position;
  enemyVisualPosition: Position; // For smooth animation
  enemyActive: boolean;
  enemySpeed: number;
  gameOver: boolean;
  levelComplete: boolean;
  powerUps: PowerUp[];
  activePowerUps: Map<string, number>;
  elapsedTime: number;
  exploredCells: Set<string>;
  keysPressed: Set<string>;
  playerSpeed: number;
  lastMoveTime: number;
  isMoving: boolean;
  moveProgress: number;
}