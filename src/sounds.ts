export class SoundEffects {
  private audioContext: AudioContext;
  private enabled: boolean = true;
  private initialized: boolean = false;
  
  constructor() {
    // @ts-ignore - AudioContext might have vendor prefix
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Handle mobile audio context suspension
    if (this.audioContext.state === 'suspended') {
      this.initialized = false;
    } else {
      this.initialized = true;
    }
  }
  
  // Resume audio context on user interaction (required for mobile)
  async resumeAudioContext(): Promise<void> {
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        this.initialized = true;
        console.log('Audio context resumed');
      } catch (error) {
        console.error('Failed to resume audio context:', error);
      }
    }
  }
  
  private async ensureAudioContext(): Promise<void> {
    if (!this.initialized || this.audioContext.state === 'suspended') {
      await this.resumeAudioContext();
    }
  }
  
  private async createOscillator(frequency: number, type: OscillatorType, duration: number, volume: number = 0.3): Promise<void> {
    if (!this.enabled) return;
    
    // Ensure audio context is running
    await this.ensureAudioContext();
    if (this.audioContext.state !== 'running') return;
    
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
  
  async playMove(): Promise<void> {
    await this.createOscillator(200, 'square', 0.05, 0.1);
  }
  
  async playPowerUp(): Promise<void> {
    if (!this.enabled) return;
    await this.ensureAudioContext();
    if (this.audioContext.state !== 'running') return;
    
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
  
  async playLevelComplete(): Promise<void> {
    if (!this.enabled) return;
    await this.ensureAudioContext();
    if (this.audioContext.state !== 'running') return;
    
    // Victory fanfare
    const notes = [523, 659, 784, 1047]; // C, E, G, High C
    notes.forEach((freq, i) => {
      setTimeout(async () => {
        await this.createOscillator(freq, 'sine', 0.2, 0.25);
      }, i * 100);
    });
  }
  
  async playGameOver(): Promise<void> {
    if (!this.enabled) return;
    await this.ensureAudioContext();
    if (this.audioContext.state !== 'running') return;
    
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
  
  async playEnemyNear(): Promise<void> {
    // Low ominous tone
    await this.createOscillator(80, 'sine', 0.3, 0.2);
  }
  
  async playEnemySpawn(): Promise<void> {
    if (!this.enabled) return;
    await this.ensureAudioContext();
    if (this.audioContext.state !== 'running') return;
    
    // Alert sound
    const frequencies = [300, 200, 300, 200];
    frequencies.forEach((freq, i) => {
      setTimeout(async () => {
        await this.createOscillator(freq, 'square', 0.1, 0.2);
      }, i * 150);
    });
  }
  
  toggle(): void {
    this.enabled = !this.enabled;
  }
}