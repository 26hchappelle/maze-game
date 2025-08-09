import { GameState, Position, PowerUp, Cell } from './types';
import { MazeGenerator } from './maze';
import { Renderer } from './renderer';

export class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private mazeGenerator: MazeGenerator;
  private maze: Cell[][] = [];
  private state: GameState;
  private lastTime: number = 0;
  private enemyPath: Position[] = [];
  private enemyPathIndex: number = 0;
  private enemyMoveTimer: number = 0;
  private exitPosition: Position;
  private mazeWidth: number;
  private mazeHeight: number;
  private cellSize: number = 24;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas, this.cellSize);
    
    // Calculate maze dimensions based on level
    this.mazeWidth = 15;
    this.mazeHeight = 15;
    
    this.canvas.width = this.mazeWidth * this.cellSize;
    this.canvas.height = this.mazeHeight * this.cellSize;
    
    this.mazeGenerator = new MazeGenerator(this.mazeWidth, this.mazeHeight);
    this.exitPosition = { x: this.mazeWidth - 1, y: this.mazeHeight - 1 };
    
    this.state = this.createInitialState();
    
    this.setupEventListeners();
    this.startLevel();
  }

  private createInitialState(): GameState {
    return {
      level: 1,
      playerPosition: { x: 0, y: 0 },
      enemyPosition: { x: 0, y: 0 },
      enemyActive: false,
      enemySpeed: 300, // milliseconds between moves
      gameOver: false,
      levelComplete: false,
      powerUps: [],
      activePowerUps: new Map(),
      elapsedTime: 0
    };
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => this.handleInput(e));
    
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.restart());
    }
  }

  private handleInput(e: KeyboardEvent): void {
    if (this.state.gameOver || this.state.levelComplete) return;
    
    const moves: { [key: string]: Position } = {
      'ArrowUp': { x: 0, y: -1 },
      'ArrowDown': { x: 0, y: 1 },
      'ArrowLeft': { x: -1, y: 0 },
      'ArrowRight': { x: 1, y: 0 },
      'w': { x: 0, y: -1 },
      's': { x: 0, y: 1 },
      'a': { x: -1, y: 0 },
      'd': { x: 1, y: 0 }
    };
    
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      this.movePlayer(move);
    }
  }

  private movePlayer(direction: Position): void {
    const newX = this.state.playerPosition.x + direction.x;
    const newY = this.state.playerPosition.y + direction.y;
    
    if (this.canMove(this.state.playerPosition, direction)) {
      this.state.playerPosition = { x: newX, y: newY };
      
      // Check for power-ups
      this.checkPowerUpCollection();
      
      // Check if reached exit
      if (newX === this.exitPosition.x && newY === this.exitPosition.y) {
        this.completeLevel();
      }
    }
  }

  private canMove(from: Position, direction: Position): boolean {
    const cell = this.maze[from.y][from.x];
    
    if (direction.y === -1 && cell.walls.top) return false;
    if (direction.y === 1 && cell.walls.bottom) return false;
    if (direction.x === -1 && cell.walls.left) return false;
    if (direction.x === 1 && cell.walls.right) return false;
    
    const newX = from.x + direction.x;
    const newY = from.y + direction.y;
    
    return newX >= 0 && newX < this.mazeWidth && newY >= 0 && newY < this.mazeHeight;
  }

  private checkPowerUpCollection(): void {
    for (const powerUp of this.state.powerUps) {
      if (!powerUp.collected &&
          powerUp.position.x === this.state.playerPosition.x &&
          powerUp.position.y === this.state.playerPosition.y) {
        powerUp.collected = true;
        this.activatePowerUp(powerUp);
      }
    }
  }

  private activatePowerUp(powerUp: PowerUp): void {
    if (powerUp.type === 'freeze') {
      // Freeze enemy for duration
      this.state.enemyActive = false;
      setTimeout(() => {
        if (!this.state.gameOver) {
          this.state.enemyActive = true;
        }
      }, powerUp.duration);
    } else {
      this.state.activePowerUps.set(powerUp.type, powerUp.duration);
    }
  }

  private startLevel(): void {
    // Increase maze size slightly with level
    const sizeIncrease = Math.floor(this.state.level / 3);
    this.mazeWidth = Math.min(15 + sizeIncrease, 25);
    this.mazeHeight = Math.min(15 + sizeIncrease, 25);
    
    this.canvas.width = this.mazeWidth * this.cellSize;
    this.canvas.height = this.mazeHeight * this.cellSize;
    
    this.mazeGenerator = new MazeGenerator(this.mazeWidth, this.mazeHeight);
    this.maze = this.mazeGenerator.generate(this.state.level);
    
    this.exitPosition = { x: this.mazeWidth - 1, y: this.mazeHeight - 1 };
    
    // Reset positions
    this.state.playerPosition = { x: 0, y: 0 };
    this.state.enemyPosition = { x: 0, y: 0 };
    this.state.enemyActive = false;
    this.state.levelComplete = false;
    this.state.elapsedTime = 0;
    
    // Calculate enemy speed (gets faster each level)
    this.state.enemySpeed = Math.max(100, 300 - (this.state.level - 1) * 15);
    
    // Generate power-ups
    this.generatePowerUps();
    
    // Start enemy after 5 seconds
    setTimeout(() => {
      if (!this.state.gameOver && !this.state.levelComplete) {
        this.state.enemyActive = true;
        this.calculateEnemyPath();
      }
    }, 5000);
    
    // Update UI
    this.updateLevelDisplay();
  }

  private generatePowerUps(): void {
    this.state.powerUps = [];
    const numPowerUps = Math.min(2 + Math.floor(this.state.level / 2), 5);
    const types: PowerUp['type'][] = ['speed', 'invincibility', 'reveal', 'freeze'];
    
    for (let i = 0; i < numPowerUps; i++) {
      let position: Position;
      do {
        position = {
          x: Math.floor(Math.random() * this.mazeWidth),
          y: Math.floor(Math.random() * this.mazeHeight)
        };
      } while (
        (position.x === 0 && position.y === 0) ||
        (position.x === this.exitPosition.x && position.y === this.exitPosition.y) ||
        this.state.powerUps.some(p => p.position.x === position.x && p.position.y === position.y)
      );
      
      this.state.powerUps.push({
        type: types[Math.floor(Math.random() * types.length)],
        position,
        duration: 5000,
        collected: false
      });
    }
  }

  private calculateEnemyPath(): void {
    if (!this.state.enemyActive) return;
    
    // Calculate path from enemy to player
    this.enemyPath = this.mazeGenerator.findPath(
      this.state.enemyPosition,
      this.state.playerPosition
    );
    this.enemyPathIndex = 0;
  }

  private updateEnemy(deltaTime: number): void {
    if (!this.state.enemyActive || this.state.activePowerUps.has('freeze')) return;
    
    this.enemyMoveTimer += deltaTime;
    
    const moveSpeed = this.state.activePowerUps.has('speed') ? 
      this.state.enemySpeed * 2 : this.state.enemySpeed;
    
    if (this.enemyMoveTimer >= moveSpeed) {
      this.enemyMoveTimer = 0;
      
      // Recalculate path periodically
      if (this.enemyPathIndex === 0 || this.enemyPathIndex >= this.enemyPath.length - 1) {
        this.calculateEnemyPath();
      }
      
      // Move enemy along path
      if (this.enemyPath.length > 1 && this.enemyPathIndex < this.enemyPath.length - 1) {
        this.enemyPathIndex++;
        this.state.enemyPosition = this.enemyPath[this.enemyPathIndex];
        
        // Check collision
        if (!this.state.activePowerUps.has('invincibility') &&
            this.state.enemyPosition.x === this.state.playerPosition.x &&
            this.state.enemyPosition.y === this.state.playerPosition.y) {
          this.gameOver();
        }
      }
    }
  }

  private updatePowerUps(deltaTime: number): void {
    const toRemove: string[] = [];
    
    this.state.activePowerUps.forEach((timeLeft, type) => {
      const newTime = timeLeft - deltaTime;
      if (newTime <= 0) {
        toRemove.push(type);
      } else {
        this.state.activePowerUps.set(type, newTime);
      }
    });
    
    toRemove.forEach(type => this.state.activePowerUps.delete(type));
  }

  private completeLevel(): void {
    this.state.levelComplete = true;
    this.state.level++;
    
    setTimeout(() => {
      this.startLevel();
    }, 1000);
  }

  private gameOver(): void {
    this.state.gameOver = true;
    const gameOverDiv = document.getElementById('game-over');
    const finalLevel = document.getElementById('final-level');
    
    if (gameOverDiv && finalLevel) {
      finalLevel.textContent = this.state.level.toString();
      gameOverDiv.classList.remove('hidden');
    }
  }

  private restart(): void {
    this.state = this.createInitialState();
    const gameOverDiv = document.getElementById('game-over');
    if (gameOverDiv) {
      gameOverDiv.classList.add('hidden');
    }
    this.startLevel();
  }

  private updateLevelDisplay(): void {
    const levelNumber = document.getElementById('level-number');
    if (levelNumber) {
      levelNumber.textContent = this.state.level.toString();
    }
  }

  private updateTimer(): void {
    const timerDisplay = document.getElementById('timer');
    if (timerDisplay) {
      timerDisplay.textContent = Math.floor(this.state.elapsedTime / 1000).toString();
    }
  }

  update(currentTime: number): void {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    if (!this.state.gameOver && !this.state.levelComplete) {
      this.state.elapsedTime += deltaTime;
      this.updateTimer();
      this.updateEnemy(deltaTime);
      this.updatePowerUps(deltaTime);
    }
    
    this.render();
    requestAnimationFrame((time) => this.update(time));
  }

  private render(): void {
    this.renderer.clear();
    this.renderer.renderMaze(this.maze, this.state);
    this.renderer.renderExit(this.exitPosition);
    this.renderer.renderPowerUps(this.state.powerUps);
    
    if (this.state.enemyActive) {
      this.renderer.renderEnemy(this.state.enemyPosition, this.enemyPath.slice(this.enemyPathIndex));
    }
    
    this.renderer.renderPlayer(this.state.playerPosition, this.state.activePowerUps.has('invincibility'));
    this.renderer.renderActivePowerUps(this.state.activePowerUps);
  }

  start(): void {
    requestAnimationFrame((time) => this.update(time));
  }
}