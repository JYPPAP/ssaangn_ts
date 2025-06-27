// 한글 처리 관련 타입 정의

// 한글 자모 문자 타입
export type HangulConsonant = 'ㄱ' | 'ㄲ' | 'ㄴ' | 'ㄷ' | 'ㄸ' | 'ㄹ' | 'ㅁ' | 'ㅂ' | 'ㅃ' | 'ㅅ' | 'ㅆ' | 'ㅇ' | 'ㅈ' | 'ㅉ' | 'ㅊ' | 'ㅋ' | 'ㅌ' | 'ㅍ' | 'ㅎ';

export type HangulVowel = 'ㅏ' | 'ㅐ' | 'ㅑ' | 'ㅒ' | 'ㅓ' | 'ㅔ' | 'ㅕ' | 'ㅖ' | 'ㅗ' | 'ㅛ' | 'ㅜ' | 'ㅠ' | 'ㅡ' | 'ㅣ' | 'ㅘ' | 'ㅙ' | 'ㅚ' | 'ㅝ' | 'ㅞ' | 'ㅟ' | 'ㅢ';

export type HangulJamo = HangulConsonant | HangulVowel;

// 한글 음절 구성 요소
export interface HangulSyllableComponents {
  initialConsonant: HangulConsonant;
  vowel: HangulVowel;
  finalConsonant?: HangulConsonant;
}

// 한글 입력 처리 결과
export interface HangulInputResult {
  text: string;
  isComplete: boolean;
  syllableComponents?: HangulSyllableComponents;
}