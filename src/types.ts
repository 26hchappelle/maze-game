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

export interface GameState {
  level: number;
  playerPosition: Position;
  enemyPosition: Position;
  enemyActive: boolean;
  enemySpeed: number;
  gameOver: boolean;
  levelComplete: boolean;
  powerUps: PowerUp[];
  activePowerUps: Map<string, number>;
  elapsedTime: number;
}