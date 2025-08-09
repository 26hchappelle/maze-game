export class SoundEffects {
  private audioContext: AudioContext;
  private enabled: boolean = true;
  
  constructor() {
    // @ts-ignore - AudioContext might have vendor prefix
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  private createOscillator(frequency: number, type: OscillatorType, duration: number, volume: number = 0.3): void {
    if (!this.enabled) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }
  
  playMove(): void {
    this.createOscillator(200, 'square', 0.05, 0.1);
  }
  
  playPowerUp(): void {
    // Rising tone
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.2);
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.3);
  }
  
  playLevelComplete(): void {
    // Victory fanfare
    const notes = [523, 659, 784, 1047]; // C, E, G, High C
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.createOscillator(freq, 'sine', 0.2, 0.25);
      }, i * 100);
    });
  }
  
  playGameOver(): void {
    // Descending tone
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);
    osc.type = 'sawtooth';
    
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.6);
  }
  
  playEnemyNear(): void {
    // Low ominous tone
    this.createOscillator(80, 'sine', 0.3, 0.2);
  }
  
  playEnemySpawn(): void {
    // Alert sound
    const frequencies = [300, 200, 300, 200];
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        this.createOscillator(freq, 'square', 0.1, 0.2);
      }, i * 150);
    });
  }
  
  toggle(): void {
    this.enabled = !this.enabled;
  }
}