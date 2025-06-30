import { create } from 'zustand';
import { appendHangul, deleteOneJamo } from '../utils/hangul/input';
import { validateWord, getSecretWordByDayIndex } from '../utils/wordValidation';
import { 
  hangulSyllableToJamoComponentsText, 
  isHangulConsonant 
} from '../utils/hangul/core';
import { 
  getUnpairableConsonants, 
  getUnpairableVowels, 
  areUnpairableConsonants, 
  areUnpairableVowels,
  HANGUL_CONSONANT_COMPONENTS,
  HANGUL_CONSONANT_VOWEL_LIST
} from '../utils/hangul';
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
  DATA_MATCH,
  DATA_SIMILAR,
  DATA_MANY,
  DATA_EXISTS,
  DATA_OPPOSITE,
  DATA_NONE,
  DATA_COLOR,
  COLOR_MAYBE,
  PRACTICE_WORD,
  PRACTICE_WORD_BACKUP,
  MAX_INVALID_WORDS
} from '../data/constants';
import type { WordDataRaw } from '../types';

// 원본 script.js의 타입들을 TypeScript로 정의
export type GameEmote = typeof EMOTE_MATCH | typeof EMOTE_SIMILAR | typeof EMOTE_MANY | 
                        typeof EMOTE_EXISTS | typeof EMOTE_OPPOSITE | typeof EMOTE_NONE;

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

// 키보드 상태 관리
export enum KeyboardState {
  UNUSED = 'unused',
  USED = 'used', 
  MATCH = 'match',
  NONE = 'none'
}

interface GameState {
  // 기본 게임 상태
  gameStatus: 'playing' | 'won' | 'lost';
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
  
  // 게임 액션 (원본 script.js 함수들을 TypeScript로 구현)
  initializeGame: () => Promise<void>;
  insertLetter: (letter: string) => void;
  deleteLetter: () => void;
  submitGuess: () => Promise<void>;
  useHint: () => void;
  resetGame: () => void;
  
  // 원본 script.js의 핵심 함수들
  checkGuess: (manual: boolean) => Promise<void>;
  createSecretWordJamoSets: () => void;
  addToYesList: (letter: string, index: number) => boolean;
  addToNoList: (letter: string, index: number) => boolean;
  addToHotComboList: (combo: string, index: number, min: number, max: number) => void;
  addManyToNoList: (letters: string, index: number) => boolean;
  addAllOthersToNoList: (jamoComponents: string, index: number) => void;
  addNonBatchimToNoList: (index: number) => void;
  colorKeyboardFromClues: () => void;
  countJamoComponentsInOtherJamoComponents: (setA: string, setB: string) => number;
  yesNoMaybeListsFromComponents: (character: string, index: number, checkUniques: boolean) => [string[], string[], string[]];
  giveRandomShadeHint: () => void;
  isCharacterAllWrong: (character: string) => boolean;
  
  // 키보드 관련 헬퍼
  getKeyboardKey: (letter: string) => HTMLElement | null;
  shadeKeyBoard: (letter: string, color: string) => void;
  shadeKeyBoardDelayed: (letter: string, color: string, delay: number) => void;
  getKeyBoardShade: (letter: string) => string;
  disableKeyBoardUnmatched: () => void;
  
  // Hot Combo 관련
  breaksAnyHotCombo: (index: number, testList: string[]) => boolean;
  
  // 상태 일관성 검증 및 최적화 (새로 추가)
  validateYesNoListConsistency: () => boolean;
  optimizeJamoStateTracking: (currentGuess: string[], secretWordJamoSets: string[][]) => void;
  
  // 게임 상태 관리
  endGame: (won: boolean) => void;
  showError: (errorText: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // 초기 상태 (원본 script.js와 동일)
  gameStatus: 'playing',
  currentGuess: [],
  currentGuessIndex: 0,
  guessesRemaining: NUMBER_OF_GUESSES,
  hintsRemaining: 1,
  board: [],
  secretWord: null,
  
  // 원본 script.js 상태들
  secretWordString: '',
  secretWordJamoSets: [],
  yesList: [[], []],
  noList: [[], []],
  hotComboList: [[], []],
  hintList: [],
  foundMatch: [false, false],
  allNewYes: [[], []],
  allNewNo: [[], []],
  keyboardState: {},
  isPracticeGame: false,
  invalidWordCount: 0,

  // 게임 초기화 (원본 initBoard 로직)
  initializeGame: async () => {
    try {
      // 일자 기반 단어 선택
      const today = new Date();
      const startDate = new Date('2024-01-02');
      const dayIndex = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let wordData: WordDataRaw | null = null;
      let secretWordString = '';
      let isPracticeGame = false;
      
      try {
        wordData = await getSecretWordByDayIndex(dayIndex);
        secretWordString = wordData?.word || PRACTICE_WORD;
      } catch (error) {
        // 첫 게임이거나 데이터 로드 실패시 연습 모드
        isPracticeGame = true;
        secretWordString = PRACTICE_WORD;
      }
      
      set({
        gameStatus: 'playing',
        currentGuess: [],
        currentGuessIndex: 0,
        guessesRemaining: NUMBER_OF_GUESSES,
        hintsRemaining: 1,
        board: [],
        secretWord: wordData,
        secretWordString,
        secretWordJamoSets: [],
        yesList: [[], []],
        noList: [[], []],
        hotComboList: [[], []],
        hintList: [],
        foundMatch: [false, false],
        allNewYes: [[], []],
        allNewNo: [[], []],
        keyboardState: {},
        isPracticeGame,
        invalidWordCount: 0,
      });
      
      // 정답 단어의 자모 성분 생성
      get().createSecretWordJamoSets();
    } catch (error) {
      console.error('게임 초기화 실패:', error);
      get().showError('게임 초기화에 실패했습니다.');
    }
  },

  // 정답 단어 자모 성분 생성 (원본 createSecretWordJamoSets)
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

  // 글자 입력 (원본 insertLetter 로직 적용)
  insertLetter: (letter: string) => {
    const { currentGuess, gameStatus } = get();
    
    if (gameStatus !== 'playing') return;
    
    // 현재 입력된 글자들을 하나의 문자열로 합침
    const combinedText = currentGuess.join('');
    
    // 기존 글자가 있는 경우 조합 시도
    if (combinedText.length > 0) {
      const lastChar = combinedText[combinedText.length - 1];
      const appendResult = appendHangul(lastChar, letter);
      
      // 조합 결과가 2글자 이상이고 이미 최대 길이인 경우 입력 거부
      if (appendResult.length > 1 && combinedText.length >= MAX_LETTERS) {
        return;
      }
      
      // 조합된 결과를 새로운 텍스트로 설정
      let newText = combinedText.slice(0, -1) + appendResult;
      
      // 결과를 2글자 배열로 분할
      const newCurrentGuess = [
        newText[0] || '',
        newText[1] || ''
      ];
      
      set({ currentGuess: newCurrentGuess });
      return;
    }
    
    // 새로운 글자 입력
    if (combinedText.length < MAX_LETTERS) {
      const newText = combinedText + letter;
      const newCurrentGuess = [
        newText[0] || '',
        newText[1] || ''
      ];
      set({ currentGuess: newCurrentGuess });
    }
  },

  // 글자 삭제 (원본 deleteLetter 로직 적용)
  deleteLetter: () => {
    const { currentGuess, gameStatus } = get();
    
    if (gameStatus !== 'playing') return;
    
    const combinedText = currentGuess.join('');
    if (combinedText.length === 0) return;
    
    // 마지막 글자를 삭제/분해
    const lastChar = combinedText[combinedText.length - 1];
    const deletedResult = deleteOneJamo(lastChar);
    
    let newText = '';
    if (deletedResult === '') {
      // 글자가 완전히 삭제된 경우
      newText = combinedText.slice(0, -1);
    } else {
      // 글자의 일부만 삭제된 경우 (자모 분해)
      newText = combinedText.slice(0, -1) + deletedResult;
    }
    
    // 결과를 2글자 배열로 분할
    const newCurrentGuess = [
      newText[0] || '',
      newText[1] || ''
    ];
    
    set({ currentGuess: newCurrentGuess });
  },

  // 추측 제출 (원본 checkGuess 호출)
  submitGuess: async () => {
    await get().checkGuess(true);
  },

  // 힌트 사용 (원본 giveRandomShadeHint 호출)
  useHint: () => {
    const { hintsRemaining } = get();
    
    if (hintsRemaining <= 0) return;
    
    get().giveRandomShadeHint();
  },

  // 게임 리셋
  resetGame: () => {
    get().initializeGame();
  },

  // ===== 원본 script.js 핵심 함수들 구현 =====

  // 자모 성분 매칭 개수 계산 (원본 countJamoComponentsInOtherJamoComponents)
  countJamoComponentsInOtherJamoComponents: (setA: string, setB: string) => {
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
  },

  // Yes List에 추가 (원본 addToYesList)
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

  // No List에 추가 (원본 addToNoList)
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

  // Hot Combo List에 추가 (원본 addToHotComboList)
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

  // 여러 자모를 No List에 추가 (원본 addManyToNoList)
  addManyToNoList: (letters: string, index: number) => {
    let addedSomething = false;
    for (let i = 0; i < letters.length; i++) {
      addedSomething = get().addToNoList(letters[i], index) || addedSomething;
    }
    return addedSomething;
  },

  // 나머지 모든 자모를 No List에 추가 (원본 addAllOthersToNoList)
  addAllOthersToNoList: (jamoComponents: string, index: number) => {
    if (jamoComponents.length === 0) return;
    
    for (let i = 0; i < HANGUL_CONSONANT_VOWEL_LIST.length; i++) {
      if (jamoComponents.indexOf(HANGUL_CONSONANT_VOWEL_LIST[i]) < 0) {
        get().addToNoList(HANGUL_CONSONANT_VOWEL_LIST[i], index);
      }
    }
  },

  // 받침이 될 수 없는 자음들을 No List에 추가 (원본 addNonBatchimToNoList)
  addNonBatchimToNoList: (index: number) => {
    const unpairable = getUnpairableConsonants(' ');
    for (let i = 0; i < unpairable.length; i++) {
      get().addToNoList(unpairable[i], index);
    }
  },

  // 글자가 모두 틀린지 확인 (원본 isCharacterAllWrong)
  isCharacterAllWrong: (character: string) => {
    const components = hangulSyllableToJamoComponentsText(character);
    if (components.length === 0) return false;
    
    for (let i = 0; i < components.length; i++) {
      if (get().getKeyBoardShade(components[i]) !== DATA_NONE[DATA_COLOR]) {
        return false;
      }
    }
    
    return true;
  },

  // Yes/No/Maybe 리스트 생성 (원본 yesNoMaybeListsFromComponents)
  yesNoMaybeListsFromComponents: (character: string, index: number, checkUniques: boolean) => {
    const { yesList, noList } = get();
    const components = hangulSyllableToJamoComponentsText(character);
    
    const uniqueComponents: string[] = [];
    for (let i = 0; i < components.length; i++) {
      if (!checkUniques || !uniqueComponents.includes(components[i])) {
        uniqueComponents.push(components[i]);
      }
    }
    
    const yesNoMaybe: [string[], string[], string[]] = [[], [], []];
    for (let i = 0; i < uniqueComponents.length; i++) {
      const component = uniqueComponents[i];
      if (yesList[index].includes(component)) {
        yesNoMaybe[0].push(component);
      } else if (noList[index].includes(component)) {
        yesNoMaybe[1].push(component);
      } else {
        yesNoMaybe[2].push(component);
      }
    }
    
    return yesNoMaybe;
  },

  // === 키보드 관련 함수들 ===
  getKeyboardKey: (letter: string) => {
    const elements = document.getElementsByClassName("keyboard-button");
    for (let i = 0; i < elements.length; i++) {
      const elem = elements[i] as HTMLElement;
      if (elem.textContent === letter || elem.id.startsWith(letter)) {
        return elem;
      }
    }
    return null;
  },

  shadeKeyBoard: (letter: string, color: string) => {
    const { guessesRemaining } = get();
    if (guessesRemaining <= 0) return;
    
    const elem = get().getKeyboardKey(letter);
    if (!elem) return;
    
    const oldColor = elem.style.backgroundColor;
    if (oldColor === DATA_MATCH[DATA_COLOR]) return;
    if (oldColor === DATA_NONE[DATA_COLOR] && color === COLOR_MAYBE) return;
    
    elem.style.backgroundColor = color;
  },

  shadeKeyBoardDelayed: (letter: string, color: string, delay: number) => {
    if (delay <= 0) {
      get().shadeKeyBoard(letter, color);
    } else {
      setTimeout(() => {
        get().shadeKeyBoard(letter, color);
      }, delay);
    }
  },

  getKeyBoardShade: (letter: string) => {
    const elem = get().getKeyboardKey(letter);
    return elem?.style.backgroundColor || '';
  },

  // === 이어서 구현할 주요 함수들 (checkGuess, colorKeyboardFromClues, giveRandomShadeHint) ===
  
  // 원본 script_init_2.js의 checkGuess 함수 완전 구현
  checkGuess: async (manual: boolean) => {
    const {
      currentGuess,
      secretWordString,
      secretWordJamoSets,
      isPracticeGame,
      guessesRemaining,
      currentGuessIndex,
      board,
      invalidWordCount,
      countJamoComponentsInOtherJamoComponents,
      addToYesList,
      addToNoList,
      addToHotComboList,
      addAllOthersToNoList,
      addNonBatchimToNoList,
      shadeKeyBoardDelayed,
      colorKeyboardFromClues,
      endGame,
      showError,
      isCharacterAllWrong
    } = get();

    let guessString = '';
    let allWrong = true;

    // 현재 추측을 문자열로 변환하고 유효성 검사
    for (const val of currentGuess) {
      if (!isCharacterAllWrong(val)) {
        allWrong = false;
      }
      guessString += val;
    }

    // 2글자가 입력되었는지 확인
    if (guessString.length !== MAX_LETTERS || isHangulConsonant(guessString[MAX_LETTERS - 1])) {
      showError('🐯 2개 글자를 입력하세요');
      return;
    }

    // 단어 유효성 검사
    try {
      const validation = await validateWord(guessString, manual);
      if (!validation.isValid) {
        showError('🐯 옳은 단어를 입력하세요');
        
        if (manual && invalidWordCount < MAX_INVALID_WORDS) {
          // 유효하지 않은 단어 카운트 증가
          set({ invalidWordCount: invalidWordCount + 1 });
        }
        return;
      }
    } catch (error) {
      showError('🐯 옳은 단어를 입력하세요');
      return;
    }

    // 모든 자모가 틀린 경우
    if (allWrong) {
      showError('🐯 자음과 모음들이 모두 틀려요');
      return;
    }

    // 연습 게임 특별 처리
    if (isPracticeGame && guessesRemaining === NUMBER_OF_GUESSES &&
        (currentGuess[0] === secretWordString[0] || currentGuess[1] === secretWordString[1])) {
      // 첫 번째 추측에서 정확한 글자가 있으면 다른 연습 단어로 변경
      set({ secretWordString: PRACTICE_WORD_BACKUP });
      get().createSecretWordJamoSets();
    }

    const secretWord = Array.from(secretWordString);
    const shadeDelay = manual ? 700 : 0;

    let letterColor: string[] = [DATA_NONE[DATA_COLOR], DATA_NONE[DATA_COLOR]];
    let letterEmote: GameEmote[] = [EMOTE_NONE, EMOTE_NONE];

    // 각 글자의 자모 성분 분해
    const currentGuessJamoSets: string[][] = [];
    for (let i = 0; i < MAX_LETTERS; i++) {
      currentGuessJamoSets[i] = hangulSyllableToJamoComponentsText(currentGuess[i]).split('');
    }

    // 각 글자 위치별 분석
    for (let i = 0; i < MAX_LETTERS; i++) {
      if (secretWord[i] === currentGuess[i]) {
        // 🥕 완전 일치
        letterColor[i] = DATA_MATCH[DATA_COLOR];
        letterEmote[i] = EMOTE_MATCH;

        for (let jamoChar = 0; jamoChar < currentGuessJamoSets[i].length; jamoChar++) {
          const letter = currentGuessJamoSets[i][jamoChar];
          shadeKeyBoardDelayed(letter, DATA_MATCH[DATA_COLOR], shadeDelay);
          addToYesList(letter, i);
        }

        addAllOthersToNoList(currentGuessJamoSets[i].join(''), i);
        
        // foundMatch 업데이트
        const newFoundMatch = [...get().foundMatch] as [boolean, boolean];
        newFoundMatch[i] = true;
        set({ foundMatch: newFoundMatch });
      } else {
        const componentMatches = countJamoComponentsInOtherJamoComponents(
          currentGuessJamoSets[i].join(''), 
          secretWordJamoSets[i].join('')
        );

        if (currentGuessJamoSets[i][0] === secretWordJamoSets[i][0] && componentMatches > 1) {
          // 🍄 첫 자음 일치 + 2개 이상 자모 일치
          letterColor[i] = DATA_SIMILAR[DATA_COLOR];
          letterEmote[i] = EMOTE_SIMILAR;

          for (let jamoChar = 0; jamoChar < currentGuessJamoSets[i].length; jamoChar++) {
            const shadeColor = (jamoChar === 0 || currentGuessJamoSets[i].length <= 2) ? 
                              DATA_MATCH[DATA_COLOR] : COLOR_MAYBE;
            const letter = currentGuessJamoSets[i][jamoChar];
            shadeKeyBoardDelayed(letter, shadeColor, shadeDelay);
            if (shadeColor === DATA_MATCH[DATA_COLOR]) {
              addToYesList(letter, i);
            }
          }

          addToHotComboList(currentGuess[i], i, 2, 10);
          addNonBatchimToNoList(i);
        } else if (componentMatches > 1) {
          // 🧄 2개 이상 자모 일치 (첫 자음 불일치)
          letterColor[i] = DATA_MANY[DATA_COLOR];
          letterEmote[i] = EMOTE_MANY;

          for (let jamoChar = 0; jamoChar < currentGuessJamoSets[i].length; jamoChar++) {
            const shadeColor = (currentGuessJamoSets[i].length <= 2) ? 
                              DATA_MATCH[DATA_COLOR] : COLOR_MAYBE;
            const letter = currentGuessJamoSets[i][jamoChar];
            shadeKeyBoardDelayed(letter, shadeColor, shadeDelay);
            if (shadeColor === DATA_MATCH[DATA_COLOR]) {
              addToYesList(letter, i);
            }
          }

          addToHotComboList(currentGuess[i], i, 2, 10);
        } else if (componentMatches === 1) {
          // 🍆 1개 자모 일치 - 개별 자모별로 정확한 상태 판정 (향상된 로직)
          letterColor[i] = DATA_EXISTS[DATA_COLOR];
          letterEmote[i] = EMOTE_EXISTS;

          // 정답에서 이미 사용된 자모들을 추적 (중복 매칭 방지)
          const secretJamosUsed = new Array(secretWordJamoSets[i].length).fill(false);
          let matchedJamoCount = 0;

          // 첫 번째 패스: 정확한 위치 매칭 우선 처리
          for (let jamoChar = 0; jamoChar < currentGuessJamoSets[i].length; jamoChar++) {
            const currentJamo = currentGuessJamoSets[i][jamoChar];
            
            // 같은 위치에서 정확한 매칭 확인
            if (jamoChar < secretWordJamoSets[i].length && 
                currentJamo === secretWordJamoSets[i][jamoChar] && 
                !secretJamosUsed[jamoChar]) {
              
              secretJamosUsed[jamoChar] = true;
              matchedJamoCount++;
              
              // 정확한 위치 매칭 - 더 높은 확실성
              shadeKeyBoardDelayed(currentJamo, COLOR_MAYBE, shadeDelay);
            }
          }

          // 두 번째 패스: 나머지 자모들에 대한 존재 여부 확인
          for (let jamoChar = 0; jamoChar < currentGuessJamoSets[i].length; jamoChar++) {
            const currentJamo = currentGuessJamoSets[i][jamoChar];
            
            // 이미 정확한 위치에서 매칭된 경우 스킵
            if (jamoChar < secretWordJamoSets[i].length && 
                currentJamo === secretWordJamoSets[i][jamoChar]) {
              continue;
            }
            
            // 다른 위치에서 이 자모가 존재하는지 확인
            let foundInOtherPosition = false;
            for (let secretPos = 0; secretPos < secretWordJamoSets[i].length; secretPos++) {
              if (!secretJamosUsed[secretPos] && 
                  currentJamo === secretWordJamoSets[i][secretPos]) {
                
                secretJamosUsed[secretPos] = true;
                matchedJamoCount++;
                foundInOtherPosition = true;
                
                // 다른 위치에서 발견 - 일반적인 존재 표시
                shadeKeyBoardDelayed(currentJamo, COLOR_MAYBE, shadeDelay);
                break;
              }
            }
            
            if (!foundInOtherPosition) {
              // 이 자모는 정답에 없음 - NO 리스트에 추가하고 회색 처리
              shadeKeyBoardDelayed(currentJamo, DATA_NONE[DATA_COLOR], shadeDelay);
              addToNoList(currentJamo, i);
            }
          }

          // Hot Combo 정보를 더 정확하게 설정 (실제 매칭된 개수 기반)
          addToHotComboList(currentGuess[i], i, Math.max(1, matchedJamoCount), matchedJamoCount);
        } else {
          // 현재 위치에서 일치하는 자모가 없는 경우 반대편 확인
          const other = 1 - i;
          const foundMatchInOther = countJamoComponentsInOtherJamoComponents(
            currentGuessJamoSets[i].join(''), 
            secretWordJamoSets[other].join('')
          ) > 0;

          if (foundMatchInOther) {
            // 🍌 반대쪽 글자에서 자모 일치
            letterColor[i] = DATA_OPPOSITE[DATA_COLOR];
            letterEmote[i] = EMOTE_OPPOSITE;

            for (let jamoChar = 0; jamoChar < currentGuessJamoSets[i].length; jamoChar++) {
              const letter = currentGuessJamoSets[i][jamoChar];
              shadeKeyBoardDelayed(letter, COLOR_MAYBE, shadeDelay);
              addToNoList(letter, i);
            }

            addToHotComboList(currentGuess[i], other, 1, 10);
          } else {
            // 🍎 전혀 일치하지 않음
            letterColor[i] = DATA_NONE[DATA_COLOR];
            letterEmote[i] = EMOTE_NONE;

            for (let jamoChar = 0; jamoChar < currentGuessJamoSets[i].length; jamoChar++) {
              const letter = currentGuessJamoSets[i][jamoChar];
              shadeKeyBoardDelayed(letter, DATA_NONE[DATA_COLOR], shadeDelay);
              addToNoList(letter, 0);
              addToNoList(letter, 1);
            }
          }
        }
      }
    }

    // 보드 상태 업데이트
    const newBoard = [...board];
    newBoard.push({
      letters: [...currentGuess],
      emotes: [...letterEmote]
    });

    // 승리 조건 확인
    const isWin = guessString === secretWordString;
    const newGuessesRemaining = guessesRemaining - 1;

    console.log('게임 분석:', {
      guessString,
      secretWordString,
      isWin,
      letterEmote
    });

    set({
      board: newBoard,
      currentGuess: [],
      currentGuessIndex: currentGuessIndex + 1,
      guessesRemaining: newGuessesRemaining,
    });

    // 상태 추적 최적화 수행 (게임이 끝나지 않은 경우에만)
    if (!isWin && newGuessesRemaining > 0) {
      // 현재 추측 정보를 기반으로 자모 상태 최적화
      get().optimizeJamoStateTracking(currentGuess, secretWordJamoSets);
    }

    // 게임 종료 조건 확인
    if (isWin) {
      endGame(true);
    } else if (newGuessesRemaining === 0) {
      endGame(false);
    } else {
      // 키보드 상태 업데이트 (지연 후)
      if (manual) {
        setTimeout(() => {
          colorKeyboardFromClues();
          // 키보드 색상 업데이트 후 추가 최적화 수행
          get().validateYesNoListConsistency();
        }, shadeDelay);
      } else {
        colorKeyboardFromClues();
        get().validateYesNoListConsistency();
      }
    }
  },

  // 원본 script_word.js의 colorKeyboardFromClues 함수 완전 구현
  colorKeyboardFromClues: () => {
    const {
      yesList,
      noList,
      hotComboList,
      hintList,
      allNewYes,
      allNewNo,
      board,
      guessesRemaining,
      yesNoMaybeListsFromComponents,
      addToYesList,
      addToNoList,
      addManyToNoList,
      shadeKeyBoard
    } = get();

    let tryAgain = true;

    // 추론 로직을 반복하여 새로운 정보가 더 이상 나오지 않을 때까지 계속
    while (tryAgain) {
      tryAgain = false;

      // 각 보드의 행을 검사
      const startRow = 0; // Race 모드는 나중에 구현
      for (let row = startRow; row < NUMBER_OF_GUESSES - guessesRemaining; row++) {
        const boardRow = board[row];
        if (!boardRow) continue;

        // 각 글자 위치 검사 (왼쪽, 오른쪽)
        for (let i = 0; i < MAX_LETTERS; i++) {
          const emote = boardRow.emotes[i];

          if (emote === EMOTE_EXISTS) {
            // 🍆 가지 로직: 정확히 1개 자모만 일치
            const yesNoMaybe = yesNoMaybeListsFromComponents(boardRow.letters[i], i, true);
            
            if (yesNoMaybe[0].length === 0) {
              // YES가 없는 경우
              if (yesNoMaybe[2].length === 1) {
                // MAYBE가 정확히 1개면 그것이 YES
                const newYes = yesNoMaybe[2][0];
                tryAgain = addToYesList(newYes, i) || tryAgain;
              } else if (yesNoMaybe[2].length > 1) {
                // MAYBE가 여러 개면 Hot Combo 로직 적용
                tryAgain = get().breaksAnyHotCombo(i, yesNoMaybe[2]) || tryAgain;
              }
            } else if (yesNoMaybe[0].length === 1 && yesNoMaybe[2].length > 0) {
              // YES가 1개 있으면 모든 MAYBE를 NO로 변경
              for (let noIndex = 0; noIndex < yesNoMaybe[2].length; noIndex++) {
                const newNo = yesNoMaybe[2][noIndex];
                tryAgain = addToNoList(newNo, i) || tryAgain;
              }
            }
          } else if (emote === EMOTE_MANY || emote === EMOTE_SIMILAR) {
            // 🧄 마늘 또는 🍄 버섯 로직: 2개 이상 자모 일치
            const yesNoMaybe = yesNoMaybeListsFromComponents(boardRow.letters[i], i, false);
            
            if ((yesNoMaybe[0].length === 0 && yesNoMaybe[2].length === 2) ||
                (yesNoMaybe[0].length === 1 && yesNoMaybe[2].length === 1)) {
              // YES가 없고 MAYBE가 2개이거나, YES가 1개고 MAYBE가 1개면
              // 모든 MAYBE를 YES로 변경
              for (let yesIndex = 0; yesIndex < yesNoMaybe[2].length; yesIndex++) {
                const newYes = yesNoMaybe[2][yesIndex];
                tryAgain = addToYesList(newYes, i) || tryAgain;
              }
            }
          } else if (emote === EMOTE_OPPOSITE) {
            // 🍌 바나나 로직: 반대쪽 글자에서 자모 일치
            const yesNoMaybe = yesNoMaybeListsFromComponents(boardRow.letters[i], 1 - i, false);
            
            if (yesNoMaybe[0].length === 0 && yesNoMaybe[2].length === 1) {
              // 반대쪽에서 YES가 없고 MAYBE가 1개면 그것을 YES로
              const newYes = yesNoMaybe[2][0];
              tryAgain = addToYesList(newYes, 1 - i) || tryAgain;
            }
          }

          // 힌트 관련 로직
          const hint = boardRow.hint;
          if (hint && hint !== 'X') {
            // 🎃 호박 로직
            if (noList[1 - i].includes(hint)) {
              // 힌트가 반대쪽에서 NO면 현재쪽에서 YES
              tryAgain = addToYesList(hint, i) || tryAgain;
            }
          }
        }
      }

      // 각 글자 위치별 추가 로직
      for (let i = 0; i < MAX_LETTERS; i++) {
        // 새로 추가된 YES 자모들에 대한 처리
        for (let yesIndex = 0; yesIndex < allNewYes[i].length; yesIndex++) {
          // 조합할 수 없는 모음들을 NO로 추가
          const unpairable = getUnpairableVowels(allNewYes[i][yesIndex]);
          tryAgain = addManyToNoList(unpairable.join(''), i) || tryAgain;
        }

        const yesConsonants: string[] = [];

        // 모든 YES 자모들을 검사
        for (let yesIndex = 0; yesIndex < yesList[i].length; yesIndex++) {
          // 자음 카운트
          if (isHangulConsonant(yesList[i][yesIndex])) {
            yesConsonants.push(yesList[i][yesIndex]);
          }

          // 힌트와의 조합 불가능성 검사
          for (let hintIndex = 0; hintIndex < hintList.length; hintIndex++) {
            if (areUnpairableVowels(hintList[hintIndex], yesList[i][yesIndex])) {
              tryAgain = addToNoList(hintList[hintIndex], i) || tryAgain;
              tryAgain = addToYesList(hintList[hintIndex], 1 - i) || tryAgain;
            }
          }
        }

        if (yesConsonants.length >= 3) {
          // 자음이 3개 이상이면 다른 모든 자음은 불가능
          tryAgain = addManyToNoList(HANGUL_CONSONANT_COMPONENTS, i) || tryAgain;
        } else if (yesConsonants.length === 2 && areUnpairableConsonants(yesConsonants[0], yesConsonants[1])) {
          // 자음이 2개이고 서로 조합 불가능하면
          const unpairableGroups: string[][] = [];

          // 각 YES 자음에 대해 조합 불가능한 자음들 수집
          for (let yesIndex = 0; yesIndex < yesConsonants.length; yesIndex++) {
            unpairableGroups.push(getUnpairableConsonants(yesConsonants[yesIndex]));
          }

          // 첫 번째 그룹의 각 자음에 대해
          for (let unpairable = 0; unpairable < unpairableGroups[0].length; unpairable++) {
            let inAll = true;
            
            // 다른 모든 그룹에 포함되는지 확인
            for (let group = 1; group < unpairableGroups.length; group++) {
              if (!unpairableGroups[group].includes(unpairableGroups[0][unpairable])) {
                inAll = false;
                break;
              }
            }

            if (!inAll) continue;

            // 모든 그룹에 포함되는 자음은 NO로 추가
            tryAgain = addToNoList(unpairableGroups[0][unpairable], i) || tryAgain;
          }
        }
      }
    }

    // 키보드 색상 업데이트
    for (let i = 0; i < MAX_LETTERS; i++) {
      // 새로 추가된 YES 자모들을 MATCH 색상으로
      for (let yesIndex = 0; yesIndex < allNewYes[i].length; yesIndex++) {
        shadeKeyBoard(allNewYes[i][yesIndex], DATA_MATCH[DATA_COLOR]);
      }

      // 새로 추가된 NO 자모들을 NONE 색상으로 (양쪽 모두 NO인 경우만)
      for (let noIndex = 0; noIndex < allNewNo[i].length; noIndex++) {
        const no = allNewNo[i][noIndex];
        if (noList[0].includes(no) && noList[1].includes(no)) {
          shadeKeyBoard(no, DATA_NONE[DATA_COLOR]);
        }
      }
    }

    // allNew 리스트 초기화
    set({ 
      allNewYes: [[], []], 
      allNewNo: [[], []] 
    });
  },

  // Hot Combo 제약 조건 확인 (원본 breaksAnyHotCombo)
  breaksAnyHotCombo: (index: number, testList: string[]) => {
    const { yesList, noList, hotComboList } = get();
    
    // 각 테스트 자모에 대해
    for (let test = 0; test < testList.length; test++) {
      // 현재 YES/NO 상태를 복사
      let yesListCopy = [...yesList[index]];
      let noListCopy = [...noList[index]];

      // 테스트 시나리오 설정
      for (let pick = 0; pick < testList.length; pick++) {
        if (testList[pick] === testList[test]) {
          // 현재 테스트 자모는 YES로
          if (!yesListCopy.includes(testList[pick])) {
            yesListCopy.push(testList[pick]);
            const unpairable = getUnpairableVowels(testList[pick]);
            for (let i = 0; i < unpairable.length; i++) {
              if (!noListCopy.includes(unpairable[i])) {
                noListCopy.push(unpairable[i]);
              }
            }
          }
        } else {
          // 다른 자모들은 NO로
          if (!noListCopy.includes(testList[pick])) {
            noListCopy.push(testList[pick]);
          }
        }
      }

      let poppedYes: string[] = [];

      // 각 Hot Combo 제약 조건 확인
      for (let hotCombo = 0; hotCombo < hotComboList[index].length; hotCombo++) {
        // 이전에 제거된 YES 자모들 복원
        for (let i = 0; i < poppedYes.length; i++) {
          yesListCopy.push(poppedYes[i]);
        }
        poppedYes = [];

        // 현재 Hot Combo에 대해 가능한 개수와 최대 개수 계산
        let possibleCount = 0;
        let maxCount = 0;
        
        const combo = hotComboList[index][hotCombo];
        for (let letter = 0; letter < combo.jamoComponents.length; letter++) {
          const jamo = combo.jamoComponents[letter];
          
          if (!noListCopy.includes(jamo)) {
            possibleCount++;
          }

          const yesPos = yesListCopy.indexOf(jamo);
          if (yesPos >= 0) {
            // YES 리스트에서 임시 제거
            poppedYes.push(yesListCopy[yesPos]);
            yesListCopy.splice(yesPos, 1);
            maxCount++;
          }
        }

        // 제약 조건 위반 확인
        if (possibleCount < combo.min || maxCount > combo.max) {
          // 이 테스트 자모는 NO로 추가해야 함
          return get().addToNoList(testList[test], index);
        }
      }
    }

    return false;
  },

  // 원본 script_init_2.js의 giveRandomShadeHint 함수 완전 구현
  giveRandomShadeHint: () => {
    const {
      hintsRemaining,
      secretWordJamoSets,
      hintList,
      getKeyBoardShade,
      shadeKeyBoardDelayed,
      colorKeyboardFromClues,
      disableKeyBoardUnmatched
    } = get();

    if (hintsRemaining <= 0) return;

    // 힌트 후보 수집
    const possibleHints: string[] = [];
    
    for (const jamoSet of secretWordJamoSets) {
      for (const character of jamoSet) {
        if (!possibleHints.includes(character)) {
          const shade = getKeyBoardShade(character);
          
          // 이미 MATCH나 NONE 상태가 아닌 자모들만 힌트 후보로
          if (shade !== DATA_NONE[DATA_COLOR] && shade !== DATA_MATCH[DATA_COLOR]) {
            possibleHints.push(character);
          }
        }
      }
    }

    let hint = 'X'; // 'X'는 모든 힌트가 소진된 상태

    if (possibleHints.length > 0) {
      // 일관된 힌트를 위해 dayNumber 기반으로 선택
      const today = new Date();
      const startDate = new Date('2024-01-01');
      const dayNumber = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // 원본과 동일한 mulberry32 랜덤 로직 (간단한 의사랜덤)
      const mulberry32 = (a: number) => {
        return function() {
          let t = a += 0x6D2B79F5;
          t = Math.imul(t ^ t >>> 15, t | 1);
          t ^= t + Math.imul(t ^ t >>> 7, t | 61);
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
      };
      
      const rand = Math.floor(mulberry32(dayNumber)() * possibleHints.length);
      hint = possibleHints[rand];
    }

    const shadeDelay = 700; // manual이므로 지연 적용

    if (hint !== 'X') {
      // 일반 힌트 제공
      const newHintList = [...hintList, hint];
      set({ 
        hintsRemaining: hintsRemaining - 1,
        hintList: newHintList
      });

      // 키보드에 힌트 표시
      shadeKeyBoardDelayed(hint, DATA_MATCH[DATA_COLOR], shadeDelay);
      
      setTimeout(() => {
        colorKeyboardFromClues();
      }, shadeDelay);

      console.log(`힌트 제공: ${hint} (남은 힌트: ${hintsRemaining - 1})`);
    } else {
      // 모든 힌트 소진 - 일치하지 않는 키 모두 비활성화
      setTimeout(() => {
        get().disableKeyBoardUnmatched();
      }, shadeDelay);

      set({ hintsRemaining: 0 });
      
      console.log('모든 힌트가 소진되었습니다. 일치하지 않는 키들을 비활성화합니다.');
    }

    // 힌트 키보드 버튼 비활성화
    const hintButton = get().getKeyboardKey(EMOTE_HINT);
    if (hintButton) {
      hintButton.setAttribute('disabled', 'true');
    }
  },

  // 일치하지 않는 키보드 키들 비활성화 (원본 disableKeyBoardUnmatched)
  disableKeyBoardUnmatched: () => {
    const elements = document.getElementsByClassName("keyboard-button");
    
    for (let i = 0; i < elements.length; i++) {
      const elem = elements[i] as HTMLElement;
      
      // 백스페이스, 엔터, 힌트 키는 제외
      if (elem.textContent === "⌫" || 
          elem.textContent === "⏎" || 
          elem.textContent === EMOTE_HINT ||
          elem.style.backgroundColor === DATA_MATCH[DATA_COLOR]) {
        continue;
      }

      // 나머지는 모두 비활성화
      elem.setAttribute('disabled', 'true');
      elem.style.backgroundColor = DATA_NONE[DATA_COLOR];
      
      // Yes/No 리스트에도 추가
      if (elem.textContent) {
        get().addToNoList(elem.textContent, 0);
        get().addToNoList(elem.textContent, 1);
      }
    }
  },

  // 게임 종료
  endGame: (won: boolean) => {
    set({ gameStatus: won ? 'won' : 'lost' });
  },

  // 에러 표시
  showError: (errorText: string) => {
    console.error(errorText);
    // TODO: UI에 에러 메시지 표시
  },

  // === 새로 추가된 상태 관리 최적화 함수들 ===

  // Yes/No 리스트 일관성 검증 (새로 추가)
  validateYesNoListConsistency: () => {
    const { yesList, noList } = get();
    let hasInconsistency = false;

    for (let i = 0; i < MAX_LETTERS; i++) {
      // 같은 자모가 YES와 NO 리스트에 동시에 있는지 확인
      for (const yesJamo of yesList[i]) {
        if (noList[i].includes(yesJamo)) {
          console.warn(`일관성 문제 발견: "${yesJamo}"가 위치 ${i}에서 YES와 NO 리스트에 동시 존재`);
          hasInconsistency = true;
          
          // 자동 수정: NO 리스트에서 제거 (YES가 더 확실한 정보)
          const newNoList = [...noList] as [string[], string[]];
          newNoList[i] = newNoList[i].filter(jamo => jamo !== yesJamo);
          set({ noList: newNoList });
        }
      }
      
      // 중복 제거
      const uniqueYesList = [...new Set(yesList[i])];
      const uniqueNoList = [...new Set(noList[i])];
      
      if (uniqueYesList.length !== yesList[i].length || 
          uniqueNoList.length !== noList[i].length) {
        
        const newYesList = [...yesList] as [string[], string[]];
        const newNoList = [...noList] as [string[], string[]];
        newYesList[i] = uniqueYesList;
        newNoList[i] = uniqueNoList;
        
        set({ yesList: newYesList, noList: newNoList });
        hasInconsistency = true;
      }
    }

    return !hasInconsistency;
  },

  // 자모 상태 추적 최적화 (새로 추가)
  optimizeJamoStateTracking: (currentGuess: string[], secretWordJamoSets: string[][]) => {
    const { 
      yesList, 
      noList, 
      hotComboList,
      addToYesList, 
      addToNoList,
      validateYesNoListConsistency 
    } = get();

    // 먼저 일관성 검증
    validateYesNoListConsistency();

    // 각 위치별로 상태 최적화
    for (let i = 0; i < MAX_LETTERS; i++) {
      // Hot Combo 제약 조건 기반 추론
      for (const combo of hotComboList[i]) {
        const comboJamos = combo.jamoComponents.split('');
        let confirmedJamos = 0;
        let possibleJamos = 0;
        let unknownJamos: string[] = [];

        for (const jamo of comboJamos) {
          if (yesList[i].includes(jamo)) {
            confirmedJamos++;
          } else if (!noList[i].includes(jamo)) {
            possibleJamos++;
            unknownJamos.push(jamo);
          }
        }

        // 정확히 최대 개수만큼 확인된 경우, 나머지는 NO
        if (confirmedJamos === combo.max && unknownJamos.length > 0) {
          for (const jamo of unknownJamos) {
            addToNoList(jamo, i);
          }
        }
        
        // 가능한 자모 수가 최소 요구량과 같은 경우, 모든 가능한 자모는 YES
        if (confirmedJamos + possibleJamos === combo.min && unknownJamos.length > 0) {
          for (const jamo of unknownJamos) {
            addToYesList(jamo, i);
          }
        }
      }

      // 자음/모음 조합 규칙 적용
      const yesConsonants = yesList[i].filter(jamo => isHangulConsonant(jamo));
      const yesVowels = yesList[i].filter(jamo => !isHangulConsonant(jamo));

      // 너무 많은 자음이 확정된 경우 나머지 자음 제외
      if (yesConsonants.length >= 2) {
        for (const consonant of HANGUL_CONSONANT_COMPONENTS) {
          if (!yesConsonants.includes(consonant) && !noList[i].includes(consonant)) {
            // 기존 자음들과 조합 가능성 확인
            let canCombine = false;
            for (const yesConsonant of yesConsonants) {
              if (!areUnpairableConsonants(consonant, yesConsonant)) {
                canCombine = true;
                break;
              }
            }
            
            if (!canCombine) {
              addToNoList(consonant, i);
            }
          }
        }
      }

      // 확정된 모음과 조합 불가능한 모음들 제외
      for (const yesVowel of yesVowels) {
        const unpairable = getUnpairableVowels(yesVowel);
        for (const vowel of unpairable) {
          if (!noList[i].includes(vowel)) {
            addToNoList(vowel, i);
          }
        }
      }
    }

    // 최종 일관성 재검증
    return validateYesNoListConsistency();
  },
}));