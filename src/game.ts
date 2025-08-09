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
      enemySpeed: 200, // milliseconds between moves - faster!
      gameOver: false,
      levelComplete: false,
      powerUps: [],
      activePowerUps: new Map(),
      elapsedTime: 0,
      exploredCells: new Set<string>(),
      keysPressed: new Set<string>(),
      playerSpeed: 150, // milliseconds between moves
      lastMoveTime: 0
    };
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.restart());
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.state.gameOver || this.state.levelComplete) return;
    
    const validKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];
    if (validKeys.includes(e.key)) {
      e.preventDefault();
      this.state.keysPressed.add(e.key.toLowerCase());
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.state.keysPressed.delete(e.key.toLowerCase());
  }

  private processInput(): void {
    if (this.state.gameOver || this.state.levelComplete) return;
    
    const currentTime = Date.now();
    const speed = this.state.activePowerUps.has('speed') ? this.state.playerSpeed / 2 : this.state.playerSpeed;
    
    if (currentTime - this.state.lastMoveTime < speed) return;
    
    const moves: { [key: string]: Position } = {
      'arrowup': { x: 0, y: -1 },
      'arrowdown': { x: 0, y: 1 },
      'arrowleft': { x: -1, y: 0 },
      'arrowright': { x: 1, y: 0 },
      'w': { x: 0, y: -1 },
      's': { x: 0, y: 1 },
      'a': { x: -1, y: 0 },
      'd': { x: 1, y: 0 }
    };
    
    for (const [key, direction] of Object.entries(moves)) {
      if (this.state.keysPressed.has(key)) {
        if (this.movePlayer(direction)) {
          this.state.lastMoveTime = currentTime;
          break;
        }
      }
    }
  }

  private movePlayer(direction: Position): boolean {
    const newX = this.state.playerPosition.x + direction.x;
    const newY = this.state.playerPosition.y + direction.y;
    
    if (this.canMove(this.state.playerPosition, direction)) {
      this.state.playerPosition = { x: newX, y: newY };
      
      // Mark cells as explored
      this.markCellsAsExplored();
      
      // Check for power-ups
      this.checkPowerUpCollection();
      
      // Check if reached exit
      if (newX === this.exitPosition.x && newY === this.exitPosition.y) {
        this.completeLevel();
      }
      
      return true;
    }
    return false;
  }

  private markCellsAsExplored(): void {
    const pos = this.state.playerPosition;
    const radius = 2; // Explore cells within radius
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = pos.x + dx;
        const y = pos.y + dy;
        if (x >= 0 && x < this.mazeWidth && y >= 0 && y < this.mazeHeight) {
          const distance = Math.abs(dx) + Math.abs(dy);
          if (distance <= radius) {
            this.state.exploredCells.add(`${x},${y}`);
          }
        }
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
    
    // Randomize start and end positions
    const corners = [
      { x: 0, y: 0 },
      { x: this.mazeWidth - 1, y: 0 },
      { x: 0, y: this.mazeHeight - 1 },
      { x: this.mazeWidth - 1, y: this.mazeHeight - 1 }
    ];
    
    const shuffled = [...corners].sort(() => Math.random() - 0.5);
    this.state.playerPosition = shuffled[0];
    this.exitPosition = shuffled[1];
    
    // Reset state
    this.state.enemyPosition = { ...this.state.playerPosition };
    this.state.enemyActive = false;
    this.state.levelComplete = false;
    this.state.elapsedTime = 0;
    this.state.exploredCells = new Set<string>();
    this.state.keysPressed = new Set<string>();
    this.state.lastMoveTime = 0;
    
    // Mark starting area as explored
    this.markCellsAsExplored();
    
    // Calculate enemy speed (gets much faster each level)
    this.state.enemySpeed = Math.max(50, 200 - (this.state.level - 1) * 20);
    
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
        (position.x === this.state.playerPosition.x && position.y === this.state.playerPosition.y) ||
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
    
    // Enemy is not affected by speed powerup - that's for the player
    const moveSpeed = this.state.enemySpeed;
    
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
      this.processInput(); // Process held keys
      this.updateEnemy(deltaTime);
      this.updatePowerUps(deltaTime);
    }
    
    this.render();
    requestAnimationFrame((time) => this.update(time));
  }

  private render(): void {
    this.renderer.clear();
    this.renderer.renderMaze(this.maze, this.state);
    this.renderer.renderExit(this.exitPosition, this.state);
    this.renderer.renderPowerUps(this.state.powerUps, this.state);
    
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