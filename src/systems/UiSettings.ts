import { UiSettings } from '../types/game';
import { EventBus } from './EventBus';

const UI_SETTINGS_KEY = 'the_last_bell_ui_v1';
const INTRO_SEEN_KEY = 'the_last_bell_intro_seen_v1';
const CONTROLS_HINT_SEEN_KEY = 'the_last_bell_controls_hint_seen_v1';

export class UiSettingsManager {
  private settings: UiSettings = {
    showEnglish: false,
  };

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    try {
      const raw = localStorage.getItem(UI_SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UiSettings>;
        this.settings = {
          showEnglish: Boolean(parsed.showEnglish),
        };
      }
    } catch {
      // Ignore storage failures
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      // Ignore storage failures
    }
  }

  getSettings(): UiSettings {
    return { ...this.settings };
  }

  updateSettings(partial: Partial<UiSettings>): void {
    this.settings = { ...this.settings, ...partial };
    this.saveSettings();
    EventBus.emit('ui_settings:updated', this.getSettings());
  }

  hasSeenIntro(): boolean {
    try {
      return localStorage.getItem(INTRO_SEEN_KEY) === '1';
    } catch {
      return false;
    }
  }

  markIntroSeen(): void {
    try {
      localStorage.setItem(INTRO_SEEN_KEY, '1');
      EventBus.emit('intro:seen_updated', true);
    } catch {
      // Ignore storage failures
    }
  }

  hasSeenControlsHint(): boolean {
    try {
      return localStorage.getItem(CONTROLS_HINT_SEEN_KEY) === '1';
    } catch {
      return false;
    }
  }

  markControlsHintSeen(): void {
    try {
      localStorage.setItem(CONTROLS_HINT_SEEN_KEY, '1');
    } catch {
      // Ignore storage failures
    }
  }
}

export const uiSettings = new UiSettingsManager();
