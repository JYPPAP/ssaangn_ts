// 한글 처리 유틸리티 메인 익스포트

// 상수
export {
  HANGUL_CONSONANT_COMPONENTS,
  HANGUL_VOWEL_COMPONENTS,
  HANGUL_CONSONANT_VOWEL_LIST,
  HANGUL_VOWEL_PAIRING,
  HANGUL_CONSONANT_PAIRING,
  QWERTY_TO_HANGUL_MAP
} from './constants';

// 타입
export type {
  HangulConsonant,
  HangulVowel,
  HangulJamo,
  HangulSyllableComponents,
  HangulInputResult
} from './types';

// 핵심 기능
export {
  toJamo,
  isHangulConsonant,
  isHangulVowel,
  isHangulSyllable,
  hasBatchim,
  keyboardKeyToJamoText,
  hangulSyllableToHangulVowelIndex,
  hangulSyllableToHangulBatchimIndex
} from './core';

// 입력 처리
export {
  appendHangul,
  deleteOneJamo
} from './input';

// 분석 기능
export {
  hangulSyllableToJamoComponentsText,
  getUnpairableVowels,
  areUnpairableVowels,
  getUnpairableConsonants,
  areUnpairableConsonants
} from './analysis';