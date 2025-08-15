import { GameState, Position, PowerUp, Cell, ColorPalette } from './types';
import { MazeGenerator } from './maze';
import { Renderer } from './renderer';
import { SoundEffects } from './sounds';

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
  private cellSize: number;
  private sounds: SoundEffects;
  private animationSpeed: number = 200; // ms for smooth movement
  private freezeTimeout: ReturnType<typeof setTimeout> | null = null;
  private animationFrameId: number | null = null;
  private onGameOverCallback?: () => void;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private minSwipeDistance: number = 30;
  
  constructor(canvas: HTMLCanvasElement, palette: ColorPalette, onGameOver?: () => void) {
    this.canvas = canvas;
    this.sounds = new SoundEffects();
    
    // Calculate maze dimensions based on level
    this.mazeWidth = 15;
    this.mazeHeight = 15;
    
    // Calculate cell size based on screen size for mobile
    this.cellSize = this.calculateCellSize();
    this.renderer = new Renderer(canvas, this.cellSize);
    
    this.canvas.width = this.mazeWidth * this.cellSize;
    this.canvas.height = this.mazeHeight * this.cellSize;
    
    this.mazeGenerator = new MazeGenerator(this.mazeWidth, this.mazeHeight);
    this.exitPosition = { x: this.mazeWidth - 1, y: this.mazeHeight - 1 };
    
    this.state = this.createInitialState(palette);
    this.onGameOverCallback = onGameOver;
    
    this.setupEventListeners();
    this.startLevel();
  }

  private calculateCellSize(): number {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      // Calculate based on viewport size to fit screen
      const maxWidth = window.innerWidth - 40;  // Account for padding
      const maxHeight = window.innerHeight - 120;  // Account for header and padding
      
      // Start with a base of 15x15 maze
      const cellSizeByWidth = Math.floor(maxWidth / 15);
      const cellSizeByHeight = Math.floor(maxHeight / 15);
      
      // Use the smaller to ensure it fits
      return Math.min(cellSizeByWidth, cellSizeByHeight, 24);
    }
    return 24;  // Default desktop size
  }
  
  private createInitialState(palette: ColorPalette): GameState {
    return {
      level: 1,
      playerPosition: { x: 0, y: 0 },
      playerVisualPosition: { x: 0, y: 0 },
      playerStartPosition: { x: 0, y: 0 },
      enemyPosition: { x: 0, y: 0 },
      enemyVisualPosition: { x: 0, y: 0 },
      enemyActive: false,
      enemySpeed: 400, // milliseconds between moves (starts slower)
      gameOver: false,
      levelComplete: false,
      victory: false,
      powerUps: [],
      activePowerUps: new Map(),
      elapsedTime: 0,
      totalTime: 0,
      exploredCells: new Set<string>(),
      keysPressed: new Set<string>(),
      playerSpeed: 150, // milliseconds between moves
      lastMoveTime: 0,
      isMoving: false,
      moveProgress: 0,
      currentPalette: palette,
      cheatMode: false
    };
  }

  private keyDownHandler = (e: KeyboardEvent) => this.handleKeyDown(e);
  private keyUpHandler = (e: KeyboardEvent) => this.handleKeyUp(e);
  private enterKeyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && this.state.gameOver) {
      if (this.onGameOverCallback) {
        this.onGameOverCallback();
      }
    }
  };
  private touchStartHandler = (e: TouchEvent) => this.handleTouchStart(e);
  private touchEndHandler = (e: TouchEvent) => this.handleTouchEnd(e);
  
  private setupEventListeners(): void {
    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);
    window.addEventListener('keydown', this.enterKeyHandler);
    
    // Add touch event listeners for mobile
    this.canvas.addEventListener('touchstart', this.touchStartHandler, { passive: false });
    this.canvas.addEventListener('touchend', this.touchEndHandler, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
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
    
    // Handle cheat code activation
    if (e.key === '9' && !this.state.cheatMode) {
      this.state.cheatMode = true;
      console.log('🎮 Cheat mode activated! Invincibility and full map reveal enabled.');
      // Reveal entire map immediately
      for (let y = 0; y < this.mazeHeight; y++) {
        for (let x = 0; x < this.mazeWidth; x++) {
          this.state.exploredCells.add(`${x},${y}`);
        }
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
  
  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (this.state.gameOver || this.state.levelComplete || this.state.victory) return;
    
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
  }
  
  private handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    if (this.state.gameOver || this.state.levelComplete || this.state.victory) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;
    const deltaTime = Date.now() - this.touchStartTime;
    
    // Only process if it was a quick swipe (less than 500ms)
    if (deltaTime > 500) return;
    
    // Calculate swipe distance
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Only process if swipe was long enough
    if (distance < this.minSwipeDistance) return;
    
    // Determine swipe direction
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    let direction: Position | null = null;
    
    if (absX > absY) {
      // Horizontal swipe
      direction = deltaX > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
    } else {
      // Vertical swipe
      direction = deltaY > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
    }
    
    // Move player in the swipe direction
    if (direction) {
      this.movePlayer(direction);
    }
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
      this.state.isMoving = true;
      this.state.moveProgress = 0;
      
      // Play move sound
      this.sounds.playMove();
      
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
        this.sounds.playPowerUp();
        this.activatePowerUp(powerUp);
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
      
      // Clear any existing freeze timeout
      if (this.freezeTimeout) {
        clearTimeout(this.freezeTimeout);
      }
      
      // Set new freeze timeout
      this.freezeTimeout = setTimeout(() => {
        if (!this.state.gameOver && !this.state.levelComplete) {
          this.state.enemyActive = true;
        }
        this.freezeTimeout = null;
      }, powerUp.duration);
    } else {
      this.state.activePowerUps.set(powerUp.type, powerUp.duration);
    }
  }

  private startLevel(): void {
    // Start at 10x10, increase randomly each level
    const baseSize = 10;
    
    // Calculate cumulative increases for current level
    let widthIncrease = 0;
    let heightIncrease = 0;
    
    // For each level beyond 1, randomly add 2 to one dimension and 3 to the other
    for (let i = 1; i < this.state.level; i++) {
      // Use level number as seed for consistent random per level
      const randomChoice = (i * 7 + 13) % 2; // Simple deterministic "random"
      if (randomChoice === 0) {
        widthIncrease += 2;
        heightIncrease += 3;
      } else {
        widthIncrease += 3;
        heightIncrease += 2;
      }
    }
    
    this.mazeWidth = Math.min(baseSize + widthIncrease, 40);
    this.mazeHeight = Math.min(baseSize + heightIncrease, 40);
    
    // Recalculate cell size for mobile based on new maze dimensions
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      const maxWidth = window.innerWidth - 40;
      const maxHeight = window.innerHeight - 120;
      const cellSizeByWidth = Math.floor(maxWidth / this.mazeWidth);
      const cellSizeByHeight = Math.floor(maxHeight / this.mazeHeight);
      this.cellSize = Math.min(cellSizeByWidth, cellSizeByHeight, 24);
      this.renderer = new Renderer(this.canvas, this.cellSize);
    }
    
    // Adjust canvas size
    this.canvas.width = this.mazeWidth * this.cellSize;
    this.canvas.height = this.mazeHeight * this.cellSize;
    
    // Generate maze first, before any positioning
    this.mazeGenerator = new MazeGenerator(this.mazeWidth, this.mazeHeight);
    this.maze = this.mazeGenerator.generate(this.state.level);
    
    // Randomize start and end positions AFTER maze is generated
    const corners = [
      { x: 0, y: 0 },
      { x: this.mazeWidth - 1, y: 0 },
      { x: 0, y: this.mazeHeight - 1 },
      { x: this.mazeWidth - 1, y: this.mazeHeight - 1 }
    ];
    
    const shuffled = [...corners].sort(() => Math.random() - 0.5);
    this.state.playerPosition = shuffled[0];
    this.state.playerVisualPosition = { ...shuffled[0] };
    this.state.playerStartPosition = { ...shuffled[0] };
    this.exitPosition = shuffled[1];
    
    // Enemy ALWAYS spawns at player's start position
    this.state.enemyPosition = { ...this.state.playerStartPosition };
    this.state.enemyVisualPosition = { ...this.state.playerStartPosition };
    this.state.enemyActive = false;
    this.state.levelComplete = false;
    this.state.elapsedTime = 0;
    this.state.exploredCells = new Set<string>();
    this.state.keysPressed = new Set<string>();
    
    // If cheat mode is active, reveal entire new maze
    if (this.state.cheatMode) {
      for (let y = 0; y < this.mazeHeight; y++) {
        for (let x = 0; x < this.mazeWidth; x++) {
          this.state.exploredCells.add(`${x},${y}`);
        }
      }
    }
    this.state.lastMoveTime = 0;
    this.state.isMoving = false;
    this.state.moveProgress = 0;
    
    // Clear all active power-ups from previous level
    this.state.activePowerUps.clear();
    
    // Mark starting area as explored
    this.markCellsAsExplored();
    
    // Calculate enemy speed (20% faster each level)
    // Level 1: 400ms, Level 2: 320ms, Level 3: 256ms, etc.
    const baseSpeed = 400;
    const speedMultiplier = Math.pow(0.8, this.state.level - 1); // 0.8 = 20% faster (80% of previous time)
    this.state.enemySpeed = Math.max(50, Math.round(baseSpeed * speedMultiplier));
    
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
        
        // Check collision (cheat mode provides permanent invincibility)
        if (!this.state.cheatMode && !this.state.activePowerUps.has('invincibility') &&
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
    this.sounds.playLevelComplete();
    
    // Add current level time to total time
    this.state.totalTime += this.state.elapsedTime;
    
    // Clear all active power-ups
    this.state.activePowerUps.clear();
    
    // Clear freeze timeout to prevent enemy activation after level ends
    if (this.freezeTimeout) {
      clearTimeout(this.freezeTimeout);
      this.freezeTimeout = null;
    }
    
    // Check for victory (completed level 6)
    if (this.state.level === 6) {
      this.victory();
      return;
    }
    
    this.state.level++;
    
    setTimeout(() => {
      this.startLevel();
    }, 1000);
  }
  
  private victory(): void {
    this.state.victory = true;
    this.sounds.playLevelComplete();
    
    // Clear cheat mode after victory
    this.state.cheatMode = false;
    
    // Clear any timeouts
    if (this.freezeTimeout) {
      clearTimeout(this.freezeTimeout);
      this.freezeTimeout = null;
    }
    
    // Show victory screen
    const victoryScreen = document.getElementById('victory-screen');
    const totalTimeElement = document.getElementById('total-time');
    
    if (victoryScreen && totalTimeElement) {
      totalTimeElement.textContent = Math.floor(this.state.totalTime / 1000).toString();
      victoryScreen.classList.remove('hidden');
    }
    
    // Handle victory callback (return to palette selection)
    if (this.onGameOverCallback) {
      const victoryBtn = document.getElementById('victory-play-again');
      if (victoryBtn) {
        victoryBtn.addEventListener('click', () => {
          victoryScreen?.classList.add('hidden');
          this.onGameOverCallback!();
        });
      }
    }
  }

  private gameOver(): void {
    this.state.gameOver = true;
    this.sounds.playGameOver();
    
    // Clear freeze timeout to prevent issues
    if (this.freezeTimeout) {
      clearTimeout(this.freezeTimeout);
      this.freezeTimeout = null;
    }
    
    const gameOverDiv = document.getElementById('game-over');
    const finalLevel = document.getElementById('final-level');
    
    if (gameOverDiv && finalLevel) {
      finalLevel.textContent = this.state.level.toString();
      gameOverDiv.classList.remove('hidden');
    }
  }

  stop(): void {
    // Cancel animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Clear timeouts
    if (this.freezeTimeout) {
      clearTimeout(this.freezeTimeout);
      this.freezeTimeout = null;
    }
    
    // Remove event listeners
    window.removeEventListener('keydown', this.keyDownHandler);
    window.removeEventListener('keyup', this.keyUpHandler);
    window.removeEventListener('keydown', this.enterKeyHandler);
    this.canvas.removeEventListener('touchstart', this.touchStartHandler);
    this.canvas.removeEventListener('touchend', this.touchEndHandler);
    
    // Clear key states
    this.state.keysPressed.clear();
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
    
    if (!this.state.gameOver && !this.state.levelComplete && !this.state.victory) {
      this.state.elapsedTime += deltaTime;
      this.updateTimer();
      this.processInput(); // Process held keys
      this.updatePlayerAnimation(deltaTime);
      this.updateEnemy(deltaTime);
      this.updatePowerUps(deltaTime);
    }
    
    this.render();
    this.animationFrameId = requestAnimationFrame((time) => this.update(time));
  }


  private render(): void {
    this.renderer.clear(this.state.currentPalette);
    this.renderer.renderMaze(this.maze, this.state);
    this.renderer.renderExit(this.exitPosition, this.state);
    this.renderer.renderPowerUps(this.state.powerUps, this.state);
    
    if (this.state.enemyActive) {
      this.renderer.renderEnemy(this.state.enemyVisualPosition, this.enemyPath.slice(this.enemyPathIndex), this.state);
    }
    
    this.renderer.renderPlayer(this.state.playerVisualPosition, this.state.activePowerUps.has('invincibility'), this.state);
    this.renderer.renderActivePowerUps(this.state.activePowerUps, this.state.currentPalette);
  }

  private updatePlayerAnimation(deltaTime: number): void {
    if (this.state.isMoving) {
      this.state.moveProgress += deltaTime / this.animationSpeed;
      if (this.state.moveProgress >= 1) {
        this.state.moveProgress = 1;
        this.state.isMoving = false;
        this.state.playerVisualPosition = { ...this.state.playerPosition };
      } else {
        // Smooth interpolation
        const prevX = this.state.playerVisualPosition.x;
        const prevY = this.state.playerVisualPosition.y;
        const targetX = this.state.playerPosition.x;
        const targetY = this.state.playerPosition.y;
        
        this.state.playerVisualPosition = {
          x: prevX + (targetX - prevX) * this.state.moveProgress,
          y: prevY + (targetY - prevY) * this.state.moveProgress
        };
      }
    }
  }

  start(): void {
    this.animationFrameId = requestAnimationFrame((time) => this.update(time));
  }
}