/**
 * Zustand 스토어 메인 익스포트
 */

export { useGameStore } from './gameStore';
export { useStatsStore } from './statsStore';
export { useSettingsStore } from './settingsStore';

// Import 구문들
import { useSettingsStore } from './settingsStore';
import { useStatsStore } from './statsStore';

// 스토어 초기화 함수
export function initializeStores() {
  // 스토어 인스턴스 가져오기
  const settingsStore = useSettingsStore.getState();
  const statsStore = useStatsStore.getState();
  
  settingsStore.loadSettings();
  statsStore.loadStats();
}