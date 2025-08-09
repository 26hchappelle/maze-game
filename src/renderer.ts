import { Cell, Position, PowerUp, GameState } from './types';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private cellSize: number;
  private canvas: HTMLCanvasElement;
  
  private colors = {
    wall: '#4a3c7a',
    floor: '#0f0720',
    player: '#4ade80',
    enemy: '#ff6b6b',
    exit: '#fbbf24',
    powerUp: {
      speed: '#3b82f6',
      invincibility: '#a855f7',
      reveal: '#f59e0b',
      freeze: '#06b6d4'
    },
    trail: '#ff6b6b33',
    fog: '#0f0720ee'
  };

  constructor(canvas: HTMLCanvasElement, cellSize: number) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.cellSize = cellSize;
    
    // Enable pixelated rendering
    this.ctx.imageSmoothingEnabled = false;
  }

  clear(): void {
    this.ctx.fillStyle = this.colors.floor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  renderMaze(maze: Cell[][], gameState: GameState): void {
    const isRevealed = gameState.activePowerUps.has('reveal');
    
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        this.renderCell(maze[y][x], isRevealed, gameState.playerPosition);
      }
    }
  }

  private renderCell(cell: Cell, isRevealed: boolean, playerPos: Position): void {
    const x = cell.x * this.cellSize;
    const y = cell.y * this.cellSize;
    
    // Draw floor
    this.ctx.fillStyle = this.colors.floor;
    this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
    
    // Draw walls
    this.ctx.strokeStyle = this.colors.wall;
    this.ctx.lineWidth = 2;
    
    if (cell.walls.top) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + this.cellSize, y);
      this.ctx.stroke();
    }
    if (cell.walls.right) {
      this.ctx.beginPath();
      this.ctx.moveTo(x + this.cellSize, y);
      this.ctx.lineTo(x + this.cellSize, y + this.cellSize);
      this.ctx.stroke();
    }
    if (cell.walls.bottom) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, y + this.cellSize);
      this.ctx.lineTo(x + this.cellSize, y + this.cellSize);
      this.ctx.stroke();
    }
    if (cell.walls.left) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x, y + this.cellSize);
      this.ctx.stroke();
    }
    
    // Apply fog of war if not revealed
    if (!isRevealed) {
      const distance = Math.abs(cell.x - playerPos.x) + Math.abs(cell.y - playerPos.y);
      if (distance > 4) {
        this.ctx.fillStyle = this.colors.fog;
        this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
      }
    }
  }

  renderPlayer(position: Position, hasInvincibility: boolean): void {
    const x = position.x * this.cellSize + this.cellSize / 2;
    const y = position.y * this.cellSize + this.cellSize / 2;
    const size = this.cellSize * 0.3;
    
    // Draw player as pixelated circle
    this.ctx.fillStyle = hasInvincibility ? '#a855f7' : this.colors.player;
    this.ctx.beginPath();
    this.ctx.arc(x, y, size, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Add invincibility glow
    if (hasInvincibility) {
      this.ctx.strokeStyle = '#a855f7';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size + 4, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  renderEnemy(position: Position, path: Position[]): void {
    // Render trail
    if (path.length > 1) {
      this.ctx.strokeStyle = this.colors.trail;
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
    const x = position.x * this.cellSize + this.cellSize / 2;
    const y = position.y * this.cellSize + this.cellSize / 2;
    const size = this.cellSize * 0.35;
    
    // Enemy as pixelated square
    this.ctx.fillStyle = this.colors.enemy;
    this.ctx.fillRect(x - size, y - size, size * 2, size * 2);
    
    // Add menacing eyes
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(x - size/2, y - size/3, size/3, size/3);
    this.ctx.fillRect(x + size/4, y - size/3, size/3, size/3);
  }

  renderExit(position: Position): void {
    const x = position.x * this.cellSize + this.cellSize / 2;
    const y = position.y * this.cellSize + this.cellSize / 2;
    const size = this.cellSize * 0.4;
    
    // Draw exit as golden square
    this.ctx.fillStyle = this.colors.exit;
    this.ctx.fillRect(x - size, y - size, size * 2, size * 2);
    
    // Add animation pulse
    const pulse = Math.sin(Date.now() * 0.003) * 0.2 + 0.8;
    this.ctx.globalAlpha = pulse;
    this.ctx.strokeStyle = this.colors.exit;
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(x - size - 4, y - size - 4, size * 2 + 8, size * 2 + 8);
    this.ctx.globalAlpha = 1;
  }

  renderPowerUps(powerUps: PowerUp[]): void {
    for (const powerUp of powerUps) {
      if (!powerUp.collected) {
        const x = powerUp.position.x * this.cellSize + this.cellSize / 2;
        const y = powerUp.position.y * this.cellSize + this.cellSize / 2;
        const size = this.cellSize * 0.25;
        
        // Draw power-up with rotation animation
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(Date.now() * 0.002);
        
        this.ctx.fillStyle = this.colors.powerUp[powerUp.type];
        this.ctx.fillRect(-size, -size, size * 2, size * 2);
        
        // Add inner detail
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(-size/3, -size/3, size * 2/3, size * 2/3);
        
        this.ctx.restore();
      }
    }
  }

  renderActivePowerUps(activePowerUps: Map<string, number>): void {
    let y = 10;
    this.ctx.font = '14px monospace';
    
    activePowerUps.forEach((timeLeft, type) => {
      const seconds = Math.ceil(timeLeft / 1000);
      this.ctx.fillStyle = this.colors.powerUp[type as keyof typeof this.colors.powerUp];
      this.ctx.fillText(`${type.toUpperCase()}: ${seconds}s`, 10, y);
      y += 20;
    });
  }
}