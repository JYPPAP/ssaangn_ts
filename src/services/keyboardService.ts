import { isHangulConsonant } from '../utils/hangul/core';
import {
  getUnpairableVowels,
  getUnpairableConsonants,
  areUnpairableConsonants,
  areUnpairableVowels,
  HANGUL_CONSONANT_COMPONENTS,
} from '../utils/hangul';
import {
  MAX_LETTERS,
  NUMBER_OF_GUESSES,
  EMOTE_EXISTS,
  EMOTE_MANY,
  EMOTE_SIMILAR,
  EMOTE_OPPOSITE,
  DATA_MATCH,
  DATA_NONE,
  DATA_COLOR,
} from '../data/constants';
import type { 
  GameBoardRow,
  GameEmote 
} from '../types/gameTypes';

export interface KeyboardAnalysisInput {
  yesList: [string[], string[]];
  noList: [string[], string[]];
  hotComboList: [string[], string[]];
  hintList: string[];
  allNewYes: [string[], string[]];
  allNewNo: [string[], string[]];
  board: GameBoardRow[];
  guessesRemaining: number;
}

export interface KeyboardCallbacks {
  yesNoMaybeListsFromComponents: (character: string, index: number, checkUniques: boolean) => [string[], string[], string[]];
  addToYesList: (letter: string, index: number) => boolean;
  addToNoList: (letter: string, index: number) => boolean;
  addManyToNoList: (letters: string, index: number) => boolean;
  breaksAnyHotCombo: (index: number, testList: string[]) => boolean;
  shadeKeyBoard: (letter: string, color: string) => void;
}

export interface KeyboardAnalysisResult {
  newYesUpdates: Array<{ letter: string; index: number }>;
  newNoUpdates: Array<{ letter: string; index: number }>;
  keyboardColorUpdates: Array<{ letter: string; color: string }>;
  tryAgain: boolean;
}

export class KeyboardService {
  private callbacks: KeyboardCallbacks;

  constructor(callbacks: KeyboardCallbacks) {
    this.callbacks = callbacks;
  }

  analyzeKeyboardFromClues(input: KeyboardAnalysisInput): KeyboardAnalysisResult {
    const {
      yesList,
      noList,
      hotComboList,
      hintList,
      allNewYes,
      allNewNo,
      board,
      guessesRemaining
    } = input;

    const result: KeyboardAnalysisResult = {
      newYesUpdates: [],
      newNoUpdates: [],
      keyboardColorUpdates: [],
      tryAgain: false
    };

    let tryAgain = true;

    // 추론 로직을 반복하여 새로운 정보가 더 이상 나오지 않을 때까지 계속
    while (tryAgain) {
      tryAgain = false;

      // 각 보드의 행을 검사
      const startRow = 0; // Race 모드는 나중에 구현
      for (let row = startRow; row < NUMBER_OF_GUESSES - guessesRemaining; row++) {
        const boardRow = board[row];
        if (!boardRow) continue;

        // 각 글자 위치 검사 (왼쪽, 오른쪽)
        for (let i = 0; i < MAX_LETTERS; i++) {
          const emote = boardRow.emotes[i];

          if (emote === EMOTE_EXISTS) {
            // 🍆 가지 로직: 정확히 1개 자모만 일치
            const yesNoMaybe = this.callbacks.yesNoMaybeListsFromComponents(boardRow.letters[i], i, true);
            
            if (yesNoMaybe[0].length === 0) {
              // YES가 없는 경우
              if (yesNoMaybe[2].length === 1) {
                // MAYBE가 정확히 1개면 그것이 YES
                const newYes = yesNoMaybe[2][0];
                if (this.callbacks.addToYesList(newYes, i)) {
                  tryAgain = true;
                  result.newYesUpdates.push({ letter: newYes, index: i });
                }
              } else if (yesNoMaybe[2].length > 1) {
                // MAYBE가 여러 개면 Hot Combo 로직 적용
                if (this.callbacks.breaksAnyHotCombo(i, yesNoMaybe[2])) {
                  tryAgain = true;
                }
              }
            } else if (yesNoMaybe[0].length === 1 && yesNoMaybe[2].length > 0) {
              // YES가 1개 있으면 모든 MAYBE를 NO로 변경
              for (let noIndex = 0; noIndex < yesNoMaybe[2].length; noIndex++) {
                const newNo = yesNoMaybe[2][noIndex];
                if (this.callbacks.addToNoList(newNo, i)) {
                  tryAgain = true;
                  result.newNoUpdates.push({ letter: newNo, index: i });
                }
              }
            }
          } else if (emote === EMOTE_MANY || emote === EMOTE_SIMILAR) {
            // 🧄 마늘 또는 🍄 버섯 로직: 2개 이상 자모 일치
            const yesNoMaybe = this.callbacks.yesNoMaybeListsFromComponents(boardRow.letters[i], i, false);
            
            if ((yesNoMaybe[0].length === 0 && yesNoMaybe[2].length === 2) ||
                (yesNoMaybe[0].length === 1 && yesNoMaybe[2].length === 1)) {
              // YES가 없고 MAYBE가 2개이거나, YES가 1개고 MAYBE가 1개면
              // 모든 MAYBE를 YES로 변경
              for (let yesIndex = 0; yesIndex < yesNoMaybe[2].length; yesIndex++) {
                const newYes = yesNoMaybe[2][yesIndex];
                if (this.callbacks.addToYesList(newYes, i)) {
                  tryAgain = true;
                  result.newYesUpdates.push({ letter: newYes, index: i });
                }
              }
            }
          } else if (emote === EMOTE_OPPOSITE) {
            // 🍌 바나나 로직: 반대쪽 글자에서 자모 일치
            const yesNoMaybe = this.callbacks.yesNoMaybeListsFromComponents(boardRow.letters[i], 1 - i, false);
            
            if (yesNoMaybe[0].length === 0 && yesNoMaybe[2].length === 1) {
              // 반대쪽에서 YES가 없고 MAYBE가 1개면 그것을 YES로
              const newYes = yesNoMaybe[2][0];
              if (this.callbacks.addToYesList(newYes, 1 - i)) {
                tryAgain = true;
                result.newYesUpdates.push({ letter: newYes, index: 1 - i });
              }
            }
          }

          // 힌트 관련 로직
          const hint = boardRow.hint;
          if (hint && hint !== 'X') {
            // 🎃 호박 로직
            if (noList[1 - i].includes(hint)) {
              // 힌트가 반대쪽에서 NO면 현재쪽에서 YES
              if (this.callbacks.addToYesList(hint, i)) {
                tryAgain = true;
                result.newYesUpdates.push({ letter: hint, index: i });
              }
            }
          }
        }
      }

      // 각 글자 위치별 추가 로직
      for (let i = 0; i < MAX_LETTERS; i++) {
        // 새로 추가된 YES 자모들에 대한 처리
        for (let yesIndex = 0; yesIndex < allNewYes[i].length; yesIndex++) {
          // 조합할 수 없는 모음들을 NO로 추가
          const unpairable = getUnpairableVowels(allNewYes[i][yesIndex]);
          if (this.callbacks.addManyToNoList(unpairable.join(''), i)) {
            tryAgain = true;
          }
        }

        const yesConsonants: string[] = [];

        // 모든 YES 자모들을 검사
        for (let yesIndex = 0; yesIndex < yesList[i].length; yesIndex++) {
          // 자음 카운트
          if (isHangulConsonant(yesList[i][yesIndex])) {
            yesConsonants.push(yesList[i][yesIndex]);
          }

          // 힌트와의 조합 불가능성 검사
          for (let hintIndex = 0; hintIndex < hintList.length; hintIndex++) {
            if (areUnpairableVowels(hintList[hintIndex], yesList[i][yesIndex])) {
              if (this.callbacks.addToNoList(hintList[hintIndex], i)) {
                tryAgain = true;
                result.newNoUpdates.push({ letter: hintList[hintIndex], index: i });
              }
              if (this.callbacks.addToYesList(hintList[hintIndex], 1 - i)) {
                tryAgain = true;
                result.newYesUpdates.push({ letter: hintList[hintIndex], index: 1 - i });
              }
            }
          }
        }

        if (yesConsonants.length >= 3) {
          // 자음이 3개 이상이면 다른 모든 자음은 불가능
          if (this.callbacks.addManyToNoList(HANGUL_CONSONANT_COMPONENTS, i)) {
            tryAgain = true;
          }
        } else if (yesConsonants.length === 2 && areUnpairableConsonants(yesConsonants[0], yesConsonants[1])) {
          // 자음이 2개이고 서로 조합 불가능하면
          const unpairableGroups: string[][] = [];

          // 각 YES 자음에 대해 조합 불가능한 자음들 수집
          for (let yesIndex = 0; yesIndex < yesConsonants.length; yesIndex++) {
            unpairableGroups.push(getUnpairableConsonants(yesConsonants[yesIndex]));
          }

          // 첫 번째 그룹의 각 자음에 대해
          for (let unpairable = 0; unpairable < unpairableGroups[0].length; unpairable++) {
            let inAll = true;
            
            // 다른 모든 그룹에 포함되는지 확인
            for (let group = 1; group < unpairableGroups.length; group++) {
              if (!unpairableGroups[group].includes(unpairableGroups[0][unpairable])) {
                inAll = false;
                break;
              }
            }

            if (!inAll) continue;

            // 모든 그룹에 포함되는 자음은 NO로 추가
            if (this.callbacks.addToNoList(unpairableGroups[0][unpairable], i)) {
              tryAgain = true;
              result.newNoUpdates.push({ letter: unpairableGroups[0][unpairable], index: i });
            }
          }
        }
      }
    }

    result.tryAgain = tryAgain;
    return result;
  }

  updateKeyboardColors(input: KeyboardAnalysisInput): void {
    const { allNewYes, allNewNo, noList } = input;

    // 키보드 색상 업데이트
    for (let i = 0; i < MAX_LETTERS; i++) {
      // 새로 추가된 YES 자모들을 MATCH 색상으로
      for (let yesIndex = 0; yesIndex < allNewYes[i].length; yesIndex++) {
        this.callbacks.shadeKeyBoard(allNewYes[i][yesIndex], DATA_MATCH[DATA_COLOR]);
      }

      // 새로 추가된 NO 자모들을 NONE 색상으로 (양쪽 모두 NO인 경우만)
      for (let noIndex = 0; noIndex < allNewNo[i].length; noIndex++) {
        const no = allNewNo[i][noIndex];
        if (noList[0].includes(no) && noList[1].includes(no)) {
          this.callbacks.shadeKeyBoard(no, DATA_NONE[DATA_COLOR]);
        }
      }
    }
  }

  processKeyboardAnalysis(input: KeyboardAnalysisInput): KeyboardAnalysisResult {
    // 추론 로직 실행
    const analysisResult = this.analyzeKeyboardFromClues(input);
    
    // 키보드 색상 업데이트
    this.updateKeyboardColors(input);
    
    return analysisResult;
  }
}