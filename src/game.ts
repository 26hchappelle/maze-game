import { GameState, Position, PowerUp, Cell, FreePosition } from './types';
import { MazeGenerator } from './maze';
import { Renderer } from './renderer';
import { SoundEffects } from './sounds';
import { Physics } from './physics';

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
  private sounds: SoundEffects;
  private physics: Physics;
  private playerPixelPos: { x: number; y: number };
  private playerSpeed: number = 3; // pixels per frame
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas, this.cellSize);
    this.sounds = new SoundEffects();
    this.physics = new Physics(this.cellSize);
    
    // Calculate maze dimensions based on level
    this.mazeWidth = 15;
    this.mazeHeight = 15;
    
    this.canvas.width = this.mazeWidth * this.cellSize;
    this.canvas.height = this.mazeHeight * this.cellSize;
    
    this.mazeGenerator = new MazeGenerator(this.mazeWidth, this.mazeHeight);
    this.exitPosition = { x: this.mazeWidth - 1, y: this.mazeHeight - 1 };
    this.playerPixelPos = { x: 0, y: 0 };
    
    this.state = this.createInitialState();
    
    this.setupEventListeners();
    this.startLevel();
  }

  private createInitialState(): GameState {
    return {
      level: 1,
      playerPosition: { x: 0, y: 0 },
      playerVisualPosition: { x: 0, y: 0 },
      playerStartPosition: { x: 0, y: 0 },
      enemyPosition: { x: 0, y: 0 },
      enemyVisualPosition: { x: 0, y: 0 },
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
      lastMoveTime: 0,
      isMoving: false,
      moveProgress: 0
    };
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.restart());
    }
    
    // Add Enter key support for game over
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.state.gameOver) {
        this.restart();
      }
    });
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Handle sound toggle
    if (e.key === 'm' || e.key === 'M') {
      this.sounds.toggle();
      const soundToggle = document.getElementById('sound-toggle');
      if (soundToggle) {
        soundToggle.classList.toggle('muted');
        soundToggle.textContent = soundToggle.classList.contains('muted') ? '🔇' : '🔊';
      }
      return;
    }
    
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
    
    let dx = 0;
    let dy = 0;
    const speed = this.state.activePowerUps.has('speed') ? this.playerSpeed * 1.5 : this.playerSpeed;
    
    // Check all pressed keys for movement
    if (this.state.keysPressed.has('arrowup') || this.state.keysPressed.has('w')) {
      dy -= speed;
    }
    if (this.state.keysPressed.has('arrowdown') || this.state.keysPressed.has('s')) {
      dy += speed;
    }
    if (this.state.keysPressed.has('arrowleft') || this.state.keysPressed.has('a')) {
      dx -= speed;
    }
    if (this.state.keysPressed.has('arrowright') || this.state.keysPressed.has('d')) {
      dx += speed;
    }
    
    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const factor = 0.707; // 1/sqrt(2)
      dx *= factor;
      dy *= factor;
    }
    
    if (dx !== 0 || dy !== 0) {
      this.movePlayerPixels(dx, dy);
    }
  }

  private movePlayerPixels(dx: number, dy: number): void {
    // Get valid movement considering walls
    const movement = this.physics.getValidMovement(this.playerPixelPos.x, this.playerPixelPos.y, dx, dy);
    
    if (movement.dx !== 0 || movement.dy !== 0) {
      this.playerPixelPos.x += movement.dx;
      this.playerPixelPos.y += movement.dy;
      
      // Update grid position
      const gridPos = this.physics.pixelToGrid(this.playerPixelPos.x, this.playerPixelPos.y);
      this.state.playerPosition = gridPos;
      
      // Update visual position for rendering
      this.state.playerVisualPosition = {
        x: this.playerPixelPos.x / this.cellSize,
        y: this.playerPixelPos.y / this.cellSize
      };
      
      // Mark cells as explored
      this.markCellsAsExplored();
      
      // Check for power-ups (with tolerance for pixel-based movement)
      this.checkPowerUpCollectionPixel();
      
      // Check if reached exit (with tolerance)
      const exitPixel = this.physics.gridToPixel(this.exitPosition.x, this.exitPosition.y);
      const distance = Math.sqrt(
        Math.pow(this.playerPixelPos.x - exitPixel.x, 2) +
        Math.pow(this.playerPixelPos.y - exitPixel.y, 2)
      );
      if (distance < this.cellSize / 2) {
        this.completeLevel();
      }
    }
  }

  private checkPowerUpCollectionPixel(): void {
    for (const powerUp of this.state.powerUps) {
      if (!powerUp.collected) {
        const powerUpPixel = this.physics.gridToPixel(powerUp.position.x, powerUp.position.y);
        const distance = Math.sqrt(
          Math.pow(this.playerPixelPos.x - powerUpPixel.x, 2) +
          Math.pow(this.playerPixelPos.y - powerUpPixel.y, 2)
        );
        if (distance < this.cellSize / 2) {
          powerUp.collected = true;
          this.sounds.playPowerUp();
          this.activatePowerUp(powerUp);
        }
      }
    }
  }


  private markCellsAsExplored(): void {
    const pos = this.state.playerPosition;
    const radius = 3; // Increased fog of war radius
    
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
    // Start with larger mazes, gradually increase
    const baseSize = 20; // Bigger starting size
    const sizeIncrease = Math.floor((this.state.level - 1) / 3);
    this.mazeWidth = Math.min(baseSize + sizeIncrease * 2, 35);
    this.mazeHeight = Math.min(baseSize + sizeIncrease * 2, 35);
    
    // Adjust canvas size
    this.canvas.width = this.mazeWidth * this.cellSize;
    this.canvas.height = this.mazeHeight * this.cellSize;
    
    // Generate maze first, before any positioning
    this.mazeGenerator = new MazeGenerator(this.mazeWidth, this.mazeHeight);
    this.maze = this.mazeGenerator.generate(this.state.level);
    
    // Update physics with new maze
    this.physics.setMaze(this.maze, this.mazeWidth, this.mazeHeight);
    
    // Randomize start and end positions AFTER maze is generated
    const corners = [
      { x: 0, y: 0 },
      { x: this.mazeWidth - 1, y: 0 },
      { x: 0, y: this.mazeHeight - 1 },
      { x: this.mazeWidth - 1, y: this.mazeHeight - 1 }
    ];
    
    const shuffled = [...corners].sort(() => Math.random() - 0.5);
    this.state.playerPosition = shuffled[0];
    this.state.playerStartPosition = { ...shuffled[0] };
    this.exitPosition = shuffled[1];
    
    // Set pixel position for free movement
    const startPixel = this.physics.gridToPixel(shuffled[0].x, shuffled[0].y);
    this.playerPixelPos = { x: startPixel.x, y: startPixel.y };
    this.state.playerVisualPosition = {
      x: this.playerPixelPos.x / this.cellSize,
      y: this.playerPixelPos.y / this.cellSize
    };
    
    // Enemy ALWAYS spawns at player's start position
    this.state.enemyPosition = { ...this.state.playerStartPosition };
    this.state.enemyVisualPosition = { ...this.state.playerStartPosition };
    this.state.enemyActive = false;
    this.state.levelComplete = false;
    this.state.elapsedTime = 0;
    this.state.exploredCells = new Set<string>();
    this.state.keysPressed = new Set<string>();
    this.state.lastMoveTime = 0;
    this.state.isMoving = false;
    this.state.moveProgress = 0;
    
    // Clear all active power-ups from previous level
    this.state.activePowerUps.clear();
    
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
        this.sounds.playEnemySpawn();
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
    
    // Update smooth enemy movement
    const enemyAnimProgress = Math.min(1, this.enemyMoveTimer / this.state.enemySpeed);
    const prevPos = this.enemyPathIndex > 0 ? this.enemyPath[this.enemyPathIndex - 1] : this.state.enemyPosition;
    this.state.enemyVisualPosition = {
      x: prevPos.x + (this.state.enemyPosition.x - prevPos.x) * enemyAnimProgress,
      y: prevPos.y + (this.state.enemyPosition.y - prevPos.y) * enemyAnimProgress
    };
    
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
        
        // Play sound if enemy is near
        const gridDistance = Math.abs(this.state.enemyPosition.x - this.state.playerPosition.x) + 
                            Math.abs(this.state.enemyPosition.y - this.state.playerPosition.y);
        if (gridDistance <= 3) {
          this.sounds.playEnemyNear();
        }
        
        // Check collision with pixel-based tolerance
        const enemyPixel = this.physics.gridToPixel(this.state.enemyPosition.x, this.state.enemyPosition.y);
        const pixelDistance = Math.sqrt(
          Math.pow(this.playerPixelPos.x - enemyPixel.x, 2) +
          Math.pow(this.playerPixelPos.y - enemyPixel.y, 2)
        );
        if (!this.state.activePowerUps.has('invincibility') && pixelDistance < this.cellSize * 0.6) {
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
    this.sounds.playLevelComplete();
    
    // Clear all active power-ups
    this.state.activePowerUps.clear();
    
    this.state.level++;
    
    setTimeout(() => {
      this.startLevel();
    }, 1000);
  }

  private gameOver(): void {
    this.state.gameOver = true;
    this.sounds.playGameOver();
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
      this.renderer.renderEnemy(this.state.enemyVisualPosition, this.enemyPath.slice(this.enemyPathIndex));
    }
    
    this.renderer.renderPlayer(this.state.playerVisualPosition, this.state.activePowerUps.has('invincibility'));
    this.renderer.renderActivePowerUps(this.state.activePowerUps);
  }

  start(): void {
    requestAnimationFrame((time) => this.update(time));
  }
}