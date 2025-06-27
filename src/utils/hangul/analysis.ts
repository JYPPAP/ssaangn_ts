import {
  isHangulSyllable,
  hangulSyllableToHangulVowelIndex,
  hangulSyllableToHangulBatchimIndex
} from './core';
import {
  HANGUL_CONSONANT_COMPONENTS,
  HANGUL_VOWEL_COMPONENTS,
  HANGUL_VOWEL_PAIRING,
  HANGUL_CONSONANT_PAIRING
} from './constants';

/**
 * 한글 음절을 자모 구성 요소로 분해
 */
export function hangulSyllableToJamoComponentsText(character: string): string {
  if (!isHangulSyllable(character)) {
    return character;
  }
  
  let result = hangulSyllableToFirstConsonantJamoText(character);
  
  const vowelIndex = hangulSyllableToHangulVowelIndex(character);
  result += jamoVowelIndexToJamoText(vowelIndex);
  
  const batchimIndex = hangulSyllableToHangulBatchimIndex(character);
  result += jamoBatchimIndexToJamoText(batchimIndex);
  
  return result;
}

/**
 * 주어진 모음과 결합할 수 없는 모음들 반환
 */
export function getUnpairableVowels(vowel: string): string[] {
  const unpairable: string[] = [];
  if (vowel.length !== 1) {
    return unpairable;
  }
  
  const indexA = vowelToPairingIndex(vowel);
  if (indexA < 0) {
    return unpairable;
  }
  
  for (let i = 0; i < HANGUL_VOWEL_COMPONENTS.length; i++) {
    if (HANGUL_VOWEL_COMPONENTS[i] === vowel) {
      continue;
    }
    
    const indexB = vowelToPairingIndex(HANGUL_VOWEL_COMPONENTS[i]);
    if (indexB < 0) {
      continue;
    }
    
    if (HANGUL_VOWEL_PAIRING[indexA][indexB] === 0) {
      unpairable.push(HANGUL_VOWEL_COMPONENTS[i]);
    }
  }
  
  return unpairable;
}

/**
 * 두 모음이 결합할 수 없는지 확인
 */
export function areUnpairableVowels(vowelA: string, vowelB: string): boolean {
  if (vowelA.length !== 1 || vowelB.length !== 1 || vowelA === vowelB) {
    return false;
  }
  
  const indexA = vowelToPairingIndex(vowelA);
  const indexB = vowelToPairingIndex(vowelB);
  
  if (indexA < 0 || indexB < 0) {
    return false;
  }
  
  return HANGUL_VOWEL_PAIRING[indexA][indexB] === 0;
}

/**
 * 주어진 자음과 결합할 수 없는 자음들 반환
 */
export function getUnpairableConsonants(consonant: string): string[] {
  const unpairable: string[] = [];
  if (consonant.length !== 1) {
    return unpairable;
  }
  
  const indexA = consonantToPairingIndex(consonant);
  if (indexA < 0) {
    return unpairable;
  }
  
  for (let i = 0; i < HANGUL_CONSONANT_COMPONENTS.length; i++) {
    const indexB = consonantToPairingIndex(HANGUL_CONSONANT_COMPONENTS[i]);
    if (indexB < 0) {
      continue;
    }
    
    if (HANGUL_CONSONANT_PAIRING[indexA][indexB] === 0) {
      unpairable.push(HANGUL_CONSONANT_COMPONENTS[i]);
    }
  }
  
  return unpairable;
}

/**
 * 두 자음이 결합할 수 없는지 확인
 */
export function areUnpairableConsonants(consonantA: string, consonantB: string): boolean {
  if (consonantA.length !== 1 || consonantB.length !== 1 || consonantA === consonantB) {
    return false;
  }
  
  const indexA = consonantToPairingIndex(consonantA);
  const indexB = consonantToPairingIndex(consonantB);
  
  if (indexA < 0 || indexB < 0) {
    return false;
  }
  
  return HANGUL_CONSONANT_PAIRING[indexA][indexB] === 0;
}

// Helper functions
function hangulSyllableToFirstConsonantJamoText(character: string): string {
  const consonantIndex = hangulSyllableToHangulConsonantIndex(character);
  const consonants = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  return consonants[consonantIndex] || '';
}

function hangulSyllableToHangulConsonantIndex(character: string): number {
  if (!isHangulSyllable(character)) return -1;
  
  const code = character.charCodeAt(0);
  const HANGUL_SYLLABLE_CONSONANT_SPAN = 588;
  return Math.floor((code - '가'.codePointAt(0)!) / HANGUL_SYLLABLE_CONSONANT_SPAN);
}

function jamoVowelIndexToJamoText(index: number): string {
  const vowelTexts = [
    'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅗㅏ', 'ㅗㅐ', 'ㅗㅣ',
    'ㅛ', 'ㅜ', 'ㅜㅓ', 'ㅜㅔ', 'ㅜㅣ', 'ㅠ', 'ㅡ', 'ㅡㅣ', 'ㅣ'
  ];
  return vowelTexts[index] || '';
}

function jamoBatchimIndexToJamoText(index: number): string {
  if (index === 0) return '';
  
  const batchimTexts: Record<number, string> = {
    1: 'ㄱ', 2: 'ㄲ', 3: 'ㄱㅅ', 4: 'ㄴ', 5: 'ㄴㅈ', 6: 'ㄴㅎ', 7: 'ㄷ',
    8: 'ㄹ', 9: 'ㄹㄱ', 10: 'ㄹㅁ', 11: 'ㄹㅂ', 12: 'ㄹㅅ', 13: 'ㄹㅌ', 14: 'ㄹㅍ', 15: 'ㄹㅎ',
    16: 'ㅁ', 17: 'ㅂ', 18: 'ㅂㅅ', 19: 'ㅅ', 20: 'ㅆ', 21: 'ㅇ', 22: 'ㅈ',
    23: 'ㅊ', 24: 'ㅋ', 25: 'ㅌ', 26: 'ㅍ', 27: 'ㅎ'
  };
  
  return batchimTexts[index] || '';
}

function vowelToPairingIndex(vowel: string): number {
  const vowelMap: Record<string, number> = {
    'ㅏ': 0, 'ㅐ': 1, 'ㅑ': 2, 'ㅒ': 3, 'ㅓ': 4, 'ㅔ': 5, 'ㅕ': 6, 'ㅖ': 7,
    'ㅗ': 8, 'ㅛ': 9, 'ㅜ': 10, 'ㅠ': 11, 'ㅡ': 12, 'ㅣ': 13
  };
  return vowelMap[vowel] ?? -1;
}

function consonantToPairingIndex(consonant: string): number {
  const consonantMap: Record<string, number> = {
    ' ': 0, 'ㄱ': 1, 'ㄲ': 2, 'ㄴ': 3, 'ㄷ': 4, 'ㄸ': 5, 'ㄹ': 6, 'ㅁ': 7, 'ㅂ': 8, 'ㅃ': 9,
    'ㅅ': 10, 'ㅆ': 11, 'ㅇ': 12, 'ㅈ': 13, 'ㅉ': 14, 'ㅊ': 15, 'ㅋ': 16, 'ㅌ': 17, 'ㅍ': 18, 'ㅎ': 19
  };
  return consonantMap[consonant] ?? -1;
}