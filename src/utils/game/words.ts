import { WordData, WordDataRaw } from '../../types';
import { wordDatabase, convertRawWordData } from '../../data/database';

/**
 * 게임용 단어 관리 유틸리티
 */

/**
 * 게임용 랜덤 단어 가져오기
 */
export async function getGameWord(): Promise<WordData> {
  const rawWord = await wordDatabase.getRandomWord();
  return convertRawWordData(rawWord);
}

/**
 * 단어 유효성 검사
 */
export function isValidWord(word: string): boolean {
  // 2글자 한글만 허용
  if (word.length !== 2) return false;
  
  // 한글 음절 범위 확인 (가-힣)
  const hangulPattern = /^[가-힣]{2}$/;
  return hangulPattern.test(word);
}

/**
 * 단어 검증 (실제 존재하는 단어인지 확인)
 */
export async function validateWordExists(word: string): Promise<boolean> {
  if (!isValidWord(word)) return false;
  
  const allWords = await wordDatabase.getAllWords();
  return allWords.some(w => w.word === word);
}

/**
 * 단어 힌트 생성
 */
export function generateWordHint(targetWord: string, guessedWords: string[]): string {
  // 간단한 힌트 시스템 (향후 확장 가능)
  if (guessedWords.length === 0) {
    return `첫 글자는 "${targetWord[0]}"입니다.`;
  }
  
  if (guessedWords.length >= 5) {
    return `두 번째 글자는 "${targetWord[1]}"입니다.`;
  }
  
  return "계속 시도해보세요!";
}

/**
 * 게임 통계를 위한 단어 분석
 */
export interface WordAnalysis {
  word: string;
  difficulty: 'easy' | 'medium' | 'hard';
  commonJamos: string[];
  rareJamos: string[];
}

/**
 * 단어 난이도 분석
 */
export function analyzeWordDifficulty(word: string): WordAnalysis {
  // 간단한 난이도 분석 (실제로는 더 복잡한 알고리즘 필요)
  const commonJamos = ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ', 'ㅡ', 'ㅣ', 'ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ'];
  
  let commonCount = 0;
  let rareCount = 0;
  const wordJamos: string[] = [];
  const commonFound: string[] = [];
  const rareFound: string[] = [];
  
  // 단어의 자모 분석 (간단한 버전)
  for (const char of word) {
    // 실제로는 한글 분해 함수 사용해야 함
    wordJamos.push(char);
    
    if (commonJamos.includes(char)) {
      commonCount++;
      commonFound.push(char);
    } else {
      rareCount++;
      rareFound.push(char);
    }
  }
  
  let difficulty: 'easy' | 'medium' | 'hard';
  if (rareCount === 0) {
    difficulty = 'easy';
  } else if (rareCount === 1) {
    difficulty = 'medium';
  } else {
    difficulty = 'hard';
  }
  
  return {
    word,
    difficulty,
    commonJamos: commonFound,
    rareJamos: rareFound
  };
}