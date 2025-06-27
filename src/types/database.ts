// 기본 단어 데이터 구조
export interface WordDataRaw {
  id: number;
  word: string;
  meanings: string | null; // JSON 문자열 형태로 저장된 의미들 (null 허용)
}

// 데이터베이스 관련 타입 정의
export interface DatabaseConfig {
  // 향후 데이터베이스 연결 설정
}

// 단어 검색/조회 관련 인터페이스
export interface WordRepository {
  getRandomWord(): Promise<WordDataRaw>;
  getWordById(id: number): Promise<WordDataRaw | null>;
  getAllWords(): Promise<WordDataRaw[]>;
  searchWords(query: string): Promise<WordDataRaw[]>;
}

// 의미 파싱 유틸리티 함수 타입
export type MeaningsParser = (meaningsJson: string | null) => string[];
export type MeaningsFormatter = (meanings: string[]) => string;