import { WordDataRaw, WordRepository, MeaningsParser, MeaningsFormatter } from '../types/database';
import { WordData } from '../types';
import { 
  INITIAL_WORDS, 
  getRandomWord as getRawRandomWord,
  getWordById as getRawWordById,
  getAllWords as getRawAllWords,
  searchWords as getRawSearchWords,
  parseMeanings,
  formatMeaningsForDisplay
} from './words';

/**
 * 단어 데이터베이스 관리 클래스
 */
export class WordDatabase implements WordRepository {
  private words: WordDataRaw[] = INITIAL_WORDS;

  /**
   * 랜덤 단어 가져오기
   */
  async getRandomWord(): Promise<WordDataRaw> {
    return getRawRandomWord();
  }

  /**
   * ID로 단어 찾기
   */
  async getWordById(id: number): Promise<WordDataRaw | null> {
    return getRawWordById(id);
  }

  /**
   * 모든 단어 가져오기
   */
  async getAllWords(): Promise<WordDataRaw[]> {
    return getRawAllWords();
  }

  /**
   * 단어 검색
   */
  async searchWords(query: string): Promise<WordDataRaw[]> {
    return getRawSearchWords(query);
  }

  /**
   * 새 단어 추가
   */
  async addWord(word: string, meanings: string[] = []): Promise<WordDataRaw> {
    const newId = Math.max(...this.words.map(w => w.id)) + 1;
    const meaningJson = meanings.length > 0 ? JSON.stringify(meanings) : null;
    
    const newWord: WordDataRaw = {
      id: newId,
      word,
      meanings: meaningJson
    };
    
    this.words.push(newWord);
    return newWord;
  }

  /**
   * 단어 업데이트
   */
  async updateWord(id: number, word?: string, meanings?: string[]): Promise<WordDataRaw | null> {
    const existingWord = this.words.find(w => w.id === id);
    if (!existingWord) return null;

    if (word !== undefined) {
      existingWord.word = word;
    }
    
    if (meanings !== undefined) {
      existingWord.meanings = meanings.length > 0 ? JSON.stringify(meanings) : null;
    }

    return existingWord;
  }

  /**
   * 단어 삭제
   */
  async deleteWord(id: number): Promise<boolean> {
    const index = this.words.findIndex(w => w.id === id);
    if (index === -1) return false;

    this.words.splice(index, 1);
    return true;
  }
}

/**
 * 단어 데이터베이스 싱글톤 인스턴스
 */
export const wordDatabase = new WordDatabase();

/**
 * 원시 단어 데이터를 처리된 형태로 변환
 */
export function convertRawWordData(rawWord: WordDataRaw): WordData {
  return {
    id: rawWord.id,
    word: rawWord.word,
    meanings: parseMeanings(rawWord.meanings)
  };
}

/**
 * 의미 파싱 함수 (재내보내기)
 */
export const meaningsParseFn: MeaningsParser = parseMeanings;

/**
 * 의미 포맷팅 함수 (재내보내기)
 */
export const meaningsFormatFn: MeaningsFormatter = formatMeaningsForDisplay;