import { useCallback, useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';
import { GameService, JamoStateCallbacks } from '../services/gameService';
import { WordService } from '../services/wordService';
import { HintService, HintCallbacks } from '../services/hintService';
import { appendHangul, deleteOneJamo } from '../utils/hangul/input';
import { hangulSyllableToJamoComponentsText, isHangulConsonant } from '../utils/hangul/core';
import {
  getUnpairableVowels,
  getUnpairableConsonants,
  areUnpairableConsonants,
  areUnpairableVowels,
  HANGUL_CONSONANT_COMPONENTS,
  HANGUL_CONSONANT_VOWEL_LIST
} from '../utils/hangul';
import { MAX_LETTERS } from '../data/constants';

export const useGame = () => {
  const store = useGameStore();

  // ===== 서비스 콜백 정의 =====
  const jamoStateCallbacks: JamoStateCallbacks = useMemo(() => ({
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
    addToYesList: store.addToYesList,
    addToNoList: store.addToNoList,
    addToHotComboList: store.addToHotComboList,
    addAllOthersToNoList: (jamoComponents: string, index: number) => {
      if (jamoComponents.length === 0) return;
      
      for (let i = 0; i < HANGUL_CONSONANT_VOWEL_LIST.length; i++) {
        if (jamoComponents.indexOf(HANGUL_CONSONANT_VOWEL_LIST[i]) < 0) {
          store.addToNoList(HANGUL_CONSONANT_VOWEL_LIST[i], index);
        }
      }
    },
    addNonBatchimToNoList: (index: number) => {
      const unpairable = getUnpairableConsonants(' ');
      for (let i = 0; i < unpairable.length; i++) {
        store.addToNoList(unpairable[i], index);
      }
    },
    isCharacterAllWrong: (character: string) => {
      const components = hangulSyllableToJamoComponentsText(character);
      if (components.length === 0) return false;
      
      // 키보드 상태 확인 로직 (임시로 false 반환)
      // 실제로는 키보드 서비스에서 확인해야 함
      return false;
    },
    shadeKeyBoardDelayed: (letter: string, color: string, delay: number) => {
      // 키보드 색상 업데이트 로직 (임시)
      // 실제로는 키보드 서비스에서 처리해야 함
      console.log(`Keyboard update: ${letter} -> ${color} (delay: ${delay}ms)`);
    }
  }), [store]);

  const hintCallbacks: HintCallbacks = useMemo(() => ({
    getKeyBoardShade: (letter: string) => {
      // 키보드 색상 조회 (임시)
      return '';
    },
    shadeKeyBoardDelayed: (letter: string, color: string, delay: number) => {
      // 키보드 색상 업데이트 (임시)
      console.log(`Hint keyboard update: ${letter} -> ${color} (delay: ${delay}ms)`);
    },
    disableKeyBoardUnmatched: () => {
      // 키보드 비활성화 (임시)
      console.log('Disable unmatched keys');
    },
    getKeyboardKey: (letter: string) => {
      // 키보드 요소 조회 (임시)
      return null;
    },
    addToHintList: store.addToHintList,
    decrementHintsRemaining: store.decrementHintsRemaining,
    setHintsRemaining: store.setHintsRemaining,
    colorKeyboardFromClues: () => {
      // 키보드 색상 업데이트 (임시)
      console.log('Update keyboard colors from clues');
    }
  }), [store]);

  // ===== 서비스 인스턴스 =====
  const gameService = useMemo(() => new GameService(jamoStateCallbacks), [jamoStateCallbacks]);
  const wordService = useMemo(() => new WordService(), []);
  const hintService = useMemo(() => new HintService(hintCallbacks), [hintCallbacks]);

  // ===== 게임 초기화 =====
  const initializeGame = useCallback(async () => {
    try {
      const wordResult = await wordService.initializeSecretWord();
      
      store.initializeGame(
        wordResult.wordData,
        wordResult.secretWordString,
        wordResult.isPracticeGame
      );

      console.log('게임 초기화 완료:', {
        word: wordResult.secretWordString,
        isPractice: wordResult.isPracticeGame
      });
    } catch (error) {
      console.error('게임 초기화 실패:', error);
    }
  }, [wordService, store]);

  // ===== 글자 입력 =====
  const insertLetter = useCallback((letter: string) => {
    if (store.gameStatus !== 'playing') return;

    const { currentGuess } = store;
    
    // 현재 입력 상태 분석
    let targetIndex = -1;
    let targetChar = '';
    
    // 입력할 위치 찾기 (첫 번째 빈 곳 또는 마지막 미완성 글자)
    for (let i = 0; i < MAX_LETTERS; i++) {
      if (!currentGuess[i]) {
        // 빈 위치 발견
        targetIndex = i;
        break;
      } else {
        // 기존 글자가 있는 경우, 조합 가능한지 확인
        const appendResult = appendHangul(currentGuess[i], letter);
        if (appendResult !== currentGuess[i] + letter) {
          // 조합 가능한 경우 (단순 연결이 아닌 실제 조합)
          targetIndex = i;
          targetChar = currentGuess[i];
          break;
        }
      }
    }
    
    // 입력 위치를 찾지 못한 경우 (최대 길이 초과)
    if (targetIndex === -1) {
      return;
    }
    
    // 한글 조합 시도
    if (targetChar) {
      // 기존 글자와 조합
      const appendResult = appendHangul(targetChar, letter);
      
      if (appendResult === targetChar + letter) {
        // 조합 불가능 - 다음 위치에 새 글자로 입력
        if (targetIndex + 1 < MAX_LETTERS && !currentGuess[targetIndex + 1]) {
          const newCurrentGuess = [...currentGuess];
          newCurrentGuess[targetIndex + 1] = letter;
          store.setCurrentGuess(newCurrentGuess);
        }
      } else {
        // 조합 성공
        const newCurrentGuess = [...currentGuess];
        newCurrentGuess[targetIndex] = appendResult;
        store.setCurrentGuess(newCurrentGuess);
      }
    } else {
      // 빈 위치에 새 글자 입력
      const newCurrentGuess = [...currentGuess];
      newCurrentGuess[targetIndex] = letter;
      store.setCurrentGuess(newCurrentGuess);
    }
  }, [store]);

  // ===== 글자 삭제 =====
  const deleteLetter = useCallback(() => {
    if (store.gameStatus !== 'playing') return;

    const { currentGuess } = store;
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
    
    store.setCurrentGuess(newCurrentGuess);
  }, [store]);

  // ===== 추측 제출 =====
  const submitGuess = useCallback(async () => {
    try {
      const analysisInput = {
        currentGuess: store.currentGuess,
        secretWordString: store.secretWordString,
        secretWordJamoSets: store.secretWordJamoSets,
        isPracticeGame: store.isPracticeGame,
        guessesRemaining: store.guessesRemaining,
        invalidWordCount: store.invalidWordCount,
        foundMatch: store.foundMatch,
        manual: true
      };

      const result = await gameService.analyzeGuess(analysisInput);

      if (!result.isValid) {
        console.error(result.errorMessage);
        return;
      }

      // 연습 게임 단어 변경 체크
      if (result.shouldChangeSecretWord && store.isPracticeGame) {
        const changeResult = wordService.handlePracticeWordChange(
          store.currentGuess,
          store.secretWordString,
          store.guessesRemaining
        );
        
        if (changeResult.shouldChange && changeResult.newWord) {
          store.setSecretWord(changeResult.newWord, true);
        }
      }

      // 보드 업데이트
      store.addBoardRow(result.boardRow);
      
      // foundMatch 업데이트
      for (let i = 0; i < result.letterEmotes.length; i++) {
        if (result.letterEmotes[i] === '🥕') { // EMOTE_MATCH
          store.updateFoundMatch(i, true);
        }
      }

      // 게임 상태 업데이트
      store.decrementGuessesRemaining();
      store.incrementCurrentGuessIndex();
      store.clearCurrentGuess();

      // 게임 종료 체크
      const gameEndResult = gameService.checkGameEnd(result.isWin, store.guessesRemaining - 1);
      
      if (gameEndResult.gameEnd) {
        store.setGameStatus(gameEndResult.won ? 'won' : 'lost');
      } else {
        // 키보드 색상 업데이트 (지연 후)
        setTimeout(() => {
          // colorKeyboardFromClues 로직은 나중에 keyboardService로 처리
          store.clearAllNewLists();
        }, 700);
      }

    } catch (error) {
      console.error('추측 제출 실패:', error);
    }
  }, [store, gameService, wordService]);

  // ===== 힌트 사용 =====
  const useHint = useCallback(async () => {
    try {
      const hintInput = {
        secretWordJamoSets: store.secretWordJamoSets,
        hintsRemaining: store.hintsRemaining
      };

      const result = await hintService.executeHint(hintInput);
      
      console.log(result.message);
    } catch (error) {
      console.error('힌트 사용 실패:', error);
    }
  }, [store, hintService]);

  // ===== 게임 리셋 =====
  const resetGame = useCallback(() => {
    store.resetGame();
    initializeGame();
  }, [store, initializeGame]);

  // ===== 반환값 =====
  return {
    // 상태
    gameStatus: store.gameStatus,
    currentGuess: store.currentGuess,
    board: store.board,
    guessesRemaining: store.guessesRemaining,
    currentGuessIndex: store.currentGuessIndex,
    secretWordString: store.secretWordString,
    isPracticeGame: store.isPracticeGame,
    hintsRemaining: store.hintsRemaining,
    foundMatch: store.foundMatch,

    // 액션
    initializeGame,
    insertLetter,
    deleteLetter,
    submitGuess,
    useHint,
    resetGame,

    // 유틸리티
    canUseHint: store.hintsRemaining > 0,
    isGameEnd: store.gameStatus !== 'playing',
    isWon: store.gameStatus === 'won',
    isLost: store.gameStatus === 'lost'
  };
};