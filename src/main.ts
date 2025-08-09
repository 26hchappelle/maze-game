import { Game } from './game';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }
  
  const game = new Game(canvas);
  game.start();
  
  // Display controls
  console.log('Controls: Arrow keys or WASD to move');
  console.log('Objective: Reach the golden exit before the red enemy catches you!');
  console.log('Power-ups: Blue (Speed), Purple (Invincibility), Orange (Reveal), Cyan (Freeze)');
});