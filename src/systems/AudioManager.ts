import { AudioSettings } from '../types/game';
import { EventBus } from './EventBus';

const AUDIO_SETTINGS_KEY = 'the_last_bell_audio_v1';

/**
 * Procedural Web Audio synthesis engine for Chapter 01 atmosphere & UI feedback.
 * Zero external audio file dependencies; respects Master / Music / SFX / Mute sliders.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private rainNode: AudioNode | null = null;
  private ambienceOsc: OscillatorNode | null = null;
  private tensionInterval: number | null = null;

  private settings: AudioSettings = {
    masterVolume: 0.75,
    musicVolume: 0.55,
    sfxVolume: 0.8,
    muted: false,
  };

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    try {
      const raw = localStorage.getItem(AUDIO_SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AudioSettings>;
        this.settings = { ...this.settings, ...parsed };
      }
    } catch {
      // Ignore storage failures
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      // Ignore storage failures
    }
  }

  unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.applyGains();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  updateSettings(partial: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...partial };
    this.applyGains();
    this.saveSettings();
    EventBus.emit('audio:updated', this.getSettings());
  }

  toggleMute(): void {
    this.updateSettings({ muted: !this.settings.muted });
  }

  private applyGains(): void {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const master = this.settings.muted ? 0 : this.settings.masterVolume;
    this.masterGain.gain.setTargetAtTime(master, now, 0.04);
    this.musicGain.gain.setTargetAtTime(this.settings.musicVolume, now, 0.04);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfxVolume, now, 0.04);
  }

  playClick(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.045);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  playKeyTick(): void {
    if (!this.ctx || !this.sfxGain || this.settings.muted) return;
    if (this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(920 + Math.random() * 140, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.016);
    gain.gain.setValueAtTime(0.025, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.02);
  }

  playEvidence(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [440, 554.37, 659.25].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.12, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.38);
    });
  }

  playClockTick(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.025);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  playDoorLock(unlocked = false): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(unlocked ? 320 : 140, now);
    osc.frequency.setValueAtTime(unlocked ? 480 : 110, now + 0.09);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  playSchoolBell(): void {
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 1046.5].forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(i === 0 ? 0.24 : 0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 2.5);
    });
  }

  setRainActive(active: boolean): void {
    this.unlock();
    if (!this.ctx || !this.musicGain) return;
    if (!active && this.rainNode) {
      this.rainNode.disconnect();
      this.rainNode = null;
      return;
    }
    if (active && !this.rainNode) {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0;
      let b1 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.06;
        b1 = 0.96 * b1 + white * 0.09;
        data[i] = (b0 + b1) * 0.35;
      }
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 900;
      filter.Q.value = 0.7;

      const gain = this.ctx.createGain();
      gain.gain.value = 0.14;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      source.start();
      this.rainNode = gain;
    }
  }

  setAmbienceActive(active: boolean): void {
    this.unlock();
    if (!this.ctx || !this.musicGain) return;
    if (!active && this.ambienceOsc) {
      try {
        this.ambienceOsc.stop();
      } catch {
        // already stopped
      }
      this.ambienceOsc.disconnect();
      this.ambienceOsc = null;
      return;
    }
    if (active && !this.ambienceOsc) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 60;
      gain.gain.value = 0.04;
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start();
      this.ambienceOsc = osc;
    }
  }

  setTensionMusic(active: boolean): void {
    if (!active && this.tensionInterval !== null) {
      window.clearInterval(this.tensionInterval);
      this.tensionInterval = null;
      return;
    }
    if (active && this.tensionInterval === null && typeof window !== 'undefined') {
      const notes = [146.83, 174.61, 164.81, 130.81]; // D minor ambient motif
      let step = 0;
      this.tensionInterval = window.setInterval(() => {
        if (!this.ctx || !this.musicGain || this.settings.muted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(notes[step % notes.length], now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 2.9);
        step++;
      }, 3200);
    }
  }

  stopAllLoops(): void {
    this.setRainActive(false);
    this.setAmbienceActive(false);
    this.setTensionMusic(false);
  }
}

export const audioManager = new AudioManager();
