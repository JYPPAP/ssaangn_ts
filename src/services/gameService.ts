import { validateWord } from '../utils/wordValidation';
import { hangulSyllableToJamoComponentsText, isHangulConsonant } from '../utils/hangul/core';
import {
  MAX_LETTERS,
  NUMBER_OF_GUESSES,
  EMOTE_MATCH,
  EMOTE_SIMILAR,
  EMOTE_MANY,
  EMOTE_EXISTS,
  EMOTE_OPPOSITE,
  EMOTE_NONE,
  DATA_MATCH,
  DATA_SIMILAR,
  DATA_MANY,
  DATA_EXISTS,
  DATA_OPPOSITE,
  DATA_NONE,
  DATA_COLOR,
  COLOR_MAYBE,
  PRACTICE_WORD_BACKUP,
  MAX_INVALID_WORDS
} from '../data/constants';
import type { GameEmote, GameBoardRow, WordDataRaw } from '../types';

export interface GuessResult {
  isValid: boolean;
  isWin: boolean;
  letterColors: string[];
  letterEmotes: GameEmote[];
  boardRow: GameBoardRow;
  errorMessage?: string;
  shouldChangeSecretWord?: boolean;
}

export interface GameAnalysisInput {
  currentGuess: string[];
  secretWordString: string;
  secretWordJamoSets: string[][];
  isPracticeGame: boolean;
  guessesRemaining: number;
  invalidWordCount: number;
  foundMatch: [boolean, boolean];
  manual: boolean;
}

export interface JamoStateCallbacks {
  countJamoComponentsInOtherJamoComponents: (setA: string, setB: string) => number;
  addToYesList: (letter: string, index: number) => void;
  addToNoList: (letter: string, index: number) => void;
  addToHotComboList: (combo: string, index: number, min: number, max: number) => void;
  addAllOthersToNoList: (jamoComponents: string, index: number) => void;
  addNonBatchimToNoList: (index: number) => void;
  isCharacterAllWrong: (character: string) => boolean;
  shadeKeyBoardDelayed: (letter: string, color: string, delay: number) => void;
}

export class GameService {
  private jamoCallbacks: JamoStateCallbacks;

  constructor(jamoCallbacks: JamoStateCallbacks) {
    this.jamoCallbacks = jamoCallbacks;
  }

  async analyzeGuess(input: GameAnalysisInput): Promise<GuessResult> {
    const {
      currentGuess,
      secretWordString,
      secretWordJamoSets,
      isPracticeGame,
      guessesRemaining,
      invalidWordCount,
      foundMatch,
      manual
    } = input;

    let guessString = '';
    let allWrong = true;

    // 현재 추측을 문자열로 변환하고 유효성 검사
    for (const val of currentGuess) {
      if (!this.jamoCallbacks.isCharacterAllWrong(val)) {
        allWrong = false;
      }
      guessString += val;
    }

    // 2글자가 입력되었는지 확인
    if (guessString.length !== MAX_LETTERS || isHangulConsonant(guessString[MAX_LETTERS - 1])) {
      return {
        isValid: false,
        isWin: false,
        letterColors: [],
        letterEmotes: [],
        boardRow: { letters: [], emotes: [] },
        errorMessage: '🐯 2개 글자를 입력하세요'
      };
    }

    // 단어 유효성 검사
    try {
      const validation = await validateWord(guessString, manual);
      if (!validation.isValid) {
        return {
          isValid: false,
          isWin: false,
          letterColors: [],
          letterEmotes: [],
          boardRow: { letters: [], emotes: [] },
          errorMessage: '🐯 옳은 단어를 입력하세요',
        };
      }
    } catch (error) {
      return {
        isValid: false,
        isWin: false,
        letterColors: [],
        letterEmotes: [],
        boardRow: { letters: [], emotes: [] },
        errorMessage: '🐯 옳은 단어를 입력하세요'
      };
    }

    // 모든 자모가 틀린 경우
    if (allWrong) {
      return {
        isValid: false,
        isWin: false,
        letterColors: [],
        letterEmotes: [],
        boardRow: { letters: [], emotes: [] },
        errorMessage: '🐯 자음과 모음들이 모두 틀려요'
      };
    }

    // 연습 게임 특별 처리
    let shouldChangeSecretWord = false;
    if (isPracticeGame && guessesRemaining === NUMBER_OF_GUESSES &&
        (currentGuess[0] === secretWordString[0] || currentGuess[1] === secretWordString[1])) {
      shouldChangeSecretWord = true;
    }

    const secretWord = Array.from(secretWordString);
    const shadeDelay = manual ? 700 : 0;

    let letterColor: string[] = [DATA_NONE[DATA_COLOR], DATA_NONE[DATA_COLOR]];
    let letterEmote: GameEmote[] = [EMOTE_NONE, EMOTE_NONE];

    // 각 글자의 자모 성분 분해
    const currentGuessJamoSets: string[][] = [];
    for (let i = 0; i < MAX_LETTERS; i++) {
      currentGuessJamoSets[i] = hangulSyllableToJamoComponentsText(currentGuess[i]).split('');
    }

    // 각 글자 위치별 분석
    const updatedFoundMatch = [...foundMatch] as [boolean, boolean];
    
    for (let i = 0; i < MAX_LETTERS; i++) {
      if (secretWord[i] === currentGuess[i]) {
        // 🥕 완전 일치
        letterColor[i] = DATA_MATCH[DATA_COLOR];
        letterEmote[i] = EMOTE_MATCH;

        for (let jamoChar = 0; jamoChar < currentGuessJamoSets[i].length; jamoChar++) {
          const letter = currentGuessJamoSets[i][jamoChar];
          this.jamoCallbacks.shadeKeyBoardDelayed(letter, DATA_MATCH[DATA_COLOR], shadeDelay);
          this.jamoCallbacks.addToYesList(letter, i);
        }

        this.jamoCallbacks.addAllOthersToNoList(currentGuessJamoSets[i].join(''), i);
        
        // foundMatch 업데이트
        updatedFoundMatch[i] = true;
      } else {
        const componentMatches = this.jamoCallbacks.countJamoComponentsInOtherJamoComponents(
          currentGuessJamoSets[i].join(''), 
          secretWordJamoSets[i].join('')
        );

        if (currentGuessJamoSets[i][0] === secretWordJamoSets[i][0] && componentMatches > 1) {
          // 🍄 첫 자음 일치 + 2개 이상 자모 일치
          letterColor[i] = DATA_SIMILAR[DATA_COLOR];
          letterEmote[i] = EMOTE_SIMILAR;

          for (let jamoChar = 0; jamoChar < currentGuessJamoSets[i].length; jamoChar++) {
            const shadeColor = (jamoChar === 0 || currentGuessJamoSets[i].length <= 2) ? 
                              DATA_MATCH[DATA_COLOR] : COLOR_MAYBE;
            const letter = currentGuessJamoSets[i][jamoChar];
            this.jamoCallbacks.shadeKeyBoardDelayed(letter, shadeColor, shadeDelay);
            if (shadeColor === DATA_MATCH[DATA_COLOR]) {
              this.jamoCallbacks.addToYesList(letter, i);
            }
          }

          this.jamoCallbacks.addToHotComboList(currentGuess[i], i, 2, 10);
          this.jamoCallbacks.addNonBatchimToNoList(i);
        } else if (componentMatches > 1) {
          // 🧄 2개 이상 자모 일치 (첫 자음 불일치)
          letterColor[i] = DATA_MANY[DATA_COLOR];
          letterEmote[i] = EMOTE_MANY;

          for (let jamoChar = 0; jamoChar < currentGuessJamoSets[i].length; jamoChar++) {
            const shadeColor = (currentGuessJamoSets[i].length <= 2) ? 
                              DATA_MATCH[DATA_COLOR] : COLOR_MAYBE;
            const letter = currentGuessJamoSets[i][jamoChar];
            this.jamoCallbacks.shadeKeyBoardDelayed(letter, shadeColor, shadeDelay);
            if (shadeColor === DATA_MATCH[DATA_COLOR]) {
              this.jamoCallbacks.addToYesList(letter, i);
            }
          }

          this.jamoCallbacks.addToHotComboList(currentGuess[i], i, 2, 10);
        } else if (componentMatches === 1) {
          // 🍆 1개 자모 일치 - 개별 자모별로 정확한 상태 판정
          letterColor[i] = DATA_EXISTS[DATA_COLOR];
          letterEmote[i] = EMOTE_EXISTS;

          // 정답에서 이미 사용된 자모들을 추적 (중복 매칭 방지)
          const secretJamosUsed = new Array(secretWordJamoSets[i].length).fill(false);
          let matchedJamoCount = 0;

          // 첫 번째 패스: 정확한 위치 매칭 우선 처리
          for (let jamoChar = 0; jamoChar < currentGuessJamoSets[i].length; jamoChar++) {
            const currentJamo = currentGuessJamoSets[i][jamoChar];
            
            // 같은 위치에서 정확한 매칭 확인
            if (jamoChar < secretWordJamoSets[i].length && 
                currentJamo === secretWordJamoSets[i][jamoChar] && 
                !secretJamosUsed[jamoChar]) {
              
              secretJamosUsed[jamoChar] = true;
              matchedJamoCount++;
              
              // 정확한 위치 매칭 - 더 높은 확실성
              this.jamoCallbacks.shadeKeyBoardDelayed(currentJamo, COLOR_MAYBE, shadeDelay);
            }
          }

          // 두 번째 패스: 나머지 자모들에 대한 존재 여부 확인
          for (let jamoChar = 0; jamoChar < currentGuessJamoSets[i].length; jamoChar++) {
            const currentJamo = currentGuessJamoSets[i][jamoChar];
            
            // 이미 정확한 위치에서 매칭된 경우 스킵
            if (jamoChar < secretWordJamoSets[i].length && 
                currentJamo === secretWordJamoSets[i][jamoChar]) {
              continue;
            }
            
            // 다른 위치에서 이 자모가 존재하는지 확인
            let foundInOtherPosition = false;
            for (let secretPos = 0; secretPos < secretWordJamoSets[i].length; secretPos++) {
              if (!secretJamosUsed[secretPos] && 
                  currentJamo === secretWordJamoSets[i][secretPos]) {
                
                secretJamosUsed[secretPos] = true;
                matchedJamoCount++;
                foundInOtherPosition = true;
                
                // 다른 위치에서 발견 - 일반적인 존재 표시
                this.jamoCallbacks.shadeKeyBoardDelayed(currentJamo, COLOR_MAYBE, shadeDelay);
                break;
              }
            }
            
            if (!foundInOtherPosition) {
              // 이 자모는 정답에 없음 - NO 리스트에 추가하고 회색 처리
              this.jamoCallbacks.shadeKeyBoardDelayed(currentJamo, DATA_NONE[DATA_COLOR], shadeDelay);
              this.jamoCallbacks.addToNoList(currentJamo, i);
            }
          }

          // Hot Combo 정보를 더 정확하게 설정 (실제 매칭된 개수 기반)
          this.jamoCallbacks.addToHotComboList(currentGuess[i], i, Math.max(1, matchedJamoCount), matchedJamoCount);
        } else {
          // 현재 위치에서 일치하는 자모가 없는 경우 반대편 확인
          const other = 1 - i;
          const foundMatchInOther = this.jamoCallbacks.countJamoComponentsInOtherJamoComponents(
            currentGuessJamoSets[i].join(''), 
            secretWordJamoSets[other].join('')
          ) > 0;

          if (foundMatchInOther) {
            // 🍌 반대쪽 글자에서 자모 일치
            letterColor[i] = DATA_OPPOSITE[DATA_COLOR];
            letterEmote[i] = EMOTE_OPPOSITE;

            for (let jamoChar = 0; jamoChar < currentGuessJamoSets[i].length; jamoChar++) {
              const letter = currentGuessJamoSets[i][jamoChar];
              this.jamoCallbacks.shadeKeyBoardDelayed(letter, COLOR_MAYBE, shadeDelay);
              this.jamoCallbacks.addToNoList(letter, i);
            }

            this.jamoCallbacks.addToHotComboList(currentGuess[i], other, 1, 10);
          } else {
            // 🍎 전혀 일치하지 않음
            letterColor[i] = DATA_NONE[DATA_COLOR];
            letterEmote[i] = EMOTE_NONE;

            for (let jamoChar = 0; jamoChar < currentGuessJamoSets[i].length; jamoChar++) {
              const letter = currentGuessJamoSets[i][jamoChar];
              this.jamoCallbacks.shadeKeyBoardDelayed(letter, DATA_NONE[DATA_COLOR], shadeDelay);
              this.jamoCallbacks.addToNoList(letter, 0);
              this.jamoCallbacks.addToNoList(letter, 1);
            }
          }
        }
      }
    }

    // 보드 행 생성
    const boardRow: GameBoardRow = {
      letters: [...currentGuess],
      emotes: [...letterEmote] as any
    };

    // 승리 조건 확인
    const isWin = guessString === secretWordString;

    console.log('게임 분석:', {
      guessString,
      secretWordString,
      isWin,
      letterEmote
    });

    return {
      isValid: true,
      isWin,
      letterColors: letterColor,
      letterEmotes: letterEmote,
      boardRow,
      shouldChangeSecretWord
    };
  }

  validateInput(currentGuess: string[]): { isValid: boolean; errorMessage?: string } {
    const guessString = currentGuess.join('');
    
    if (guessString.length !== MAX_LETTERS) {
      return {
        isValid: false,
        errorMessage: '🐯 2개 글자를 입력하세요'
      };
    }

    if (isHangulConsonant(guessString[MAX_LETTERS - 1])) {
      return {
        isValid: false,
        errorMessage: '🐯 2개 글자를 입력하세요'
      };
    }

    return { isValid: true };
  }

  async validateWordExists(guessString: string, manual: boolean): Promise<{ isValid: boolean; errorMessage?: string }> {
    try {
      const validation = await validateWord(guessString, manual);
      if (!validation.isValid) {
        return {
          isValid: false,
          errorMessage: '🐯 옳은 단어를 입력하세요'
        };
      }
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        errorMessage: '🐯 옳은 단어를 입력하세요'
      };
    }
  }

  checkGameEnd(isWin: boolean, guessesRemaining: number): { gameEnd: boolean; won: boolean } {
    if (isWin) {
      return { gameEnd: true, won: true };
    } else if (guessesRemaining <= 1) {
      return { gameEnd: true, won: false };
    }
    return { gameEnd: false, won: false };
  }
}