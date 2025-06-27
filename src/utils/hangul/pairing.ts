import {
  HANGUL_CONSONANT_COMPONENTS,
  HANGUL_VOWEL_COMPONENTS,
  HANGUL_VOWEL_PAIRING,
  HANGUL_CONSONANT_PAIRING
} from './constants';

/**
 * 모음을 pairing 인덱스로 변환
 */
function vowelToPairingIndex(vowel: string): number {
  if (vowel.length !== 1) return -1;

  const vowelMap: Record<string, number> = {
    'ㅏ': 0, 'ㅐ': 1, 'ㅑ': 2, 'ㅒ': 3, 'ㅓ': 4, 'ㅔ': 5,
    'ㅕ': 6, 'ㅖ': 7, 'ㅗ': 8, 'ㅛ': 9, 'ㅜ': 10, 'ㅠ': 11,
    'ㅡ': 12, 'ㅣ': 13
  };

  return vowelMap[vowel] ?? -1;
}

/**
 * 자음을 pairing 인덱스로 변환
 */
function consonantToPairingIndex(consonant: string): number {
  if (consonant.length !== 1) return -1;

  const consonantMap: Record<string, number> = {
    ' ': 0, 'ㄱ': 1, 'ㄲ': 2, 'ㄴ': 3, 'ㄷ': 4, 'ㄸ': 5,
    'ㄹ': 6, 'ㅁ': 7, 'ㅂ': 8, 'ㅃ': 9, 'ㅅ': 10, 'ㅆ': 11,
    'ㅇ': 12, 'ㅈ': 13, 'ㅉ': 14, 'ㅊ': 15, 'ㅋ': 16, 'ㅌ': 17,
    'ㅍ': 18, 'ㅎ': 19
  };

  return consonantMap[consonant] ?? -1;
}

/**
 * 지정된 모음과 결합할 수 없는 모음들의 목록을 반환
 */
export function getUnpairableVowels(vowel: string): string[] {
  const unpairable: string[] = [];
  
  if (vowel.length !== 1) return unpairable;

  const indexA = vowelToPairingIndex(vowel);
  if (indexA < 0) return unpairable;

  for (let i = 0; i < HANGUL_VOWEL_COMPONENTS.length; i++) {
    const currentVowel = HANGUL_VOWEL_COMPONENTS[i];
    
    if (currentVowel === vowel) continue;

    const indexB = vowelToPairingIndex(currentVowel);
    if (indexB < 0) continue;

    // pairing 매트릭스에서 0이면 결합 불가
    if (HANGUL_VOWEL_PAIRING[indexA][indexB] === 0) {
      unpairable.push(currentVowel);
    }
  }

  return unpairable;
}

/**
 * 두 모음이 결합 불가능한지 확인
 */
export function areUnpairableVowels(vowelA: string, vowelB: string): boolean {
  if (vowelA.length !== 1 || vowelB.length !== 1) return false;
  if (vowelA === vowelB) return false;

  const indexA = vowelToPairingIndex(vowelA);
  const indexB = vowelToPairingIndex(vowelB);
  
  if (indexA < 0 || indexB < 0) return false;

  return HANGUL_VOWEL_PAIRING[indexA][indexB] === 0;
}

/**
 * 지정된 자음과 결합할 수 없는 자음들의 목록을 반환
 */
export function getUnpairableConsonants(consonant: string): string[] {
  const unpairable: string[] = [];
  
  if (consonant.length !== 1) return unpairable;

  const indexA = consonantToPairingIndex(consonant);
  if (indexA < 0) return unpairable;

  for (let i = 0; i < HANGUL_CONSONANT_COMPONENTS.length; i++) {
    const currentConsonant = HANGUL_CONSONANT_COMPONENTS[i];
    
    const indexB = consonantToPairingIndex(currentConsonant);
    if (indexB < 0) continue;

    // pairing 매트릭스에서 0이면 결합 불가
    if (HANGUL_CONSONANT_PAIRING[indexA][indexB] === 0) {
      unpairable.push(currentConsonant);
    }
  }

  return unpairable;
}

/**
 * 두 자음이 결합 불가능한지 확인
 */
export function areUnpairableConsonants(consonantA: string, consonantB: string): boolean {
  if (consonantA.length !== 1 || consonantB.length !== 1) return false;
  if (consonantA === consonantB) return false;

  const indexA = consonantToPairingIndex(consonantA);
  const indexB = consonantToPairingIndex(consonantB);
  
  if (indexA < 0 || indexB < 0) return false;

  return HANGUL_CONSONANT_PAIRING[indexA][indexB] === 0;
}