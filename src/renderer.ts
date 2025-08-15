import { Cell, Position, PowerUp, GameState, ColorPalette } from './types';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private cellSize: number;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, cellSize: number) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.cellSize = cellSize;
    
    // Enable pixelated rendering
    this.ctx.imageSmoothingEnabled = false;
  }

  clear(palette: ColorPalette): void {
    this.ctx.fillStyle = palette.floor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  renderMaze(maze: Cell[][], gameState: GameState): void {
    const isRevealed = gameState.cheatMode || gameState.activePowerUps.has('reveal');
    const mazeWidth = maze[0].length;
    const mazeHeight = maze.length;
    
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        this.renderCell(maze[y][x], isRevealed, gameState, mazeWidth, mazeHeight);
      }
    }
  }

  private renderCell(cell: Cell, isRevealed: boolean, gameState: GameState, mazeWidth: number, mazeHeight: number): void {
    const x = cell.x * this.cellSize;
    const y = cell.y * this.cellSize;
    const cellKey = `${cell.x},${cell.y}`;
    const isExplored = gameState.exploredCells.has(cellKey);
    
    // Only render if cell has been explored or reveal powerup is active
    if (!isExplored && !isRevealed) {
      // Draw complete darkness for unexplored areas
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
      return;
    }
    
    // Draw floor
    this.ctx.fillStyle = gameState.currentPalette.floor;
    this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
    
    // Draw walls - determine if it's an outer wall
    this.ctx.strokeStyle = gameState.currentPalette.wall;
    
    // Top wall
    if (cell.walls.top) {
      this.ctx.lineWidth = cell.y === 0 ? 4 : 2; // Thicker for outer edge
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + this.cellSize, y);
      this.ctx.stroke();
    }
    
    // Right wall
    if (cell.walls.right) {
      this.ctx.lineWidth = cell.x === mazeWidth - 1 ? 4 : 2; // Thicker for outer edge
      this.ctx.beginPath();
      this.ctx.moveTo(x + this.cellSize, y);
      this.ctx.lineTo(x + this.cellSize, y + this.cellSize);
      this.ctx.stroke();
    }
    
    // Bottom wall
    if (cell.walls.bottom) {
      this.ctx.lineWidth = cell.y === mazeHeight - 1 ? 4 : 2; // Thicker for outer edge
      this.ctx.beginPath();
      this.ctx.moveTo(x, y + this.cellSize);
      this.ctx.lineTo(x + this.cellSize, y + this.cellSize);
      this.ctx.stroke();
    }
    
    // Left wall
    if (cell.walls.left) {
      this.ctx.lineWidth = cell.x === 0 ? 4 : 2; // Thicker for outer edge
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x, y + this.cellSize);
      this.ctx.stroke();
    }
    
    // Apply slight fog for explored but distant areas (only if not revealed)
    if (!isRevealed && isExplored) {
      const distance = Math.abs(cell.x - gameState.playerPosition.x) + Math.abs(cell.y - gameState.playerPosition.y);
      if (distance > 3) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
      }
    }
  }

  renderPlayer(visualPosition: Position, hasInvincibility: boolean, gameState: GameState): void {
    const x = visualPosition.x * this.cellSize + this.cellSize / 2;
    const y = visualPosition.y * this.cellSize + this.cellSize / 2;
    const size = this.cellSize * 0.3;
    
    // Draw player as pixelated circle (cheat mode or invincibility powerup)
    const isInvincible = gameState.cheatMode || hasInvincibility;
    this.ctx.fillStyle = isInvincible ? '#a855f7' : gameState.currentPalette.player;
    this.ctx.beginPath();
    this.ctx.arc(x, y, size, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Add invincibility glow
    if (isInvincible) {
      this.ctx.strokeStyle = '#a855f7';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size + 4, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  renderEnemy(visualPosition: Position, path: Position[], gameState: GameState): void {
    // Render trail
    if (path.length > 1) {
      this.ctx.strokeStyle = gameState.currentPalette.enemy + '33';
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      for (let i = 0; i < Math.min(path.length, 5); i++) {
        const p = path[i];
        const x = p.x * this.cellSize + this.cellSize / 2;
        const y = p.y * this.cellSize + this.cellSize / 2;
        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }
      this.ctx.stroke();
    }
    
    // Draw enemy
    const x = visualPosition.x * this.cellSize + this.cellSize / 2;
    const y = visualPosition.y * this.cellSize + this.cellSize / 2;
    const size = this.cellSize * 0.35;
    
    // Enemy as pixelated square
    this.ctx.fillStyle = gameState.currentPalette.enemy;
    this.ctx.fillRect(x - size, y - size, size * 2, size * 2);
    
    // Add menacing eyes
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(x - size/2, y - size/3, size/3, size/3);
    this.ctx.fillRect(x + size/4, y - size/3, size/3, size/3);
  }

  renderExit(position: Position, gameState: GameState): void {
    const cellKey = `${position.x},${position.y}`;
    const isExplored = gameState.exploredCells.has(cellKey);
    const isRevealed = gameState.activePowerUps.has('reveal');
    
    if (!isExplored && !isRevealed) return;
    
    const x = position.x * this.cellSize + this.cellSize / 2;
    const y = position.y * this.cellSize + this.cellSize / 2;
    const size = this.cellSize * 0.4;
    
    // Draw exit as golden square
    this.ctx.fillStyle = gameState.currentPalette.exit;
    this.ctx.fillRect(x - size, y - size, size * 2, size * 2);
    
    // Add animation pulse
    const pulse = Math.sin(Date.now() * 0.003) * 0.2 + 0.8;
    this.ctx.globalAlpha = pulse;
    this.ctx.strokeStyle = gameState.currentPalette.exit;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(x - size - 4, y - size - 4, size * 2 + 8, size * 2 + 8);
    this.ctx.globalAlpha = 1;
  }

  renderPowerUps(powerUps: PowerUp[], gameState: GameState): void {
    const isRevealed = gameState.cheatMode || gameState.activePowerUps.has('reveal');
    
    for (const powerUp of powerUps) {
      if (!powerUp.collected) {
        const cellKey = `${powerUp.position.x},${powerUp.position.y}`;
        const isExplored = gameState.exploredCells.has(cellKey);
        
        if (!isExplored && !isRevealed) continue;
        
        const x = powerUp.position.x * this.cellSize + this.cellSize / 2;
        const y = powerUp.position.y * this.cellSize + this.cellSize / 2;
        const size = this.cellSize * 0.25;
        
        // Draw power-up with rotation animation
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(Date.now() * 0.002);
        
        this.ctx.fillStyle = gameState.currentPalette.powerUps[powerUp.type];
        this.ctx.fillRect(-size, -size, size * 2, size * 2);
        
        // Add inner detail
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(-size/3, -size/3, size * 2/3, size * 2/3);
        
        this.ctx.restore();
      }
    }
  }

  renderActivePowerUps(activePowerUps: Map<string, number>, palette: ColorPalette): void {
    let y = 10;
    this.ctx.font = '14px monospace';
    
    activePowerUps.forEach((timeLeft, type) => {
      const seconds = Math.ceil(timeLeft / 1000);
      this.ctx.fillStyle = palette.powerUps[type as keyof typeof palette.powerUps];
      this.ctx.fillText(`${type.toUpperCase()}: ${seconds}s`, 10, y);
      y += 20;
    });
  }
}