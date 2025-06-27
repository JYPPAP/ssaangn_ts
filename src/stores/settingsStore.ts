import { create } from 'zustand';
import { getStorageItem, setStorageItem } from '../utils/storage';
import { STORAGE_KEYS, THEME_DEFAULT } from '../data/constants';

interface Settings {
  theme: number; // 0: default, 1: dark, 2: light
  soundEnabled: boolean;
  animationsEnabled: boolean;
}

interface SettingsState extends Settings {
  // 설정 액션
  setTheme: (theme: number) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  loadSettings: () => void;
  saveSettings: () => void;
  resetSettings: () => void;
}

const initialSettings: Settings = {
  theme: THEME_DEFAULT,
  soundEnabled: true,
  animationsEnabled: true,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...initialSettings,

  // 테마 설정
  setTheme: (theme: number) => {
    set({ theme });
    get().saveSettings();
    
    // CSS 클래스 업데이트
    const body = document.body;
    body.classList.remove('theme-default', 'theme-dark', 'theme-light');
    
    switch (theme) {
      case 1:
        body.classList.add('theme-dark');
        break;
      case 2:
        body.classList.add('theme-light');
        break;
      default:
        body.classList.add('theme-default');
        break;
    }
  },

  // 소리 설정
  setSoundEnabled: (enabled: boolean) => {
    set({ soundEnabled: enabled });
    get().saveSettings();
  },

  // 애니메이션 설정
  setAnimationsEnabled: (enabled: boolean) => {
    set({ animationsEnabled: enabled });
    get().saveSettings();
    
    // CSS 클래스 업데이트
    const body = document.body;
    if (enabled) {
      body.classList.remove('no-animations');
    } else {
      body.classList.add('no-animations');
    }
  },

  // 설정 로드
  loadSettings: () => {
    const savedSettings = getStorageItem<Settings>(STORAGE_KEYS.SETTINGS, initialSettings);
    set(savedSettings);
    
    // 로드된 설정 적용
    const { setTheme, setAnimationsEnabled } = get();
    setTheme(savedSettings.theme);
    setAnimationsEnabled(savedSettings.animationsEnabled);
  },

  // 설정 저장
  saveSettings: () => {
    const { setTheme, setSoundEnabled, setAnimationsEnabled, loadSettings, saveSettings, resetSettings, ...settingsOnly } = get();
    setStorageItem(STORAGE_KEYS.SETTINGS, settingsOnly);
  },

  // 설정 리셋
  resetSettings: () => {
    set(initialSettings);
    get().saveSettings();
    
    // 기본 설정 적용
    const { setTheme, setAnimationsEnabled } = get();
    setTheme(initialSettings.theme);
    setAnimationsEnabled(initialSettings.animationsEnabled);
  },
}));