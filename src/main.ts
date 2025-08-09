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
  console.log('🎮 Controls:');
  console.log('  • Arrow keys or WASD to move (hold for continuous movement)');
  console.log('  • M to toggle sound on/off');
  console.log('  • Enter to restart when game over');
  console.log('📍 Objective: Reach the golden exit before the red enemy catches you!');
  console.log('✨ Power-ups: Blue (Speed), Purple (Invincibility), Orange (Reveal), Cyan (Freeze)');
});