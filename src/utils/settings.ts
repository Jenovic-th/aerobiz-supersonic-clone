export interface GameSettings {
  sfxEnabled: boolean;
  sfxVolume: number; // 0 - 100
  autoSaveEnabled: boolean;
  fastAnimation: boolean;
  crtFilter: boolean;
}

const SETTINGS_KEY = 'aerobiz_user_settings';

export const DEFAULT_SETTINGS: GameSettings = {
  sfxEnabled: true,
  sfxVolume: 80,
  autoSaveEnabled: true,
  fastAnimation: false,
  crtFilter: false,
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to load settings from localStorage', e);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings to localStorage', e);
  }
}
