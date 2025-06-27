import { create } from 'zustand';
import { appendHangul, deleteOneJamo } from '../utils/hangul/input';
import { analyzeGuess, KeyboardState, type GameEmote, GAME_EMOTES } from '../utils/gameLogic';
import { validateWord, getSecretWordByDayIndex } from '../utils/wordValidation';
import { hangulSyllableToJamoComponentsText } from '../utils/hangul/core';
import type { WordDataRaw } from '../types';

interface GameBoardRow {
  letters: string[];
  emotes: GameEmote[];
}

interface GameState {
  // 게임 상태
  gameStatus: 'playing' | 'won' | 'lost';
  currentGuess: string[];
  currentGuessIndex: number;
  guessesRemaining: number;
  hintsRemaining: number;
  board: GameBoardRow[];
  secretWord: WordDataRaw | null;
  
  // 키보드 상태
  keyboardState: Record<string, KeyboardState>;
  
  // 힌트 상태 (원본 script.js 로직)
  revealedJamos: string[];
  secretWordJamoSets: string[];
  
  // 게임 액션
  initializeGame: () => Promise<void>;
  insertLetter: (letter: string) => void;
  deleteLetter: () => void;
  submitGuess: () => Promise<void>;
  useHint: () => void;
  resetGame: () => void;
  
  // 내부 헬퍼
  updateKeyboardState: (guess: string[], emotes: GameEmote[]) => void;
  endGame: (won: boolean) => void;
  giveRandomShadeHint: () => void;
  getKeyboardShade: (letter: string) => KeyboardState;
}

export const useGameStore = create<GameState>((set, get) => ({
  // 초기 상태
  gameStatus: 'playing',
  currentGuess: ['', ''],
  currentGuessIndex: 0,
  guessesRemaining: 7,
  hintsRemaining: 1, // 원본처럼 1개로 설정
  board: [],
  secretWord: null,
  keyboardState: {},
  
  // 힌트 상태
  revealedJamos: [],
  secretWordJamoSets: [],

  // 게임 초기화
  initializeGame: async () => {
    try {
      // 일자 기반 단어 선택
      const today = new Date();
      const startDate = new Date('2024-01-01');
      const dayIndex = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const wordData = await getSecretWordByDayIndex(dayIndex);
      
      // 정답 단어의 자모 성분 추출 (원본 로직)
      const secretWordJamoSets = [];
      if (wordData && wordData.word.length === 2) {
        secretWordJamoSets.push(hangulSyllableToJamoComponentsText(wordData.word[0]));
        secretWordJamoSets.push(hangulSyllableToJamoComponentsText(wordData.word[1]));
      }
      
      set({
        gameStatus: 'playing',
        currentGuess: ['', ''],
        currentGuessIndex: 0,
        guessesRemaining: 7,
        hintsRemaining: 1, // 원본처럼 1개로 설정
        board: [],
        secretWord: wordData,
        keyboardState: {},
        revealedJamos: [],
        secretWordJamoSets,
      });
    } catch (error) {
      console.error('게임 초기화 실패:', error);
    }
  },

  // 글자 입력 (한글 조합 처리) - 원본 script.js 로직 적용
  insertLetter: (letter: string) => {
    const { currentGuess, gameStatus } = get();
    
    if (gameStatus !== 'playing') return;
    
    // 현재 입력된 글자들을 하나의 문자열로 합침
    const combinedText = currentGuess.join('');
    let newCurrentGuess = [...currentGuess];
    
    // 기존 글자가 있는 경우 조합 시도
    if (combinedText.length > 0) {
      const lastChar = combinedText[combinedText.length - 1];
      const appendResult = appendHangul(lastChar, letter);
      
      // 조합 결과가 2글자 이상이고 이미 최대 길이인 경우 입력 거부
      if (appendResult.length > 1 && combinedText.length >= 2) {
        return;
      }
      
      // 조합된 결과를 새로운 텍스트로 설정
      let newText = combinedText.slice(0, -1) + appendResult;
      
      // 결과를 2글자 배열로 분할
      if (newText.length <= 2) {
        newCurrentGuess = [
          newText[0] || '',
          newText[1] || ''
        ];
        set({ currentGuess: newCurrentGuess });
        return;
      } else {
        // 조합 결과가 2글자를 초과하는 경우, 마지막 글자를 새로운 글자로 처리
        newText = newText.slice(0, 2);
        newCurrentGuess = [
          newText[0] || '',
          newText[1] || ''
        ];
        set({ currentGuess: newCurrentGuess });
        return;
      }
    }
    
    // 새로운 글자 입력 (빈 상태에서 시작)
    if (combinedText.length < 2) {
      const newText = combinedText + letter;
      newCurrentGuess = [
        newText[0] || '',
        newText[1] || ''
      ];
      set({ currentGuess: newCurrentGuess });
    }
  },

  // 글자 삭제 (한글 분해 처리) - 원본 script.js 로직 적용
  deleteLetter: () => {
    const { currentGuess, gameStatus } = get();
    
    if (gameStatus !== 'playing') return;
    
    // 현재 입력된 글자들을 하나의 문자열로 합침
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

  // 추측 제출
  submitGuess: async () => {
    const { 
      currentGuess, 
      secretWord, 
      board, 
      currentGuessIndex,
      guessesRemaining,
      updateKeyboardState,
      endGame 
    } = get();
    
    if (!secretWord) return;
    
    // 두 글자가 모두 입력되었는지 확인
    if (!currentGuess[0] || !currentGuess[1]) {
      console.warn('두 글자를 모두 입력해주세요.');
      return;
    }
    
    const guessWord = currentGuess.join('');
    console.log('제출할 단어:', guessWord, '글자들:', currentGuess);
    
    // 단어 유효성 검사 (제출용)
    const validation = await validateWord(guessWord, true);
    if (!validation.isValid) {
      console.warn('유효하지 않은 단어:', validation.error);
      // TODO: UI에 에러 메시지 표시
      return;
    }
    
    // 게임 로직으로 분석
    const emotes = analyzeGuess(currentGuess, [secretWord.word[0], secretWord.word[1]]);
    
    // 보드에 추가
    const newBoard = [...board];
    newBoard.push({
      letters: [...currentGuess],
      emotes: [...emotes]
    });
    
    // 키보드 상태 업데이트
    updateKeyboardState(currentGuess, emotes);
    
    // 승리 조건 확인
    const isWin = guessWord === secretWord.word;
    const newGuessesRemaining = guessesRemaining - 1;
    
    console.log('게임 분석:', {
      guessWord,
      secretWord: secretWord.word,
      isWin,
      emotes
    });
    
    set({
      board: newBoard,
      currentGuess: ['', ''],
      currentGuessIndex: currentGuessIndex + 1,
      guessesRemaining: newGuessesRemaining,
    });
    
    // 게임 종료 조건 확인
    if (isWin) {
      endGame(true);
    } else if (newGuessesRemaining === 0) {
      endGame(false);
    }
  },

  // 힌트 사용 (원본 giveRandomShadeHint 로직)
  useHint: () => {
    const { hintsRemaining, giveRandomShadeHint } = get();
    
    if (hintsRemaining <= 0) return;
    
    giveRandomShadeHint();
  },

  // 게임 리셋
  resetGame: () => {
    get().initializeGame();
  },

  // 키보드 상태 업데이트 (자모 단위 처리)
  updateKeyboardState: (guess: string[], emotes: GameEmote[]) => {
    const { keyboardState, secretWord } = get();
    const newKeyboardState = { ...keyboardState };
    
    if (!secretWord || secretWord.word.length !== 2) return;
    
    for (let i = 0; i < guess.length; i++) {
      const guessChar = guess[i];
      const emote = emotes[i];
      const secretChar = secretWord.word[i];
      
      if (!guessChar) continue;
      
      // 각 글자를 자모로 분해
      const guessJamos = hangulSyllableToJamoComponentsText(guessChar);
      const secretJamos = hangulSyllableToJamoComponentsText(secretChar);
      
      // 이모지별 자모 상태 업데이트
      if (emote === GAME_EMOTES.MATCH) {
        // 🥕 당근: 완전 일치 - 모든 자모가 정확한 위치
        for (let j = 0; j < guessJamos.length; j++) {
          const jamo = guessJamos[j];
          newKeyboardState[jamo] = KeyboardState.MATCH;
        }
      } else if (emote === GAME_EMOTES.NONE) {
        // 🍎 사과: 전혀 일치하지 않음 - 모든 자모가 정답에 없음
        for (let j = 0; j < guessJamos.length; j++) {
          const jamo = guessJamos[j];
          // MATCH 상태가 아닌 경우에만 NONE으로 설정
          if (newKeyboardState[jamo] !== KeyboardState.MATCH) {
            newKeyboardState[jamo] = KeyboardState.NONE;
          }
        }
      } else {
        // 🍄🧄🍆🍌 (버섯/마늘/가지/바나나): 부분 일치
        for (let j = 0; j < guessJamos.length; j++) {
          const jamo = guessJamos[j];
          
          // 이미 MATCH나 NONE 상태가 아닌 경우에만 USED로 설정
          if (!newKeyboardState[jamo] || 
              (newKeyboardState[jamo] !== KeyboardState.MATCH && 
               newKeyboardState[jamo] !== KeyboardState.NONE)) {
            newKeyboardState[jamo] = KeyboardState.USED;
          }
        }
      }
    }
    
    set({ keyboardState: newKeyboardState });
  },

  // 게임 종료
  endGame: (won: boolean) => {
    set({ gameStatus: won ? 'won' : 'lost' });
  },

  // 키보드 색상 상태 확인 (우선순위 적용)
  getKeyboardShade: (letter: string) => {
    const { keyboardState, revealedJamos } = get();
    
    // 우선순위 1: 힌트로 공개된 자모는 항상 최우선 MATCH
    if (revealedJamos.includes(letter)) {
      return KeyboardState.MATCH;
    }
    
    // 우선순위 2: 게임 진행으로 확인된 상태
    const gameState = keyboardState[letter];
    if (gameState) {
      return gameState;
    }
    
    // 우선순위 3: 기본값
    return KeyboardState.UNUSED;
  },

  // 게임 피드백 기반 힌트 제공 (개선된 로직)
  giveRandomShadeHint: () => {
    const { 
      hintsRemaining, 
      secretWordJamoSets, 
      revealedJamos,
      keyboardState 
    } = get();
    
    if (hintsRemaining <= 0) return;
    
    // 힌트 후보 수집 (우선순위 기반)
    const usedHints: string[] = [];    // USED 상태 자모 (우선순위 1)
    const unusedHints: string[] = [];  // UNUSED 상태 자모 (우선순위 2)
    
    for (const jamoSet of secretWordJamoSets) {
      for (let i = 0; i < jamoSet.length; i++) {
        const jamo = jamoSet[i];
        
        // 이미 힌트로 공개된 자모는 제외
        if (revealedJamos.includes(jamo)) continue;
        
        const keyState = keyboardState[jamo] || KeyboardState.UNUSED;
        
        // 힌트 제공 조건 확인
        if (keyState === KeyboardState.MATCH) {
          // 🥕 이미 정확한 위치 확인됨 → 힌트 불필요
          continue;
        } else if (keyState === KeyboardState.NONE) {
          // 🍎 전혀 없는 자모 → 힌트 불필요  
          continue;
        } else if (keyState === KeyboardState.USED) {
          // 🍄🧄🍆🍌 부분적으로 맞는 자모 → 힌트 후보 (우선순위 1)
          if (!usedHints.includes(jamo)) {
            usedHints.push(jamo);
          }
        } else {
          // UNUSED 아직 시도하지 않은 자모 → 힌트 후보 (우선순위 2)
          if (!unusedHints.includes(jamo)) {
            unusedHints.push(jamo);
          }
        }
      }
    }
    
    // 우선순위에 따라 힌트 선택
    const possibleHints = usedHints.length > 0 ? usedHints : unusedHints;
    let hint = '';
    
    if (possibleHints.length > 0) {
      // 일관된 힌트를 위해 dayNumber 기반 선택
      const today = new Date();
      const startDate = new Date('2024-01-01');
      const dayNumber = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const randomIndex = dayNumber % possibleHints.length;
      hint = possibleHints[randomIndex];
    }
    
    if (hint) {
      // 힌트 적용
      const newRevealedJamos = [...revealedJamos, hint];
      
      set({ 
        hintsRemaining: hintsRemaining - 1,
        revealedJamos: newRevealedJamos
      });
      
      console.log('힌트 제공:', hint, '(키보드 상태:', keyboardState[hint] || 'UNUSED', ') 남은 힌트:', hintsRemaining - 1);
    } else {
      console.log('제공할 힌트가 없습니다.');
    }
  },
}));