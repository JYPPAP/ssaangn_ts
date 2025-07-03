import { getRandomWord } from '../utils/wordValidation';
import { hangulSyllableToJamoComponentsText } from '../utils/hangul/core';
import { 
  PRACTICE_WORD, 
  PRACTICE_WORD_BACKUP,
  MAX_LETTERS 
} from '../data/constants';
import type { WordDataRaw } from '../types';

export interface WordInitializationResult {
  wordData: WordDataRaw | null;
  secretWordString: string;
  secretWordJamoSets: string[][];
  isPracticeGame: boolean;
}

export interface WordValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export class WordService {
  async initializeSecretWord(): Promise<WordInitializationResult> {
    try {
      let wordData: WordDataRaw | null = null;
      let secretWordString = '';
      let isPracticeGame = false;
      
      try {
        wordData = await getRandomWord();
        secretWordString = wordData?.word || PRACTICE_WORD;
      } catch (error) {
        console.log('Random word fetch failed, using practice word:', error);
        secretWordString = PRACTICE_WORD;
        isPracticeGame = true;
      }

      // 연습 게임인지 확인
      if (secretWordString === PRACTICE_WORD) {
        isPracticeGame = true;
      }

      // 자모 성분 분해
      const secretWordJamoSets = this.createJamoSets(secretWordString);

      return {
        wordData,
        secretWordString,
        secretWordJamoSets,
        isPracticeGame
      };
    } catch (error) {
      console.error('Word initialization failed:', error);
      
      // 폴백: 연습 단어 사용
      const secretWordString = PRACTICE_WORD;
      const secretWordJamoSets = this.createJamoSets(secretWordString);
      
      return {
        wordData: null,
        secretWordString,
        secretWordJamoSets,
        isPracticeGame: true
      };
    }
  }

  createJamoSets(word: string): string[][] {
    const jamoSets: string[][] = [];
    
    for (let i = 0; i < MAX_LETTERS; i++) {
      if (word[i]) {
        jamoSets[i] = hangulSyllableToJamoComponentsText(word[i]).split('');
      } else {
        jamoSets[i] = [];
      }
    }
    
    return jamoSets;
  }

  handlePracticeWordChange(
    currentGuess: string[], 
    secretWordString: string,
    guessesRemaining: number
  ): { shouldChange: boolean; newWord?: string; newJamoSets?: string[][] } {
    // 연습 게임에서 첫 번째 추측에서 정확한 글자가 있으면 다른 연습 단어로 변경
    if (guessesRemaining === 7 && // NUMBER_OF_GUESSES와 동일
        (currentGuess[0] === secretWordString[0] || currentGuess[1] === secretWordString[1])) {
      
      const newWord = PRACTICE_WORD_BACKUP;
      const newJamoSets = this.createJamoSets(newWord);
      
      return {
        shouldChange: true,
        newWord,
        newJamoSets
      };
    }

    return { shouldChange: false };
  }

  validateWordFormat(word: string): WordValidationResult {
    if (!word || word.length !== MAX_LETTERS) {
      return {
        isValid: false,
        errorMessage: `단어는 정확히 ${MAX_LETTERS}글자여야 합니다.`
      };
    }

    // 한글 문자인지 확인
    const hangulRegex = /^[가-힣]+$/;
    if (!hangulRegex.test(word)) {
      return {
        isValid: false,
        errorMessage: '한글 단어만 입력 가능합니다.'
      };
    }

    return { isValid: true };
  }

  extractJamoComponents(word: string): string[][] {
    const result: string[][] = [];
    
    for (let i = 0; i < word.length; i++) {
      const components = hangulSyllableToJamoComponentsText(word[i]);
      result[i] = components.split('');
    }
    
    return result;
  }

  compareWords(word1: string, word2: string): boolean {
    return word1 === word2;
  }

  getWordInfo(word: string): {
    length: number;
    characters: string[];
    jamoSets: string[][];
    totalJamoCount: number;
  } {
    const characters = Array.from(word);
    const jamoSets = this.extractJamoComponents(word);
    const totalJamoCount = jamoSets.reduce((count, set) => count + set.length, 0);

    return {
      length: word.length,
      characters,
      jamoSets,
      totalJamoCount
    };
  }

  isPracticeWord(word: string): boolean {
    return word === PRACTICE_WORD || word === PRACTICE_WORD_BACKUP;
  }
}