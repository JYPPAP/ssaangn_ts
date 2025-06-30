
// 기본 게임 상수
export const MAX_LETTERS = 2;
export const NUMBER_OF_GUESSES = 7;
export const RACE_TIME_WINDOW = 7;
export const RACE_LAPS = 3;
export const PRACTICE_WORD = "노래";
export const PRACTICE_WORD_BACKUP = "무대";
export const MAX_INVALID_WORDS = 50;

// 테마 관련
export const THEME_DEFAULT = 0;

// 이모지 상수
export const EMOTE_MATCH = '🥕';
export const EMOTE_SIMILAR = '🍄';
export const EMOTE_MANY = '🧄';
export const EMOTE_EXISTS = '🍆';
export const EMOTE_OPPOSITE = '🍌';
export const EMOTE_NONE = '🍎';
export const EMOTE_HINT = '🎃';
export const EMOTE_ALL = '🥝';
export const EMOTE_RACE_TIME = '⏱️';
export const EMOTE_MAGPIE = '🐦';
export const EMOTE_CREATE_MAGPIE = '✏️';
export const EMOTE_INPUT_MAGPIE = '❌';
export const EMOTE_FINALIZE_MAGPIE = '📬';
export const EMOTE_COPY_MAGPIE = '📪';

// 데이터 인덱스 상수
const DATA_EMOTE = 0;
const DATA_NAME = 1;
export const DATA_SHORT = 2;
export const DATA_COLOR = 3;
export const DATA_LIMAGE = 4;
export const DATA_IMAGE = 5;
export const DATA_REVEAL = 6;
export const DATA_DESCRIPTION = 7;

// 게임 피드백 데이터 (원본 script.js와 동일)
export const DATA_MATCH = [
  EMOTE_MATCH, 
  "당근", 
  "ㄷ", 
  "rgb(255, 130, 45)", 
  "carrot.png", 
  "carrot.png", 
  "big-reveal", 
  EMOTE_MATCH + " 당연하죠~\n해당 글자와 일치해요"
] as const;

export const DATA_SIMILAR = [
  EMOTE_SIMILAR, 
  "버섯", 
  "ㅄ", 
  "rgb(248, 86, 155)", 
  "mushroom.png", 
  "mushroom.png", 
  "medium-reveal", 
  EMOTE_SIMILAR + " 비슷해요~\n자음과 모음 중 2개 이상이 일치하고 첫 자음도 일치해요"
] as const;

export const DATA_MANY = [
  EMOTE_MANY, 
  "마늘", 
  "ㅁ", 
  "rgb(229, 205, 179)", 
  "garlic.png", 
  "garlic.png", 
  "medium-reveal", 
  EMOTE_MANY + " 많을 거예요~\n자음과 모음 중 2개 이상이 있지만 첫 자음은 일치하지 않아요"
] as const;

export const DATA_EXISTS = [
  EMOTE_EXISTS, 
  "가지", 
  "ㄱ", 
  "rgb(140, 66, 179)", 
  "eggplant.png", 
  "eggplant.png", 
  "small-reveal", 
  EMOTE_EXISTS + " 가지고 있어요~\n입력한 자음과 모음 중 하나만 있어요"
] as const;

export const DATA_OPPOSITE = [
  EMOTE_OPPOSITE, 
  "바난", 
  "ㅂ", 
  "rgb(248, 214, 87)", 
  "banana_left.png", 
  "banana.png", 
  "small-reveal", 
  EMOTE_OPPOSITE + " 반대로요~\n입력한 자음과 모음 중 1개 이상 있긴 있는데 반대쪽 글자에서 일치해요"
] as const;

export const DATA_NONE = [
  EMOTE_NONE, 
  "사과", 
  "ㅅ", 
  "rgb(248, 49, 47)", 
  "apple.png", 
  "apple.png", 
  "small-reveal", 
  EMOTE_NONE + " 사과를 받아주세요~\n정답 두 글자 모두에서 일치하는 자음과 모음이 없어요"
] as const;

export const DATA_HINT = [
  EMOTE_HINT, 
  "호박", 
  "ㅎ", 
  "rgb(255, 130, 45)", 
  "pumpkin.png", 
  "pumpkin.png", 
  "small-reveal", 
  EMOTE_HINT + " 대박이에요~\n정답 두 글자 중에 일치하는 자음이나 모음이에요"
] as const;

export const DATA_ALL = [
  EMOTE_ALL, 
  "다래", 
  "ㅇ", 
  "rgb(255, 130, 45)", 
  "kiwi.png", 
  "kiwi.png", 
  "medium-reveal", 
  EMOTE_ALL + " 다래요~\n정답에서 일치하는 자음과 모음은 이것들 밖에 없어요"
] as const;

export const DATA_TIME = [
  EMOTE_RACE_TIME, 
  "스톱워치", 
  "시", 
  "rgb(248, 49, 47)", 
  "kiwi.png", 
  "kiwi.png", 
  "medium-reveal", 
  EMOTE_RACE_TIME + " 스톱워치예요~\n보물찾기의 점수예요"
] as const;

// 색상 상수
export const COLOR_MAYBE = 'rgb(150, 150, 150)';
export const COLOR_MAGPIE = 'rgb(60, 88, 167)';

// 키보드 레이아웃 (한글)
export const HANGUL_KEYBOARD_ROWS = [
  ['ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', EMOTE_HINT, 'ㅒ', 'ㅖ', '⌫'],
  ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
  ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
  ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ', '⏎'],
] as const;

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  GAME_STATS: 'gameStats',
  CURRENT_GAME: 'currentGame',
  SETTINGS: 'settings',
} as const;

// 타입 정의
export type GameEmote = typeof EMOTE_MATCH | typeof EMOTE_SIMILAR | typeof EMOTE_MANY | 
                       typeof EMOTE_EXISTS | typeof EMOTE_OPPOSITE | typeof EMOTE_NONE |
                       typeof EMOTE_HINT | typeof EMOTE_ALL;

export type FeedbackData = readonly [string, string, string, string, string, string, string, string];

// 피드백 데이터 맵
export const FEEDBACK_DATA_MAP = {
  [EMOTE_MATCH]: DATA_MATCH,
  [EMOTE_SIMILAR]: DATA_SIMILAR,
  [EMOTE_MANY]: DATA_MANY,
  [EMOTE_EXISTS]: DATA_EXISTS,
  [EMOTE_OPPOSITE]: DATA_OPPOSITE,
  [EMOTE_NONE]: DATA_NONE,
  [EMOTE_HINT]: DATA_HINT,
  [EMOTE_ALL]: DATA_ALL,
  [EMOTE_RACE_TIME]: DATA_TIME,
} as const;