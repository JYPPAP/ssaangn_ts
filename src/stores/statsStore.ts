import { create } from 'zustand';
import { GameStats } from '../types';
import { getStorageItem, setStorageItem } from '../utils/storage';
import { STORAGE_KEYS } from '../data/constants';

interface StatsState extends GameStats {
  // 추가 계산된 프로퍼티
  totalGames: number;
  winRate: number;
  
  // 통계 액션
  updateStats: (won: boolean, guessCount: number) => void;
  resetStats: () => void;
  loadStats: () => void;
  saveStats: () => void;
}

const initialStats: GameStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  bestStreak: 0,
};

export const useStatsStore = create<StatsState>((set, get) => ({
  ...initialStats,
  totalGames: 0,
  winRate: 0,

  // 통계 업데이트
  updateStats: (won: boolean, guessCount: number) => {
    const currentStats = get();
    
    const newGamesPlayed = currentStats.gamesPlayed + 1;
    const newGamesWon = currentStats.gamesWon + (won ? 1 : 0);
    
    const newStats = {
      gamesPlayed: newGamesPlayed,
      gamesWon: newGamesWon,
      currentStreak: won ? currentStats.currentStreak + 1 : 0,
      bestStreak: won 
        ? Math.max(currentStats.bestStreak, currentStats.currentStreak + 1)
        : currentStats.bestStreak,
      totalGames: newGamesPlayed,
      winRate: newGamesPlayed > 0 ? (newGamesWon / newGamesPlayed) * 100 : 0,
    };
    
    set(newStats);
    
    // 자동 저장
    get().saveStats();
  },

  // 통계 리셋
  resetStats: () => {
    const resetStats = { ...initialStats, totalGames: 0, winRate: 0 };
    set(resetStats);
    get().saveStats();
  },

  // 통계 로드
  loadStats: () => {
    const savedStats = getStorageItem<GameStats>(STORAGE_KEYS.GAME_STATS, initialStats);
    const totalGames = savedStats.gamesPlayed;
    const winRate = totalGames > 0 ? (savedStats.gamesWon / totalGames) * 100 : 0;
    
    set({ 
      ...savedStats, 
      totalGames,
      winRate 
    });
  },

  // 통계 저장
  saveStats: () => {
    const { updateStats, resetStats, loadStats, saveStats, ...statsOnly } = get();
    setStorageItem(STORAGE_KEYS.GAME_STATS, statsOnly);
  },
}));