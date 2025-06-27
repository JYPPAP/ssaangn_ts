import {
  isHangulConsonant,
  isHangulVowel,
  isHangulSyllable,
  hasBatchim,
  hangulSyllableToHangulBatchimIndex,
  hangulSyllableToHangulVowelIndex,
  toJamo
} from './core';
import {
  HANGUL_SYLLABLE_TABLE_START,
  HANGUL_SYLLABLE_CONSONANT_SPAN,
  HANGUL_SYLLABLE_VOWEL_SPAN
} from './constants';

/**
 * 한글 문자 추가 (핵심 입력 처리 함수)
 */
export function appendHangul(previous: string, pressedKey: string): string {
  if (isHangulConsonant(previous)) {
    if (!isHangulVowel(pressedKey)) {
      return previous;
    }
    
    return String.fromCharCode(
      jamoConsonantToHangulSyllables(previous) + jamoVowelToHangulSyllableOffset(pressedKey)
    );
  }
  
  const appendedVowel = appendVowel(previous, pressedKey);
  if (appendedVowel !== undefined) {
    return appendedVowel;
  }
  
  const appendedBatchim = appendBatchim(previous, pressedKey);
  if (appendedBatchim !== undefined) {
    return appendedBatchim;
  }
  
  return previous + pressedKey;
}

/**
 * 한글 자모 하나 삭제 (스마트 삭제)
 */
export function deleteOneJamo(previous: string): string {
  if (!isHangulSyllable(previous)) {
    return "";
  }
  
  if (hasBatchim(previous)) {
    return deleteOneBatchim(previous);
  }
  
  return deleteOneVowel(previous);
}

/**
 * 자음을 한글 음절의 시작 위치로 변환
 */
function jamoConsonantToHangulSyllables(character: string): number {
  if (!isHangulConsonant(character)) {
    return 0;
  }
  
  const jamo = toJamo(character);
  const consonantIndex = jamo.charCodeAt(0) - 'ᄀ'.codePointAt(0)!;
  return consonantIndex * HANGUL_SYLLABLE_CONSONANT_SPAN + HANGUL_SYLLABLE_TABLE_START.codePointAt(0)!;
}

/**
 * 모음을 한글 음절 오프셋으로 변환
 */
function jamoVowelToHangulSyllableOffset(character: string): number {
  if (!isHangulVowel(character)) {
    return 0;
  }
  
  const jamo = toJamo(character);
  const vowelIndex = jamo.charCodeAt(0) - 'ᅡ'.codePointAt(0)!;
  return vowelIndex * HANGUL_SYLLABLE_VOWEL_SPAN;
}

/**
 * 모음 추가 처리
 */
function appendVowel(previous: string, pressedKey: string): string | undefined {
  if (!isHangulSyllable(previous) || !isHangulVowel(pressedKey)) {
    return undefined;
  }
  
  const consonantIndex = hangulSyllableToHangulConsonantIndex(previous);
  const vowelIndex = hangulSyllableToHangulVowelIndex(previous);
  const batchimIndex = hangulSyllableToHangulBatchimIndex(previous);
  
  const syllables = consonantIndex * HANGUL_SYLLABLE_CONSONANT_SPAN + HANGUL_SYLLABLE_TABLE_START.codePointAt(0)!;
  
  // 받침이 있는 경우 분리해서 새 음절 시작
  if (batchimIndex !== 0) {
    const nextConsonant = hangulBatchimIndexToJamoConsonant(batchimIndex);
    if (nextConsonant) {
      return deleteOneBatchim(previous) + 
        String.fromCharCode(jamoConsonantToHangulSyllables(nextConsonant) + jamoVowelToHangulSyllableOffset(pressedKey));
    }
    return undefined;
  }
  
  const character = toJamo(pressedKey);
  
  // 복합 모음 처리
  switch (vowelIndex) {
    case 8: // ㅗ
      switch (character) {
        case 'ᅡ': return String.fromCharCode(syllables + 9 * HANGUL_SYLLABLE_VOWEL_SPAN); // ㅘ
        case 'ᅢ': return String.fromCharCode(syllables + 10 * HANGUL_SYLLABLE_VOWEL_SPAN); // ㅙ
        case 'ᅵ': return String.fromCharCode(syllables + 11 * HANGUL_SYLLABLE_VOWEL_SPAN); // ㅚ
      }
      break;
    case 13: // ㅜ
      switch (character) {
        case 'ᅥ': return String.fromCharCode(syllables + 14 * HANGUL_SYLLABLE_VOWEL_SPAN); // ㅝ
        case 'ᅦ': return String.fromCharCode(syllables + 15 * HANGUL_SYLLABLE_VOWEL_SPAN); // ㅞ
        case 'ᅵ': return String.fromCharCode(syllables + 16 * HANGUL_SYLLABLE_VOWEL_SPAN); // ㅟ
      }
      break;
    case 18: // ㅡ
      switch (character) {
        case 'ᅵ': return String.fromCharCode(syllables + 19 * HANGUL_SYLLABLE_VOWEL_SPAN); // ㅢ
      }
      break;
  }
  
  return undefined;
}

/**
 * 받침 추가 처리 (완전한 복합 받침 지원)
 */
function appendBatchim(previous: string, pressedKey: string): string | undefined {
  if (!isHangulSyllable(previous) || !isHangulConsonant(pressedKey)) {
    return undefined;
  }
  
  const consonantIndex = jamoConsonantIndex(pressedKey);
  const consonantIndexMain = hangulSyllableToHangulConsonantIndex(previous);
  const vowelIndex = hangulSyllableToHangulVowelIndex(previous);
  const batchimIndex = hangulSyllableToHangulBatchimIndex(previous);
  
  const syllables = consonantIndexMain * HANGUL_SYLLABLE_CONSONANT_SPAN + 
    HANGUL_SYLLABLE_TABLE_START.codePointAt(0)! + 
    vowelIndex * HANGUL_SYLLABLE_VOWEL_SPAN;
  
  // 받침이 없는 경우 - 단순 받침 추가
  if (batchimIndex === 0) {
    const batchimMap: Record<number, number> = {
      0: 1,   // ㄱ
      1: 2,   // ㄲ
      2: 4,   // ㄴ
      3: 7,   // ㄷ
      5: 8,   // ㄹ
      6: 16,  // ㅁ
      7: 17,  // ㅂ
      9: 19,  // ㅅ
      10: 20, // ㅆ
      11: 21, // ㅇ
      12: 22, // ㅈ
      14: 23, // ㅊ
      15: 24, // ㅋ
      16: 25, // ㅌ
      17: 26, // ㅍ
      18: 27  // ㅎ
    };
    
    const newBatchimIndex = batchimMap[consonantIndex];
    if (newBatchimIndex) {
      return String.fromCharCode(syllables + newBatchimIndex);
    }
  } else {
    // 받침이 있는 경우 - 복합 받침 생성
    switch (batchimIndex) {
      case 1: // ㄱ
        if (consonantIndex === 9) { // ㅅ
          return String.fromCharCode(syllables + 3); // ㄳ
        }
        break;
        
      case 4: // ㄴ
        if (consonantIndex === 12) { // ㅈ
          return String.fromCharCode(syllables + 5); // ㄵ
        }
        if (consonantIndex === 18) { // ㅎ
          return String.fromCharCode(syllables + 6); // ㄶ
        }
        break;
        
      case 8: // ㄹ
        if (consonantIndex === 0) { // ㄱ
          return String.fromCharCode(syllables + 9); // ㄺ
        }
        if (consonantIndex === 6) { // ㅁ
          return String.fromCharCode(syllables + 10); // ㄻ
        }
        if (consonantIndex === 7) { // ㅂ
          return String.fromCharCode(syllables + 11); // ㄼ
        }
        if (consonantIndex === 9) { // ㅅ
          return String.fromCharCode(syllables + 12); // ㄽ
        }
        if (consonantIndex === 16) { // ㅌ
          return String.fromCharCode(syllables + 13); // ㄾ
        }
        if (consonantIndex === 17) { // ㅍ
          return String.fromCharCode(syllables + 14); // ㄿ
        }
        if (consonantIndex === 18) { // ㅎ
          return String.fromCharCode(syllables + 15); // ㅀ
        }
        break;
        
      case 17: // ㅂ
        if (consonantIndex === 9) { // ㅅ
          return String.fromCharCode(syllables + 18); // ㅄ
        }
        break;
    }
  }
  
  return undefined;
}

/**
 * 모음 삭제 처리
 */
function deleteOneVowel(previous: string): string {
  if (hasBatchim(previous) || !isHangulSyllable(previous)) {
    return previous;
  }
  
  const consonantIndex = hangulSyllableToHangulConsonantIndex(previous);
  const vowelIndex = hangulSyllableToHangulVowelIndex(previous);
  const syllables = consonantIndex * HANGUL_SYLLABLE_CONSONANT_SPAN + HANGUL_SYLLABLE_TABLE_START.codePointAt(0)!;
  
  // 복합 모음 분해
  switch (vowelIndex) {
    case 9: case 10: case 11: // ㅘ, ㅙ, ㅚ → ㅗ
      return String.fromCharCode(syllables + 8 * HANGUL_SYLLABLE_VOWEL_SPAN);
    case 14: case 15: case 16: // ㅝ, ㅞ, ㅟ → ㅜ
      return String.fromCharCode(syllables + 13 * HANGUL_SYLLABLE_VOWEL_SPAN);
    case 19: // ㅢ → ㅡ
      return String.fromCharCode(syllables + 18 * HANGUL_SYLLABLE_VOWEL_SPAN);
  }
  
  return hangulSyllableToFirstConsonantJamoText(previous);
}

/**
 * 받침 삭제 처리
 */
function deleteOneBatchim(previous: string): string {
  if (!hasBatchim(previous)) {
    return previous;
  }
  
  const consonantIndex = hangulSyllableToHangulConsonantIndex(previous);
  const vowelIndex = hangulSyllableToHangulVowelIndex(previous);
  const batchimIndex = hangulSyllableToHangulBatchimIndex(previous);
  
  const syllables = consonantIndex * HANGUL_SYLLABLE_CONSONANT_SPAN + 
    HANGUL_SYLLABLE_TABLE_START.codePointAt(0)! + 
    vowelIndex * HANGUL_SYLLABLE_VOWEL_SPAN;
  
  // 복합 받침 분해
  const simpleBatchims = [1, 2, 4, 7, 8, 16, 17, 19, 20, 21, 22, 23, 24, 25, 26, 27];
  
  if (simpleBatchims.includes(batchimIndex)) {
    return String.fromCharCode(syllables);
  }
  
  // 복합 받침의 경우 첫 번째 받침으로 변환
  const complexBatchimMap: Record<number, number> = {
    3: 1,   // ㄳ → ㄱ
    5: 4,   // ㄵ → ㄴ
    6: 4,   // ㄶ → ㄴ
    9: 8,   // ㄺ → ㄹ
    10: 8,  // ㄻ → ㄹ
    11: 8,  // ㄼ → ㄹ
    12: 8,  // ㄽ → ㄹ
    13: 8,  // ㄾ → ㄹ
    14: 8,  // ㄿ → ㄹ
    15: 8,  // ㅀ → ㄹ
    18: 17, // ㅄ → ㅂ
  };
  
  const newBatchimIndex = complexBatchimMap[batchimIndex];
  if (newBatchimIndex) {
    return String.fromCharCode(syllables + newBatchimIndex);
  }
  
  return String.fromCharCode(syllables);
}

// Helper functions
function jamoConsonantIndex(character: string): number {
  if (!isHangulConsonant(character)) return -1;
  
  const jamo = toJamo(character);
  return jamo.charCodeAt(0) - 'ᄀ'.codePointAt(0)!;
}

function hangulSyllableToHangulConsonantIndex(character: string): number {
  if (!isHangulSyllable(character)) return -1;
  
  const code = character.charCodeAt(0);
  return Math.floor((code - HANGUL_SYLLABLE_TABLE_START.codePointAt(0)!) / HANGUL_SYLLABLE_CONSONANT_SPAN);
}

function hangulBatchimIndexToJamoConsonant(index: number): string | undefined {
  const batchimToConsonantMap: Record<number, string> = {
    1: 'ㄱ', 2: 'ㄲ', 4: 'ㄴ', 7: 'ㄷ', 8: 'ㄹ', 16: 'ㅁ', 17: 'ㅂ',
    19: 'ㅅ', 20: 'ㅆ', 21: 'ㅇ', 22: 'ㅈ', 23: 'ㅊ', 24: 'ㅋ', 25: 'ㅌ', 26: 'ㅍ', 27: 'ㅎ'
  };
  
  return batchimToConsonantMap[index];
}

function hangulSyllableToFirstConsonantJamoText(character: string): string {
  const consonantIndex = hangulSyllableToHangulConsonantIndex(character);
  
  const consonants = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  
  return consonants[consonantIndex] || '';
}