import { Cell, Position } from './types';

export class Physics {
  private cellSize: number;
  private maze: Cell[][];
  private mazeWidth: number;
  private mazeHeight: number;
  
  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.maze = [];
    this.mazeWidth = 0;
    this.mazeHeight = 0;
  }
  
  setMaze(maze: Cell[][], width: number, height: number): void {
    this.maze = maze;
    this.mazeWidth = width;
    this.mazeHeight = height;
  }
  
  // Check if a pixel position can move in a direction
  canMovePixel(pixelX: number, pixelY: number, dx: number, dy: number, playerRadius: number = 8): boolean {
    const newX = pixelX + dx;
    const newY = pixelY + dy;
    
    // Check boundaries
    if (newX - playerRadius < 0 || newX + playerRadius > this.mazeWidth * this.cellSize ||
        newY - playerRadius < 0 || newY + playerRadius > this.mazeHeight * this.cellSize) {
      return false;
    }
    
    // Check collision with walls
    return !this.checkWallCollision(newX, newY, playerRadius);
  }
  
  private checkWallCollision(pixelX: number, pixelY: number, radius: number): boolean {
    // Get the grid cell the center is in
    const gridX = Math.floor(pixelX / this.cellSize);
    const gridY = Math.floor(pixelY / this.cellSize);
    
    if (gridX < 0 || gridX >= this.mazeWidth || gridY < 0 || gridY >= this.mazeHeight) {
      return true;
    }
    
    const cell = this.maze[gridY][gridX];
    const cellPixelX = gridX * this.cellSize;
    const cellPixelY = gridY * this.cellSize;
    
    // Check collision with each wall
    const relativeX = pixelX - cellPixelX;
    const relativeY = pixelY - cellPixelY;
    const wallThickness = 2;
    
    // Top wall
    if (cell.walls.top && relativeY - radius < wallThickness) {
      return true;
    }
    
    // Bottom wall
    if (cell.walls.bottom && relativeY + radius > this.cellSize - wallThickness) {
      return true;
    }
    
    // Left wall
    if (cell.walls.left && relativeX - radius < wallThickness) {
      return true;
    }
    
    // Right wall
    if (cell.walls.right && relativeX + radius > this.cellSize - wallThickness) {
      return true;
    }
    
    // Check adjacent cells for edge cases
    return this.checkAdjacentCells(pixelX, pixelY, radius);
  }
  
  private checkAdjacentCells(pixelX: number, pixelY: number, radius: number): boolean {
    const checkPositions = [
      { x: pixelX - radius, y: pixelY - radius }, // Top-left
      { x: pixelX + radius, y: pixelY - radius }, // Top-right
      { x: pixelX - radius, y: pixelY + radius }, // Bottom-left
      { x: pixelX + radius, y: pixelY + radius }, // Bottom-right
    ];
    
    for (const pos of checkPositions) {
      const gridX = Math.floor(pos.x / this.cellSize);
      const gridY = Math.floor(pos.y / this.cellSize);
      
      if (gridX < 0 || gridX >= this.mazeWidth || gridY < 0 || gridY >= this.mazeHeight) {
        return true;
      }
      
      const cell = this.maze[gridY][gridX];
      const cellPixelX = gridX * this.cellSize;
      const cellPixelY = gridY * this.cellSize;
      const wallThickness = 2;
      
      // Check if corner is hitting a wall
      if (pos.x >= cellPixelX && pos.x <= cellPixelX + wallThickness && cell.walls.left) {
        return true;
      }
      if (pos.x >= cellPixelX + this.cellSize - wallThickness && pos.x <= cellPixelX + this.cellSize && cell.walls.right) {
        return true;
      }
      if (pos.y >= cellPixelY && pos.y <= cellPixelY + wallThickness && cell.walls.top) {
        return true;
      }
      if (pos.y >= cellPixelY + this.cellSize - wallThickness && pos.y <= cellPixelY + this.cellSize && cell.walls.bottom) {
        return true;
      }
    }
    
    return false;
  }
  
  // Convert grid position to pixel position (center of cell)
  gridToPixel(gridX: number, gridY: number): { x: number; y: number } {
    return {
      x: gridX * this.cellSize + this.cellSize / 2,
      y: gridY * this.cellSize + this.cellSize / 2
    };
  }
  
  // Convert pixel position to grid position
  pixelToGrid(pixelX: number, pixelY: number): { x: number; y: number } {
    return {
      x: Math.floor(pixelX / this.cellSize),
      y: Math.floor(pixelY / this.cellSize)
    };
  }
  
  // Get valid movement vector considering walls
  getValidMovement(pixelX: number, pixelY: number, desiredDx: number, desiredDy: number, playerRadius: number = 8): { dx: number; dy: number } {
    // Try full movement first
    if (this.canMovePixel(pixelX, pixelY, desiredDx, desiredDy, playerRadius)) {
      return { dx: desiredDx, dy: desiredDy };
    }
    
    // Try sliding along walls (only X movement)
    if (desiredDx !== 0 && this.canMovePixel(pixelX, pixelY, desiredDx, 0, playerRadius)) {
      return { dx: desiredDx, dy: 0 };
    }
    
    // Try sliding along walls (only Y movement)
    if (desiredDy !== 0 && this.canMovePixel(pixelX, pixelY, 0, desiredDy, playerRadius)) {
      return { dx: 0, dy: desiredDy };
    }
    
    // No movement possible
    return { dx: 0, dy: 0 };
  }
}