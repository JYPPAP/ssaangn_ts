import { hangulSyllableToJamoComponentsText } from './hangul/core';

/**
 * 두 자모 성분 배열 간의 일치하는 자모 개수를 센다
 * 원본 countJamoComponentsInOtherJamoComponents 함수의 TypeScript 구현
 */
export function countJamoComponentsInOtherJamoComponents(setA: string, setB: string): number {
  const used = new Array(setB.length).fill(false);
  
  let result = 0;
  for (let i = 0; i < setA.length; i++) {
    for (let j = 0; j < setB.length; j++) {
      if (used[j]) continue;
      
      if (setA[i] === setB[j]) {
        result++;
        used[j] = true;
        break;
      }
    }
  }
  
  return result;
}

/**
 * 이모지 기반 피드백 시스템 상수
 */
export const GAME_EMOTES = {
  MATCH: '🥕',      // 당근 - 완전 일치
  SIMILAR: '🍄',    // 버섯 - 첫 자음 일치 + 2개 이상 자모 일치
  MANY: '🧄',       // 마늘 - 2개 이상 자모 일치 (첫 자음 불일치)
  EXISTS: '🍆',     // 가지 - 1개 자모 일치
  OPPOSITE: '🍌',   // 바나나 - 반대쪽 글자에서 자모 일치
  NONE: '🍎',       // 사과 - 일치하는 자모 없음
  HINT: '🎃'        // 힌트
} as const;

export type GameEmote = typeof GAME_EMOTES[keyof typeof GAME_EMOTES];

/**
 * 게임 피드백 데이터 구조
 */
export interface GameFeedbackData {
  emote: GameEmote;
  name: string;
  short: string;
  color: string;
  description: string;
}

/**
 * 각 이모지에 대한 상세 정보
 */
export const FEEDBACK_DATA: Record<GameEmote, GameFeedbackData> = {
  [GAME_EMOTES.MATCH]: {
    emote: GAME_EMOTES.MATCH,
    name: '당근',
    short: 'ㄷ',
    color: 'rgb(255, 130, 45)',
    description: `${GAME_EMOTES.MATCH} 당연하죠~\n해당 글자와 일치해요`
  },
  [GAME_EMOTES.SIMILAR]: {
    emote: GAME_EMOTES.SIMILAR,
    name: '버섯',
    short: 'ㅄ',
    color: 'rgb(248, 86, 155)',
    description: `${GAME_EMOTES.SIMILAR} 비슷해요~\n자음과 모음 중 2개 이상이 일치하고 첫 자음도 일치해요`
  },
  [GAME_EMOTES.MANY]: {
    emote: GAME_EMOTES.MANY,
    name: '마늘',
    short: 'ㅁ',
    color: 'rgb(229, 205, 179)',
    description: `${GAME_EMOTES.MANY} 많을 거예요~\n자음과 모음 중 2개 이상이 있지만 첫 자음은 일치하지 않아요`
  },
  [GAME_EMOTES.EXISTS]: {
    emote: GAME_EMOTES.EXISTS,
    name: '가지',
    short: 'ㄱ',
    color: 'rgb(140, 66, 179)',
    description: `${GAME_EMOTES.EXISTS} 가지고 있어요~\n입력한 자음과 모음 중 하나만 있어요`
  },
  [GAME_EMOTES.OPPOSITE]: {
    emote: GAME_EMOTES.OPPOSITE,
    name: '바난',
    short: 'ㅂ',
    color: 'rgb(248, 214, 87)',
    description: `${GAME_EMOTES.OPPOSITE} 반대로요~\n입력한 자음과 모음 중 1개 이상 있긴 있는데 반대쪽 글자에서 일치해요`
  },
  [GAME_EMOTES.NONE]: {
    emote: GAME_EMOTES.NONE,
    name: '사과',
    short: 'ㅅ',
    color: 'rgb(248, 49, 47)',
    description: `${GAME_EMOTES.NONE} 사과해요~\n입력한 자음과 모음이 하나도 없어요`
  },
  [GAME_EMOTES.HINT]: {
    emote: GAME_EMOTES.HINT,
    name: '힌트',
    short: 'ㅎ',
    color: 'rgb(255, 165, 0)',
    description: `${GAME_EMOTES.HINT} 힌트를 사용하세요`
  }
};

/**
 * 단어 추측 결과 분석 함수
 * 원본 script.js의 processWord 로직을 TypeScript로 구현
 */
export function analyzeGuess(guess: string[], secret: string[]): GameEmote[] {
  if (guess.length !== 2 || secret.length !== 2) {
    throw new Error('Words must be exactly 2 characters');
  }

  const result: GameEmote[] = [GAME_EMOTES.NONE, GAME_EMOTES.NONE];
  
  // 각 글자의 자모 성분 분해
  const guessJamoSets = guess.map(char => hangulSyllableToJamoComponentsText(char));
  const secretJamoSets = secret.map(char => hangulSyllableToJamoComponentsText(char));

  for (let i = 0; i < 2; i++) {
    if (secret[i] === guess[i]) {
      // 완전 일치
      result[i] = GAME_EMOTES.MATCH;
    } else {
      const componentMatches = countJamoComponentsInOtherJamoComponents(
        guessJamoSets[i], 
        secretJamoSets[i]
      );

      if (guessJamoSets[i][0] === secretJamoSets[i][0] && componentMatches > 1) {
        // 첫 자음 일치 + 2개 이상 자모 일치
        result[i] = GAME_EMOTES.SIMILAR;
      } else if (componentMatches > 1) {
        // 2개 이상 자모 일치 (첫 자음 불일치)
        result[i] = GAME_EMOTES.MANY;
      } else if (componentMatches === 1) {
        // 1개 자모 일치
        result[i] = GAME_EMOTES.EXISTS;
      } else {
        // 현재 위치에서 일치하는 자모가 없는 경우 반대편 확인
        const other = 1 - i;
        const foundMatchInOther = countJamoComponentsInOtherJamoComponents(
          guessJamoSets[i], 
          secretJamoSets[other]
        ) > 0;

        if (foundMatchInOther) {
          result[i] = GAME_EMOTES.OPPOSITE;
        } else {
          result[i] = GAME_EMOTES.NONE;
        }
      }
    }
  }

  return result;
}

/**
 * 키보드 상태 열거형
 */
export enum KeyboardState {
  UNUSED = 'unused',
  USED = 'used', 
  MATCH = 'match',
  NONE = 'none'
}

/**
 * 키보드 키 상태 관리를 위한 타입
 */
export interface KeyboardKeyState {
  key: string;
  state: KeyboardState;
  color: string;
}