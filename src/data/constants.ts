// 게임 상수
export const MAX_LETTERS = 2;
export const NUMBER_OF_GUESSES = 7;

// 이모지 상수
export const EMOTE_MATCH = '🥕';    // 당근 - 정확한 일치
export const EMOTE_SIMILAR = '🍄';  // 버섯 - 유사함
export const EMOTE_MANY = '🧄';     // 마늘 - 많은 일치
export const EMOTE_EXISTS = '🍆';   // 가지 - 존재함
export const EMOTE_OPPOSITE = '🍌'; // 바나나 - 반대 위치
export const EMOTE_NONE = '🍎';     // 사과 - 일치하지 않음

// 키보드 레이아웃 (한글)
export const HANGUL_KEYBOARD_ROWS = [
  ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
  ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
  ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ'],
];

// 테마 관련
export const THEME_DEFAULT = 0;
export const THEME_DARK = 1;
export const THEME_LIGHT = 2;

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  GAME_STATS: 'gameStats',
  CURRENT_GAME: 'currentGame',
  SETTINGS: 'settings',
} as const;