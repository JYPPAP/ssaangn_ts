import {
  JAMO_CONSONANT_START,
  JAMO_CONSONANT_END,
  JAMO_VOWEL_START,
  JAMO_VOWEL_END,
  HANGUL_SYLLABLE_TABLE_START,
  HANGUL_SYLLABLE_TABLE_END,
  QWERTY_TO_HANGUL_MAP
} from './constants';

/**
 * 자모를 Jamo 유니코드로 변환
 */
export function toJamo(character: string): string {
  if (character.length !== 1) return character;

  const jamoMap: Record<string, string> = {
    'ㄱ': 'ᄀ', 'ㄲ': 'ᄁ', 'ㄴ': 'ᄂ', 'ㄷ': 'ᄃ', 'ㄸ': 'ᄄ', 'ㄹ': 'ᄅ',
    'ㅁ': 'ᄆ', 'ㅂ': 'ᄇ', 'ㅃ': 'ᄈ', 'ㅅ': 'ᄉ', 'ㅆ': 'ᄊ', 'ㅇ': 'ᄋ',
    'ㅈ': 'ᄌ', 'ㅉ': 'ᄍ', 'ㅊ': 'ᄎ', 'ㅋ': 'ᄏ', 'ㅌ': 'ᄐ', 'ㅍ': 'ᄑ', 'ㅎ': 'ᄒ',
    'ㅏ': 'ᅡ', 'ㅐ': 'ᅢ', 'ㅑ': 'ᅣ', 'ㅒ': 'ᅤ', 'ㅓ': 'ᅥ', 'ㅔ': 'ᅦ',
    'ㅕ': 'ᅧ', 'ㅖ': 'ᅨ', 'ㅗ': 'ᅩ', 'ㅛ': 'ᅭ', 'ㅜ': 'ᅮ', 'ㅠ': 'ᅲ',
    'ㅡ': 'ᅳ', 'ㅣ': 'ᅵ', 'ㅘ': 'ᅪ', 'ㅙ': 'ᅫ', 'ㅚ': 'ᅬ', 'ㅝ': 'ᅯ',
    'ㅞ': 'ᅰ', 'ㅟ': 'ᅱ', 'ㅢ': 'ᅴ'
  };

  return jamoMap[character] || character;
}

/**
 * 한글 자음인지 확인
 */
export function isHangulConsonant(character: string): boolean {
  if (character.length !== 1) return false;
  
  const jamo = toJamo(character);
  return jamo >= JAMO_CONSONANT_START && jamo <= JAMO_CONSONANT_END;
}

/**
 * 한글 모음인지 확인
 */
export function isHangulVowel(character: string): boolean {
  if (character.length !== 1) return false;
  
  const jamo = toJamo(character);
  return jamo >= JAMO_VOWEL_START && jamo <= JAMO_VOWEL_END;
}

/**
 * 한글 음절인지 확인
 */
export function isHangulSyllable(character: string): boolean {
  if (character.length !== 1) return false;
  
  return character >= HANGUL_SYLLABLE_TABLE_START && character <= HANGUL_SYLLABLE_TABLE_END;
}

/**
 * 받침이 있는지 확인
 */
export function hasBatchim(character: string): boolean {
  if (!isHangulSyllable(character)) return false;
  
  const batchimIndex = hangulSyllableToHangulBatchimIndex(character);
  return batchimIndex !== 0; // BATCHIM_INDEX_NONE은 0
}

/**
 * QWERTY 키를 한글 자모로 변환
 */
export function keyboardKeyToJamoText(pressedKey: string): string {
  if (pressedKey.length !== 1) return pressedKey;
  
  return QWERTY_TO_HANGUL_MAP[pressedKey] || pressedKey;
}

/**
 * 한글 음절의 받침 인덱스 구하기
 */
export function hangulSyllableToHangulBatchimIndex(character: string): number {
  if (!isHangulSyllable(character)) return -1;
  
  const code = character.charCodeAt(0);
  const HANGUL_SYLLABLE_VOWEL_SPAN = 28; // '개'.codePointAt(0)! - '가'.codePointAt(0)!
  return (code - HANGUL_SYLLABLE_TABLE_START.codePointAt(0)!) % HANGUL_SYLLABLE_VOWEL_SPAN;
}

/**
 * 한글 음절의 모음 인덱스 구하기
 */
export function hangulSyllableToHangulVowelIndex(character: string): number {
  if (!isHangulSyllable(character)) return -1;
  
  const code = character.charCodeAt(0);
  const consonantIndex = hangulSyllableToHangulConsonantIndex(character);
  const HANGUL_SYLLABLE_CONSONANT_SPAN = 588; // '까'.codePointAt(0)! - '가'.codePointAt(0)!
  const HANGUL_SYLLABLE_VOWEL_SPAN = 28;
  
  return Math.floor((code - HANGUL_SYLLABLE_TABLE_START.codePointAt(0)! - (consonantIndex * HANGUL_SYLLABLE_CONSONANT_SPAN)) / HANGUL_SYLLABLE_VOWEL_SPAN);
}

/**
 * 한글 음절의 자음 인덱스 구하기
 */
function hangulSyllableToHangulConsonantIndex(character: string): number {
  if (!isHangulSyllable(character)) return -1;
  
  const code = character.charCodeAt(0);
  const HANGUL_SYLLABLE_CONSONANT_SPAN = 588;
  return Math.floor((code - HANGUL_SYLLABLE_TABLE_START.codePointAt(0)!) / HANGUL_SYLLABLE_CONSONANT_SPAN);
}

/**
 * 한글 음절을 자모 성분으로 분해하는 핵심 함수
 * 예: '간' → 'ㄱㅏㄴ', '값' → 'ㄱㅏㅂㅅ'
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
 * 첫 자음을 자모 텍스트로 변환
 */
function hangulSyllableToFirstConsonantJamoText(character: string): string {
  const index = hangulSyllableToHangulConsonantIndex(character);
  if (index === -1) return '';

  const consonants = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  return consonants[index] || '';
}

/**
 * 모음 인덱스를 자모 텍스트로 변환
 */
function jamoVowelIndexToJamoText(index: number): string {
  const vowels = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
  return vowels[index] || '';
}

/**
 * 받침 인덱스를 자모 텍스트로 변환 (복합 받침 포함)
 */
function jamoBatchimIndexToJamoText(index: number): string {
  if (index === 0) return '';
  
  const batchims: Record<number, string> = {
    1: 'ㄱ', 2: 'ㄲ', 3: 'ㄳ', 4: 'ㄴ', 5: 'ㄵ', 6: 'ㄶ', 7: 'ㄷ',
    8: 'ㄹ', 9: 'ㄺ', 10: 'ㄻ', 11: 'ㄼ', 12: 'ㄽ', 13: 'ㄾ', 14: 'ㄿ', 15: 'ㅀ',
    16: 'ㅁ', 17: 'ㅂ', 18: 'ㅄ', 19: 'ㅅ', 20: 'ㅆ', 21: 'ㅇ', 22: 'ㅈ',
    23: 'ㅊ', 24: 'ㅋ', 25: 'ㅌ', 26: 'ㅍ', 27: 'ㅎ'
  };
  
  const batchim = batchims[index];
  if (!batchim) return '';
  
  // 복합 받침은 개별 자음으로 분해
  const complexBatchimMap: Record<string, string> = {
    'ㄳ': 'ㄱㅅ', 'ㄵ': 'ㄴㅈ', 'ㄶ': 'ㄴㅎ', 'ㄺ': 'ㄹㄱ', 'ㄻ': 'ㄹㅁ',
    'ㄼ': 'ㄹㅂ', 'ㄽ': 'ㄹㅅ', 'ㄾ': 'ㄹㅌ', 'ㄿ': 'ㄹㅍ', 'ㅀ': 'ㄹㅎ', 'ㅄ': 'ㅂㅅ'
  };
  
  return complexBatchimMap[batchim] || batchim;
}