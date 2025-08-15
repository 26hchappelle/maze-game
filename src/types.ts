export interface Position {
  x: number;
  y: number;
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

export interface ColorPalette {
  name: string;
  wall: string;
  floor: string;
  player: string;
  enemy: string;
  exit: string;
  powerUps: {
    speed: string;
    invincibility: string;
    reveal: string;
    freeze: string;
  };
  fog: string;
  ui: string;
  background: string;
  containerBg: string;
  headerBg: string;
  text: string;
  accent: string;
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
  victory: boolean; // True when all 6 levels are completed
  powerUps: PowerUp[];
  activePowerUps: Map<string, number>;
  elapsedTime: number;
  totalTime: number; // Total time across all levels
  exploredCells: Set<string>;
  keysPressed: Set<string>;
  playerSpeed: number;
  lastMoveTime: number;
  isMoving: boolean;
  moveProgress: number;
  currentPalette: ColorPalette;
  cheatMode: boolean; // Activated with '9' key - permanent invincibility and reveal
}