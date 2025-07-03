import type { WordDataRaw, GameStatus } from './index';
import {
  MAX_LETTERS,
  NUMBER_OF_GUESSES,
  EMOTE_MATCH,
  EMOTE_SIMILAR,
  EMOTE_MANY,
  EMOTE_EXISTS,
  EMOTE_OPPOSITE,
  EMOTE_NONE,
  EMOTE_HINT,
} from '../data/constants';

// 게임 이모티콘 타입
export type GameEmote = typeof EMOTE_MATCH | typeof EMOTE_SIMILAR | typeof EMOTE_MANY | 
                        typeof EMOTE_EXISTS | typeof EMOTE_OPPOSITE | typeof EMOTE_NONE;

// 게임 보드 행 인터페이스
export interface GameBoardRow {
  letters: string[];
  emotes: GameEmote[];
  hint?: string; // 힌트 정보
}

// Hot Combo 관리 (원본 script.js 로직)
export interface HotCombo {
  jamoComponents: string;
  min: number;
  max: number;
}

// 키보드 상태 열거형
export enum KeyboardState {
  UNUSED = 'unused',
  USED = 'used', 
  MATCH = 'match',
  NONE = 'none'
}

// 메인 게임 상태 인터페이스
export interface GameState {
  // 기본 게임 상태
  gameStatus: GameStatus;
  currentGuess: string[];
  currentGuessIndex: number;
  guessesRemaining: number;
  hintsRemaining: number;
  board: GameBoardRow[];
  secretWord: WordDataRaw | null;
  
  // 원본 script.js의 핵심 상태들
  secretWordString: string;
  secretWordJamoSets: string[][];
  
  // Yes/No List 관리 (원본 script.js와 동일)
  yesList: [string[], string[]];     // 각 위치별 확실한 자모들
  noList: [string[], string[]];      // 각 위치별 없는 자모들
  hotComboList: [HotCombo[], HotCombo[]];  // 각 위치별 조합 제약
  hintList: string[];                 // 힌트로 공개된 자모들
  foundMatch: [boolean, boolean];     // 각 위치 완전 일치 여부
  allNewYes: [string[], string[]];    // 새로 추가된 Yes 자모들
  allNewNo: [string[], string[]];     // 새로 추가된 No 자모들
  
  // 키보드 상태
  keyboardState: Record<string, KeyboardState>;
  
  // 게임 모드
  isPracticeGame: boolean;
  invalidWordCount: number;
}

// 한국어 텍스트 처리 관련 인터페이스
export interface KoreanTextProcessing {
  // 자모 성분 매칭 개수 계산
  countJamoComponentsInOtherJamoComponents: (setA: string, setB: string) => number;
  
  // Yes/No List 관리
  addToYesList: (letter: string, index: number) => boolean;
  addToNoList: (letter: string, index: number) => boolean;
  addToHotComboList: (combo: string, index: number, min: number, max: number) => void;
  addManyToNoList: (letters: string, index: number) => boolean;
  addAllOthersToNoList: (jamoComponents: string, index: number) => void;
  addNonBatchimToNoList: (index: number) => void;
  
  // 상태 분석
  yesNoMaybeListsFromComponents: (character: string, index: number, checkUniques: boolean) => [string[], string[], string[]];
  isCharacterAllWrong: (character: string) => boolean;
  
  // Hot Combo 관련
  breaksAnyHotCombo: (index: number, testList: string[]) => boolean;
}

// 키보드 관리 관련 인터페이스
export interface KeyboardManagement {
  // 키보드 요소 조작
  getKeyboardKey: (letter: string) => HTMLElement | null;
  getColorPriority: (color: string) => number;
  shadeKeyBoard: (letter: string, color: string) => void;
  shadeKeyBoardDelayed: (letter: string, color: string, delay: number) => void;
  getKeyBoardShade: (letter: string) => string;
  disableKeyBoardUnmatched: () => void;
  
  // 키보드 상태 업데이트
  colorKeyboardFromClues: () => void;
}

// 게임 로직 관련 인터페이스
export interface GameLogic {
  // 핵심 게임 로직
  checkGuess: (manual: boolean) => Promise<void>;
  createSecretWordJamoSets: () => void;
  
  // 게임 상태 관리
  endGame: (won: boolean) => void;
  showError: (errorText: string) => void;
}

// 힌트 시스템 관련 인터페이스
export interface HintSystem {
  // 힌트 제공
  giveRandomShadeHint: () => void;
}

// 상태 최적화 관련 인터페이스
export interface StateOptimization {
  // 상태 일관성 검증 및 최적화
  validateYesNoListConsistency: () => boolean;
  optimizeJamoStateTracking: (currentGuess: string[], secretWordJamoSets: string[][]) => void;
}

// 게임 액션 인터페이스
export interface GameActions {
  // 게임 액션 (원본 script.js 함수들을 TypeScript로 구현)
  initializeGame: () => Promise<void>;
  insertLetter: (letter: string) => void;
  deleteLetter: () => void;
  submitGuess: () => Promise<void>;
  useHint: () => void;
  resetGame: () => void;
}

// 전체 게임 스토어 인터페이스 (합성)
export interface GameStore extends 
  GameState,
  GameActions,
  KoreanTextProcessing,
  KeyboardManagement,
  GameLogic,
  HintSystem,
  StateOptimization {}