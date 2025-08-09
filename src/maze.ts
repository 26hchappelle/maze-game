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
    this.generateMazeRecursive(0, 0);
    
    // Add complexity based on difficulty
    if (difficulty > 5) {
      this.addExtraWalls(Math.min(difficulty * 2, 30));
    }
    
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

  private addExtraWalls(count: number): void {
    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * (this.width - 2)) + 1;
      const y = Math.floor(Math.random() * (this.height - 2)) + 1;
      
      const walls = ['top', 'right', 'bottom', 'left'];
      const wall = walls[Math.floor(Math.random() * walls.length)];
      
      // Only add wall if it doesn't completely block the path
      if (this.hasAlternativePath(x, y, wall)) {
        (this.cells[y][x].walls as any)[wall] = true;
      }
    }
  }

  private hasAlternativePath(x: number, y: number, wallToAdd: string): boolean {
    const walls = this.cells[y][x].walls;
    let openWalls = 0;
    
    if (!walls.top && wallToAdd !== 'top') openWalls++;
    if (!walls.right && wallToAdd !== 'right') openWalls++;
    if (!walls.bottom && wallToAdd !== 'bottom') openWalls++;
    if (!walls.left && wallToAdd !== 'left') openWalls++;
    
    return openWalls >= 1;
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
}