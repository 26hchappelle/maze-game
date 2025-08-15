import { Game } from './game';
import { palettes, defaultPalette } from './palettes';
import { ColorPalette } from './types';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const paletteSelector = document.getElementById('palette-selector') as HTMLElement;
  const gameContainer = document.getElementById('game-container') as HTMLElement;
  const paletteGrid = document.getElementById('palette-grid') as HTMLElement;
  const startButton = document.getElementById('start-game-btn') as HTMLButtonElement;
  const restartButton = document.getElementById('restart-btn') as HTMLButtonElement;
  const gameOverDiv = document.getElementById('game-over') as HTMLElement;
  
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }
  
  let selectedPalette: ColorPalette = defaultPalette;
  let game: Game | null = null;
  
  // Function to show palette selector
  const showPaletteSelector = () => {
    paletteSelector.classList.remove('hidden');
    gameContainer.classList.add('hidden');
    gameOverDiv.classList.add('hidden');
  };
  
  // Function to apply palette colors to UI
  const applyPaletteColors = (palette: ColorPalette) => {
    document.body.style.background = palette.background;
    gameContainer.style.background = palette.containerBg;
    gameContainer.style.borderColor = palette.wall;
    
    const gameHeader = document.getElementById('game-header');
    if (gameHeader) {
      gameHeader.style.background = palette.headerBg;
      gameHeader.style.color = palette.text;
    }
    
    // Update level and timer display colors
    const levelDisplay = document.getElementById('level-display');
    const timerDisplay = document.getElementById('timer-display');
    if (levelDisplay) levelDisplay.style.color = palette.text;
    if (timerDisplay) timerDisplay.style.color = palette.text;
    
    const gameOverDiv = document.getElementById('game-over');
    if (gameOverDiv) {
      gameOverDiv.style.background = palette.headerBg;
      gameOverDiv.style.borderColor = palette.wall;
      gameOverDiv.style.color = palette.text;
      
      // Update game over heading
      const h2 = gameOverDiv.querySelector('h2');
      if (h2) h2.style.color = palette.enemy;
      
      // Update game over paragraph
      const p = gameOverDiv.querySelector('p');
      if (p) p.style.color = palette.text;
    }
    
    // Update restart button
    const restartBtn = document.getElementById('restart-btn') as HTMLButtonElement;
    if (restartBtn) {
      restartBtn.style.background = palette.wall;
      restartBtn.style.color = palette.ui;
    }
    
    // Update start button
    const startBtn = document.getElementById('start-game-btn') as HTMLButtonElement;
    if (startBtn) {
      startBtn.style.background = palette.accent;
      startBtn.style.color = palette.floor;
    }
    
    // Update victory screen
    const victoryScreen = document.getElementById('victory-screen');
    if (victoryScreen) {
      victoryScreen.style.background = palette.headerBg;
      victoryScreen.style.borderColor = palette.wall;
      victoryScreen.style.color = palette.text;
      
      // Update victory heading
      const h2 = victoryScreen.querySelector('h2');
      if (h2) h2.style.color = palette.accent;
      
      // Update victory paragraphs
      const paragraphs = victoryScreen.querySelectorAll('p');
      paragraphs.forEach(p => {
        (p as HTMLElement).style.color = palette.text;
      });
      
      // Victory time in accent color
      const victoryTime = victoryScreen.querySelector('.victory-time');
      if (victoryTime) (victoryTime as HTMLElement).style.color = palette.accent;
    }
    
    // Update victory play again button
    const victoryBtn = document.getElementById('victory-play-again') as HTMLButtonElement;
    if (victoryBtn) {
      victoryBtn.style.background = palette.accent;
      victoryBtn.style.color = palette.floor;
    }
    
    // Also apply to palette selector panel
    paletteSelector.style.background = palette.containerBg;
    paletteSelector.style.borderColor = palette.wall;
    
    // Update palette selector heading
    const h2 = paletteSelector.querySelector('h2');
    if (h2) h2.style.color = palette.text;
    
    // Update all palette card names
    document.querySelectorAll('.palette-name').forEach((nameEl) => {
      (nameEl as HTMLElement).style.color = palette.text;
    });
  };
  
  // Function to start game with selected palette
  const startGame = () => {
    paletteSelector.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    gameOverDiv.classList.add('hidden');
    
    // Apply palette colors to UI
    applyPaletteColors(selectedPalette);
    
    // Stop previous game if exists
    if (game) {
      game.stop();
    }
    
    // Initialize and start the game with selected palette
    game = new Game(canvas, selectedPalette, showPaletteSelector);
    game.start();
    
    // Display controls
    console.log('🎮 Controls:');
    console.log('  • Arrow keys or WASD to move (hold for continuous movement)');
    console.log('  • M to toggle sound on/off');
    console.log('  • Enter to choose new palette when game over');
    console.log('📍 Objective: Reach the golden exit before the red enemy catches you!');
    console.log('✨ Power-ups: Blue (Speed), Purple (Invincibility), Orange (Reveal), Cyan (Freeze)');
  };
  
  // Create palette selection UI
  palettes.forEach((palette, index) => {
    const paletteCard = document.createElement('div');
    paletteCard.className = 'palette-card';
    if (index === 0) paletteCard.classList.add('selected');
    
    // Style the card with the palette's own colors
    paletteCard.style.background = palette.headerBg;
    paletteCard.style.borderColor = palette.wall;
    
    // Create card with just the palette name
    paletteCard.innerHTML = `
      <div class="palette-name" style="color: ${palette.text}">${palette.name}</div>
    `;
    
    paletteCard.addEventListener('click', () => {
      // Remove selected class from all cards
      document.querySelectorAll('.palette-card').forEach(card => {
        card.classList.remove('selected');
      });
      
      // Add selected class to clicked card
      paletteCard.classList.add('selected');
      paletteCard.style.borderColor = palette.accent;
      selectedPalette = palette;
      
      // Apply palette colors to UI immediately for preview
      applyPaletteColors(palette);
    });
    
    paletteGrid.appendChild(paletteCard);
  });
  
  // Apply default palette colors on load
  applyPaletteColors(defaultPalette);
  
  // Start game when button is clicked
  startButton.addEventListener('click', startGame);
  
  // Restart button now goes back to palette selection
  restartButton.addEventListener('click', showPaletteSelector);
});