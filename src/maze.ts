import { Cell, Position } from './types';

export class MazeGenerator {
  private width: number;
  private height: number;
  private cells: Cell[][];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cells = [];
  }

  generate(difficulty: number): Cell[][] {
    this.initializeCells();
    
    // Generate base maze structure
    this.generateMazeRecursive(0, 0);
    
    // Add loops and alternative paths for more interesting gameplay
    this.addLoops(Math.min(10 + difficulty * 2, 30));
    
    // Add some dead ends for complexity
    this.addDeadEnds(Math.min(5 + difficulty, 15));
    
    // Ensure the maze is solvable by verifying path exists
    this.ensureSolvable();
    
    return this.cells;
  }

  private initializeCells(): void {
    this.cells = [];
    for (let y = 0; y < this.height; y++) {
      this.cells[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.cells[y][x] = {
          x,
          y,
          walls: { top: true, right: true, bottom: true, left: true },
          visited: false
        };
      }
    }
  }

  private generateMazeRecursive(x: number, y: number): void {
    this.cells[y][x].visited = true;
    
    const directions = this.shuffleArray([
      { dx: 0, dy: -1, wall: 'top', oppositeWall: 'bottom' },
      { dx: 1, dy: 0, wall: 'right', oppositeWall: 'left' },
      { dx: 0, dy: 1, wall: 'bottom', oppositeWall: 'top' },
      { dx: -1, dy: 0, wall: 'left', oppositeWall: 'right' }
    ]);

    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;

      if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height && !this.cells[ny][nx].visited) {
        (this.cells[y][x].walls as any)[dir.wall] = false;
        (this.cells[ny][nx].walls as any)[dir.oppositeWall] = false;
        this.generateMazeRecursive(nx, ny);
      }
    }
  }

  private addLoops(count: number): void {
    // Create loops by removing walls between adjacent cells
    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * (this.width - 1));
      const y = Math.floor(Math.random() * (this.height - 1));
      
      // Randomly choose to remove a horizontal or vertical wall
      if (Math.random() < 0.5) {
        // Remove horizontal wall
        if (x < this.width - 1 && this.cells[y][x].walls.right) {
          // Check if removing this wall won't isolate any area
          this.cells[y][x].walls.right = false;
          this.cells[y][x + 1].walls.left = false;
        }
      } else {
        // Remove vertical wall
        if (y < this.height - 1 && this.cells[y][x].walls.bottom) {
          this.cells[y][x].walls.bottom = false;
          this.cells[y + 1][x].walls.top = false;
        }
      }
    }
  }

  private addDeadEnds(count: number): void {
    // Create dead-end branches for maze complexity
    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);
      
      const cell = this.cells[y][x];
      const openings = this.countOpenings(cell);
      
      // Only create dead ends from cells with 2-3 openings
      if (openings >= 2 && openings <= 3) {
        const directions = this.shuffleArray(['top', 'right', 'bottom', 'left']);
        for (const dir of directions) {
          if ((cell.walls as any)[dir]) {
            const neighbor = this.getNeighborPosition(x, y, dir);
            if (neighbor && this.canCreateDeadEnd(neighbor.x, neighbor.y)) {
              (cell.walls as any)[dir] = false;
              const oppositeDir = this.getOppositeDirection(dir);
              (this.cells[neighbor.y][neighbor.x].walls as any)[oppositeDir] = false;
              break;
            }
          }
        }
      }
    }
  }

  private ensureSolvable(): void {
    // Always ensure there's at least one path from any corner to any other corner
    // This is already guaranteed by the recursive generation, but we double-check
    const corners = [
      { x: 0, y: 0 },
      { x: this.width - 1, y: 0 },
      { x: 0, y: this.height - 1 },
      { x: this.width - 1, y: this.height - 1 }
    ];
    
    // Verify at least one valid path exists between opposite corners
    for (let i = 0; i < corners.length; i++) {
      for (let j = i + 1; j < corners.length; j++) {
        const path = this.findPath(corners[i], corners[j]);
        if (path.length === 0) {
          // If no path exists, we have a problem - regenerate
          console.warn('Maze was not solvable, regenerating...');
          this.initializeCells();
          this.generateMazeRecursive(0, 0);
          return;
        }
      }
    }
  }


  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  findPath(start: Position, end: Position): Position[] {
    const queue: { pos: Position; path: Position[] }[] = [{ pos: start, path: [start] }];
    const visited = new Set<string>();
    visited.add(`${start.x},${start.y}`);

    while (queue.length > 0) {
      const { pos, path } = queue.shift()!;

      if (pos.x === end.x && pos.y === end.y) {
        return path;
      }

      const neighbors = this.getValidNeighbors(pos);
      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ pos: neighbor, path: [...path, neighbor] });
        }
      }
    }

    return [];
  }

  private getValidNeighbors(pos: Position): Position[] {
    const neighbors: Position[] = [];
    const cell = this.cells[pos.y][pos.x];

    if (!cell.walls.top && pos.y > 0) {
      neighbors.push({ x: pos.x, y: pos.y - 1 });
    }
    if (!cell.walls.right && pos.x < this.width - 1) {
      neighbors.push({ x: pos.x + 1, y: pos.y });
    }
    if (!cell.walls.bottom && pos.y < this.height - 1) {
      neighbors.push({ x: pos.x, y: pos.y + 1 });
    }
    if (!cell.walls.left && pos.x > 0) {
      neighbors.push({ x: pos.x - 1, y: pos.y });
    }

    return neighbors;
  }

  getCell(x: number, y: number): Cell | null {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.cells[y][x];
    }
    return null;
  }

  private countOpenings(cell: Cell): number {
    let count = 0;
    if (!cell.walls.top) count++;
    if (!cell.walls.right) count++;
    if (!cell.walls.bottom) count++;
    if (!cell.walls.left) count++;
    return count;
  }

  private getNeighborPosition(x: number, y: number, direction: string): Position | null {
    switch (direction) {
      case 'top': return y > 0 ? { x, y: y - 1 } : null;
      case 'bottom': return y < this.height - 1 ? { x, y: y + 1 } : null;
      case 'left': return x > 0 ? { x: x - 1, y } : null;
      case 'right': return x < this.width - 1 ? { x: x + 1, y } : null;
      default: return null;
    }
  }

  private getOppositeDirection(direction: string): string {
    switch (direction) {
      case 'top': return 'bottom';
      case 'bottom': return 'top';
      case 'left': return 'right';
      case 'right': return 'left';
      default: return direction;
    }
  }

  private canCreateDeadEnd(x: number, y: number): boolean {
    const cell = this.cells[y][x];
    return this.countOpenings(cell) === 1;
  }

  getRandomPosition(avoid: Position[]): Position {
    let position: Position;
    do {
      position = {
        x: Math.floor(Math.random() * this.width),
        y: Math.floor(Math.random() * this.height)
      };
    } while (avoid.some(p => p.x === position.x && p.y === position.y));
    return position;
  }
}