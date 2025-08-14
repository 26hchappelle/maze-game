import { ColorPalette } from './types';

export const palettes: ColorPalette[] = [
  {
    name: 'Retro Purple',
    wall: '#4a3c7a',
    floor: '#0f0720',
    player: '#4ade80',
    enemy: '#ff6b6b',
    exit: '#fbbf24',
    powerUps: {
      speed: '#3b82f6',
      invincibility: '#a855f7',
      reveal: '#f59e0b',
      freeze: '#06b6d4'
    },
    fog: 'rgba(15, 7, 32, 0.8)',
    ui: '#ffffff',
    background: '#2d1b69',
    containerBg: '#1a0e3d',
    headerBg: '#251952',
    text: '#9d94ff',
    accent: '#4ade80'
  },
  {
    name: 'Ocean Depths',
    wall: '#0e4166',
    floor: '#001e3c',
    player: '#00ff9f',
    enemy: '#ff4757',
    exit: '#ffd700',
    powerUps: {
      speed: '#00d2ff',
      invincibility: '#b83cff',
      reveal: '#ffb142',
      freeze: '#00fff0'
    },
    fog: 'rgba(0, 30, 60, 0.8)',
    ui: '#ffffff',
    background: '#002951',
    containerBg: '#001329',
    headerBg: '#002244',
    text: '#00d2ff',
    accent: '#00ff9f'
  },
  {
    name: 'Forest Night',
    wall: '#2d5016',
    floor: '#0d1f07',
    player: '#7cfc00',
    enemy: '#dc143c',
    exit: '#ffd700',
    powerUps: {
      speed: '#00bfff',
      invincibility: '#ff69b4',
      reveal: '#ffa500',
      freeze: '#40e0d0'
    },
    fog: 'rgba(13, 31, 7, 0.8)',
    ui: '#ffffff',
    background: '#1a3310',
    containerBg: '#0f1f0a',
    headerBg: '#1a2914',
    text: '#7cfc00',
    accent: '#7cfc00'
  },
  {
    name: 'Desert Sands',
    wall: '#8b4513',
    floor: '#2b1f0e',
    player: '#98fb98',
    enemy: '#ff6347',
    exit: '#ffd700',
    powerUps: {
      speed: '#87ceeb',
      invincibility: '#dda0dd',
      reveal: '#ff8c00',
      freeze: '#48d1cc'
    },
    fog: 'rgba(43, 31, 14, 0.8)',
    ui: '#ffffff',
    background: '#523319',
    containerBg: '#3d2514',
    headerBg: '#4a2f1a',
    text: '#ffa500',
    accent: '#98fb98'
  },
  {
    name: 'Volcanic',
    wall: '#8b0000',
    floor: '#1a0000',
    player: '#00ff7f',
    enemy: '#ff4500',
    exit: '#ffd700',
    powerUps: {
      speed: '#1e90ff',
      invincibility: '#ff1493',
      reveal: '#ff8c00',
      freeze: '#00ced1'
    },
    fog: 'rgba(26, 0, 0, 0.8)',
    ui: '#ffffff',
    background: '#330000',
    containerBg: '#1a0000',
    headerBg: '#4d0000',
    text: '#ff6b6b',
    accent: '#00ff7f'
  },
  {
    name: 'Monochrome',
    wall: '#606060',
    floor: '#1a1a1a',
    player: '#ffffff',
    enemy: '#808080',
    exit: '#c0c0c0',
    powerUps: {
      speed: '#a0a0a0',
      invincibility: '#d0d0d0',
      reveal: '#909090',
      freeze: '#b0b0b0'
    },
    fog: 'rgba(26, 26, 26, 0.8)',
    ui: '#ffffff',
    background: '#2a2a2a',
    containerBg: '#1a1a1a',
    headerBg: '#333333',
    text: '#c0c0c0',
    accent: '#ffffff'
  }
];

export const defaultPalette = palettes[0];