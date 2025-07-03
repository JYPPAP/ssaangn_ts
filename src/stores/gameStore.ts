import { create } from 'zustand';
import { hangulSyllableToJamoComponentsText } from '../utils/hangul/core';
import { MAX_LETTERS, NUMBER_OF_GUESSES } from '../data/constants';
import type { 
  WordDataRaw, 
  GameStatus, 
  GameBoardRow, 
  GameEmote,
  HotCombo,
  KeyboardState 
} from '../types';

interface GameState {
  // ===== 게임 진행 상태 =====
  gameStatus: GameStatus;
  board: GameBoardRow[];
  currentGuess: string[];
  currentGuessIndex: number;
  guessesRemaining: number;
  
  // ===== 정답 관련 상태 =====
  secretWord: WordDataRaw | null;
  secretWordString: string;
  secretWordJamoSets: string[][];
  foundMatch: [boolean, boolean];
  
  // ===== 게임 모드 상태 =====
  isPracticeGame: boolean;
  invalidWordCount: number;
  
  // ===== 한글 텍스트 처리 상태 =====
  yesList: [string[], string[]];
  noList: [string[], string[]];
  hotComboList: [HotCombo[], HotCombo[]];
  allNewYes: [string[], string[]];
  allNewNo: [string[], string[]];
  
  // ===== 힌트 시스템 상태 =====
  hintsRemaining: number;
  hintList: string[];
  
  // ===== 키보드 상태 =====
  keyboardState: Record<string, KeyboardState>;
}

interface GameActions {
  // ===== 게임 초기화 =====
  resetGame: () => void;
  initializeGame: (wordData: WordDataRaw | null, secretWord: string, isPractice: boolean) => void;
  
  // ===== 게임 상태 업데이트 =====
  setGameStatus: (status: GameStatus) => void;
  addBoardRow: (row: GameBoardRow) => void;
  incrementCurrentGuessIndex: () => void;
  decrementGuessesRemaining: () => void;
  incrementInvalidWordCount: () => void;
  
  // ===== 입력 상태 관리 =====
  setCurrentGuess: (guess: string[]) => void;
  clearCurrentGuess: () => void;
  
  // ===== 정답 단어 관리 =====
  setSecretWord: (word: string, isPractice: boolean) => void;
  updateFoundMatch: (index: number, isMatch: boolean) => void;
  
  // ===== 한글 텍스트 처리 상태 관리 =====
  addToYesList: (letter: string, index: number) => boolean;
  addToNoList: (letter: string, index: number) => boolean;
  addToHotComboList: (combo: string, index: number, min: number, max: number) => void;
  clearAllNewLists: () => void;
  
  // ===== 힌트 시스템 관리 =====
  addToHintList: (hint: string) => void;
  decrementHintsRemaining: () => void;
  setHintsRemaining: (count: number) => void;
  
  // ===== 키보드 상태 관리 =====
  updateKeyboardState: (key: string, state: KeyboardState) => void;
  resetKeyboardState: () => void;
  
  // ===== 유틸리티 메서드 =====
  createSecretWordJamoSets: () => void;
}

export type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>((set, get) => ({
  // ===== 초기 상태 =====
  gameStatus: 'playing',
  board: [],
  currentGuess: [],
  currentGuessIndex: 0,
  guessesRemaining: NUMBER_OF_GUESSES,
  
  secretWord: null,
  secretWordString: '',
  secretWordJamoSets: [],
  foundMatch: [false, false],
  
  isPracticeGame: false,
  invalidWordCount: 0,
  
  yesList: [[], []],
  noList: [[], []],
  hotComboList: [[], []],
  allNewYes: [[], []],
  allNewNo: [[], []],
  
  hintsRemaining: 1,
  hintList: [],
  
  keyboardState: {},

  // ===== 게임 초기화 =====
  resetGame: () => {
    set({
      gameStatus: 'playing',
      board: [],
      currentGuess: [],
      currentGuessIndex: 0,
      guessesRemaining: NUMBER_OF_GUESSES,
      
      secretWord: null,
      secretWordString: '',
      secretWordJamoSets: [],
      foundMatch: [false, false],
      
      isPracticeGame: false,
      invalidWordCount: 0,
      
      yesList: [[], []],
      noList: [[], []],
      hotComboList: [[], []],
      allNewYes: [[], []],
      allNewNo: [[], []],
      
      hintsRemaining: 1,
      hintList: [],
      
      keyboardState: {},
    });
  },

  initializeGame: (wordData: WordDataRaw | null, secretWord: string, isPractice: boolean) => {
    set({
      gameStatus: 'playing',
      board: [],
      currentGuess: [],
      currentGuessIndex: 0,
      guessesRemaining: NUMBER_OF_GUESSES,
      
      secretWord: wordData,
      secretWordString: secretWord,
      foundMatch: [false, false],
      
      isPracticeGame: isPractice,
      invalidWordCount: 0,
      
      yesList: [[], []],
      noList: [[], []],
      hotComboList: [[], []],
      allNewYes: [[], []],
      allNewNo: [[], []],
      
      hintsRemaining: 1,
      hintList: [],
      
      keyboardState: {},
    });
    
    get().createSecretWordJamoSets();
  },

  // ===== 게임 상태 업데이트 =====
  setGameStatus: (status: GameStatus) => {
    set({ gameStatus: status });
  },

  addBoardRow: (row: GameBoardRow) => {
    set(state => ({ 
      board: [...state.board, row] 
    }));
  },

  incrementCurrentGuessIndex: () => {
    set(state => ({ 
      currentGuessIndex: state.currentGuessIndex + 1 
    }));
  },

  decrementGuessesRemaining: () => {
    set(state => ({ 
      guessesRemaining: state.guessesRemaining - 1 
    }));
  },

  incrementInvalidWordCount: () => {
    set(state => ({ 
      invalidWordCount: state.invalidWordCount + 1 
    }));
  },

  // ===== 입력 상태 관리 =====
  setCurrentGuess: (guess: string[]) => {
    set({ currentGuess: guess });
  },

  clearCurrentGuess: () => {
    set({ currentGuess: [] });
  },

  // ===== 정답 단어 관리 =====
  setSecretWord: (word: string, isPractice: boolean) => {
    set({ 
      secretWordString: word, 
      isPracticeGame: isPractice 
    });
    get().createSecretWordJamoSets();
  },

  updateFoundMatch: (index: number, isMatch: boolean) => {
    set(state => {
      const newFoundMatch = [...state.foundMatch] as [boolean, boolean];
      newFoundMatch[index] = isMatch;
      return { foundMatch: newFoundMatch };
    });
  },

  // ===== 한글 텍스트 처리 상태 관리 =====
  addToYesList: (letter: string, index: number) => {
    const { yesList, noList, allNewYes } = get();
    
    if (yesList[index].includes(letter)) return false;
    if (noList[index].includes(letter)) return false;
    
    const newYesList = [...yesList] as [string[], string[]];
    const newAllNewYes = [...allNewYes] as [string[], string[]];
    
    newYesList[index] = [...newYesList[index], letter];
    newAllNewYes[index] = [...newAllNewYes[index], letter];
    
    set({ yesList: newYesList, allNewYes: newAllNewYes });
    return true;
  },

  addToNoList: (letter: string, index: number) => {
    const { yesList, noList, allNewNo } = get();
    
    if (noList[index].includes(letter)) return false;
    if (yesList[index].includes(letter)) return false;
    
    const newNoList = [...noList] as [string[], string[]];
    const newAllNewNo = [...allNewNo] as [string[], string[]];
    
    newNoList[index] = [...newNoList[index], letter];
    newAllNewNo[index] = [...newAllNewNo[index], letter];
    
    set({ noList: newNoList, allNewNo: newAllNewNo });
    return true;
  },

  addToHotComboList: (combo: string, index: number, min: number, max: number) => {
    const { hotComboList } = get();
    const newHotComboList = [...hotComboList] as [HotCombo[], HotCombo[]];
    
    newHotComboList[index] = [...newHotComboList[index], {
      jamoComponents: hangulSyllableToJamoComponentsText(combo),
      min,
      max
    }];
    
    set({ hotComboList: newHotComboList });
  },

  clearAllNewLists: () => {
    set({ 
      allNewYes: [[], []], 
      allNewNo: [[], []] 
    });
  },

  // ===== 힌트 시스템 관리 =====
  addToHintList: (hint: string) => {
    set(state => ({ 
      hintList: [...state.hintList, hint] 
    }));
  },

  decrementHintsRemaining: () => {
    set(state => ({ 
      hintsRemaining: state.hintsRemaining - 1 
    }));
  },

  setHintsRemaining: (count: number) => {
    set({ hintsRemaining: count });
  },

  // ===== 키보드 상태 관리 =====
  updateKeyboardState: (key: string, state: KeyboardState) => {
    set(prevState => ({
      keyboardState: {
        ...prevState.keyboardState,
        [key]: state
      }
    }));
  },

  resetKeyboardState: () => {
    set({ keyboardState: {} });
  },

  // ===== 유틸리티 메서드 =====
  createSecretWordJamoSets: () => {
    const { secretWordString } = get();
    const secretWordJamoSets: string[][] = [];
    
    for (let i = 0; i < MAX_LETTERS; i++) {
      if (secretWordString[i]) {
        secretWordJamoSets[i] = hangulSyllableToJamoComponentsText(secretWordString[i]).split('');
      } else {
        secretWordJamoSets[i] = [];
      }
    }
    
    set({ secretWordJamoSets });
  },
}));