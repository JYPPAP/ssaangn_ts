import { getAllWords } from '../data/words';
import type { WordDataRaw } from '../types';

/**
 * 단어 사전 캐시
 */
let wordCache: Set<string> | null = null;

/**
 * 단어 사전 초기화
 */
async function initializeWordDictionary(): Promise<Set<string>> {
  if (wordCache) return wordCache;
  
  const words = await getAllWords();
  wordCache = new Set(words.map(w => w.word));
  return wordCache;
}

/**
 * 단어가 사전에 있는지 확인 (원본 fullDictionaryIncludes 함수)
 */
export async function fullDictionaryIncludes(word: string): Promise<boolean> {
  if (!word || word.length !== 2) return false;
  
  const dictionary = await initializeWordDictionary();
  return dictionary.has(word);
}

/**
 * 한글 글자인지 확인 (완성된 한글 + 조합 중인 자모 모두 허용)
 */
function isKoreanCharacter(char: string): boolean {
  if (!char || char.length !== 1) return false;
  
  // 완성된 한글 (가-힣)
  if (char >= '가' && char <= '힣') return true;
  
  // 자음 (ㄱ-ㅎ)
  if (char >= 'ㄱ' && char <= 'ㅎ') return true;
  
  // 모음 (ㅏ-ㅣ)
  if (char >= 'ㅏ' && char <= 'ㅣ') return true;
  
  return false;
}

/**
 * 완성된 한글 글자인지 확인
 */
function isCompleteHangul(char: string): boolean {
  if (!char || char.length !== 1) return false;
  return char >= '가' && char <= '힣';
}

/**
 * 단어 유효성 검사 (입력 중 vs 제출 시 분리)
 */
export async function validateWord(word: string, forSubmission: boolean = true): Promise<{
  isValid: boolean;
  error?: string;
}> {
  // 길이 검사
  if (!word || word.length !== 2) {
    return {
      isValid: false,
      error: '단어는 정확히 2글자여야 합니다.'
    };
  }

  // 기본 한글 검사 (조합 중인 자모도 허용)
  for (let i = 0; i < word.length; i++) {
    if (!isKoreanCharacter(word[i])) {
      return {
        isValid: false,
        error: '한글만 입력할 수 있습니다.'
      };
    }
  }

  // 제출 시에만 완성된 한글과 사전 검사
  if (forSubmission) {
    // 완성된 한글 검사
    for (let i = 0; i < word.length; i++) {
      if (!isCompleteHangul(word[i])) {
        return {
          isValid: false,
          error: '완성된 한글 2글자를 입력해주세요.'
        };
      }
    }

    // 사전 검사
    const isInDictionary = await fullDictionaryIncludes(word);
    if (!isInDictionary) {
      return {
        isValid: false,
        error: '사전에 없는 단어입니다.'
      };
    }
  }

  return { isValid: true };
}

/**
 * 레이스 모드용 단어 필터링
 * 이전 정답들과 겹치는 자모가 있는 단어들을 제외
 */
export async function getFilteredWordsForRace(
  previousWords: string[], 
  excludeJamos: string[]
): Promise<string[]> {
  const allWords = await getAllWords();
  
  return allWords
    .map(w => w.word)
    .filter(word => {
      // 이전 정답과 동일한 단어 제외
      if (previousWords.includes(word)) return false;
      
      // 제외할 자모가 포함된 단어 제외
      for (const jamo of excludeJamos) {
        if (word.includes(jamo)) return false;
      }
      
      return true;
    });
}

/**
 * 랜덤 단어 선택
 */
export async function getRandomWord(): Promise<WordDataRaw> {
  const words = await getAllWords();
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}

/**
 * 특정 조건에 맞는 랜덤 단어 선택
 */
export async function getRandomWordWithFilter(
  filterFn: (word: WordDataRaw) => boolean
): Promise<WordDataRaw | null> {
  const words = await getAllWords();
  const filteredWords = words.filter(filterFn);
  
  if (filteredWords.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * filteredWords.length);
  return filteredWords[randomIndex];
}

/**
 * 일자 기반 단어 선택 (원본 getSecretWordByDayIndex 로직)
 */
export async function getSecretWordByDayIndex(dayIndex: number): Promise<WordDataRaw> {
  const words = await getAllWords();
  const index = dayIndex % words.length;
  return words[index];
}