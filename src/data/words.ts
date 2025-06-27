import { WordDataRaw } from '../types/database';

/**
 * 기본 단어 데이터
 * 향후 실제 데이터베이스로 대체될 예정
 */
export const INITIAL_WORDS: WordDataRaw[] = [
  { id: 1, word: "사과", meanings: '["빨간색 과일", "실수나 잘못을 의미하는 말"]' },
  { id: 2, word: "나무", meanings: '["높은 식물", "목재의 원료"]' },
  { id: 3, word: "하늘", meanings: '["구름이 떠있는 공간", "날씨와 관련된 영역"]' },
  { id: 4, word: "바다", meanings: '["넓은 물의 공간", "소금물로 이루어진 자연 환경"]' },
  { id: 5, word: "집", meanings: '["사람이 사는 곳", "가정이나 가족을 의미"]' },
  { id: 6, word: "학교", meanings: '["공부하는 곳", "교육 기관"]' },
  { id: 7, word: "친구", meanings: '["가까운 사람", "동반자"]' },
  { id: 8, word: "가족", meanings: '["혈연관계의 사람들", "함께 사는 사람들"]' },
  { id: 9, word: "음식", meanings: '["먹을 수 있는 것", "요리된 것"]' },
  { id: 10, word: "책", meanings: '["글이 적힌 종이를 엮은 것", "지식을 담은 매체"]' },
  { id: 11, word: "컴퓨터", meanings: '["전자계산기", "디지털 기기"]' },
  { id: 12, word: "전화", meanings: '["음성 통화 기기", "연락하는 행위"]' },
  { id: 13, word: "자동차", meanings: '["바퀴가 달린 운송수단", "엔진으로 움직이는 차량"]' },
  { id: 14, word: "비행기", meanings: '["하늘을 나는 교통수단", "항공기"]' },
  { id: 15, word: "기차", meanings: '["철로를 달리는 교통수단", "열차"]' },
];

/**
 * 의미 파싱 함수
 */
export function parseMeanings(meaningsJson: string | null): string[] {
  if (!meaningsJson) return [];
  
  try {
    return JSON.parse(meaningsJson);
  } catch (error) {
    console.warn('Failed to parse meanings JSON:', error);
    return [];
  }
}

/**
 * 표시용 의미 포맷팅
 */
export function formatMeaningsForDisplay(meanings: string[]): string {
  if (meanings.length === 0) return '';
  if (meanings.length === 1) return meanings[0];
  
  return meanings.map((meaning, index) => `${index + 1}. ${meaning}`).join('\n');
}

/**
 * 랜덤 단어 가져오기
 */
export function getRandomWord(): WordDataRaw {
  const randomIndex = Math.floor(Math.random() * INITIAL_WORDS.length);
  return INITIAL_WORDS[randomIndex];
}

/**
 * ID로 단어 찾기
 */
export function getWordById(id: number): WordDataRaw | null {
  return INITIAL_WORDS.find(word => word.id === id) || null;
}

/**
 * 모든 단어 가져오기
 */
export function getAllWords(): WordDataRaw[] {
  return INITIAL_WORDS;
}

/**
 * 단어 검색
 */
export function searchWords(query: string): WordDataRaw[] {
  return INITIAL_WORDS.filter(word => 
    word.word.includes(query) || 
    (word.meanings && word.meanings.includes(query))
  );
}