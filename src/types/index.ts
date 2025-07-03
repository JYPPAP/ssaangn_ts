// 게임 상태 타입
export type GameStatus = 'playing' | 'won' | 'lost';

// 키보드 키 상태 타입
export type KeyStatus = 'unused' | 'used' | 'match' | 'none';

// 피드백 이모지 타입
export type FeedbackEmoji = '🥕' | '🍄' | '🧄' | '🍆' | '🍌' | '🍎';

// 게임 모드 타입 (향후 확장용)
export type GameMode = 'normal' | 'race' | 'magpie';

// 통계 데이터 타입
export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  bestStreak: number;
}

// 단어 데이터 타입
export interface WordData {
  id: number;
  word: string;
  meanings: string[]; // JSON 배열 형태로 저장된 의미들
}

// DB에서 가져올 때의 원시 형태 - re-export from database
export type { WordDataRaw } from './database';

// 게임 스토어 관련 타입들 re-export
export * from './gameTypes';