import { useCallback, useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';
import { KeyboardService, KeyboardCallbacks } from '../services/keyboardService';
import { hangulSyllableToJamoComponentsText, isHangulConsonant } from '../utils/hangul/core';
import {
  getUnpairableVowels,
  areUnpairableVowels,
  HANGUL_CONSONANT_COMPONENTS,
} from '../utils/hangul';
import {
  DATA_MATCH,
  DATA_NONE,
  DATA_COLOR,
  EMOTE_HINT
} from '../data/constants';

export const useKeyboard = () => {
  const store = useGameStore();

  // ===== DOM 유틸리티 메서드 =====
  const getKeyboardKey = useCallback((letter: string): HTMLElement | null => {
    const elements = document.getElementsByClassName("keyboard-button");
    for (let i = 0; i < elements.length; i++) {
      const elem = elements[i] as HTMLElement;
      if (elem.textContent === letter || elem.id.startsWith(letter)) {
        return elem;
      }
    }
    return null;
  }, []);

  const getColorPriority = useCallback((color: string): number => {
    // 색상 우선순위: MATCH > USED > COLOR_MAYBE > NONE
    if (color === DATA_MATCH[DATA_COLOR]) return 4;      // 주황색 - 최고 우선순위
    if (color === DATA_NONE[DATA_COLOR]) return 3;       // 회색 - 두번째 우선순위
    if (color === 'rgb(248, 214, 87)') return 2;         // 노란색 - 세번째 우선순위 (COLOR_MAYBE)
    return 1;                                             // 기타 - 최하 우선순위
  }, []);

  const shadeKeyBoard = useCallback((letter: string, color: string) => {
    const elem = getKeyboardKey(letter);
    if (!elem) return;
    
    const oldColor = elem.style.backgroundColor || '';
    const oldPriority = getColorPriority(oldColor);
    const newPriority = getColorPriority(color);
    
    // 새로운 색상이 기존 색상보다 우선순위가 높거나 같은 경우에만 변경
    if (newPriority >= oldPriority) {
      elem.style.backgroundColor = color;
      
      // 스토어의 키보드 상태도 업데이트
      store.updateKeyboardState(letter, {
        color,
        priority: newPriority,
        disabled: false
      } as any);
    }
  }, [getKeyboardKey, getColorPriority, store]);

  const shadeKeyBoardDelayed = useCallback((letter: string, color: string, delay: number) => {
    if (delay <= 0) {
      shadeKeyBoard(letter, color);
    } else {
      setTimeout(() => {
        shadeKeyBoard(letter, color);
      }, delay);
    }
  }, [shadeKeyBoard]);

  const getKeyBoardShade = useCallback((letter: string): string => {
    const elem = getKeyboardKey(letter);
    return elem?.style.backgroundColor || '';
  }, [getKeyboardKey]);

  const disableKeyBoardUnmatched = useCallback(() => {
    const elements = document.getElementsByClassName("keyboard-button");
    
    for (let i = 0; i < elements.length; i++) {
      const elem = elements[i] as HTMLElement;
      
      // 백스페이스, 엔터, 힌트 키는 제외
      if (elem.textContent === "⌫" || 
          elem.textContent === "⏎" || 
          elem.textContent === EMOTE_HINT ||
          elem.style.backgroundColor === DATA_MATCH[DATA_COLOR]) {
        continue;
      }

      // 나머지는 모두 비활성화
      elem.setAttribute('disabled', 'true');
      elem.style.backgroundColor = DATA_NONE[DATA_COLOR];
    }
  }, []);

  // ===== 키보드 서비스 콜백 =====
  const keyboardCallbacks: KeyboardCallbacks = useMemo(() => ({
    yesNoMaybeListsFromComponents: (character: string, index: number, checkUniques: boolean) => {
      const { yesList, noList } = store;
      const components = hangulSyllableToJamoComponentsText(character);
      
      const uniqueComponents: string[] = [];
      for (let i = 0; i < components.length; i++) {
        if (!checkUniques || !uniqueComponents.includes(components[i])) {
          uniqueComponents.push(components[i]);
        }
      }
      
      const yesNoMaybe: [string[], string[], string[]] = [[], [], []];
      for (let i = 0; i < uniqueComponents.length; i++) {
        const component = uniqueComponents[i];
        if (yesList[index].includes(component)) {
          yesNoMaybe[0].push(component);
        } else if (noList[index].includes(component)) {
          yesNoMaybe[1].push(component);
        } else {
          yesNoMaybe[2].push(component);
        }
      }
      
      return yesNoMaybe;
    },
    addToYesList: store.addToYesList,
    addToNoList: store.addToNoList,
    addManyToNoList: (letters: string, index: number) => {
      let addedSomething = false;
      for (let i = 0; i < letters.length; i++) {
        addedSomething = store.addToNoList(letters[i], index) || addedSomething;
      }
      return addedSomething;
    },
    breaksAnyHotCombo: (index: number, testList: string[]) => {
      const { yesList, noList, hotComboList } = store;
      
      // 각 테스트 자모에 대해
      for (let test = 0; test < testList.length; test++) {
        // 현재 YES/NO 상태를 복사
        let yesListCopy = [...yesList[index]];
        let noListCopy = [...noList[index]];

        // 테스트 시나리오 설정
        for (let pick = 0; pick < testList.length; pick++) {
          if (testList[pick] === testList[test]) {
            // 현재 테스트 자모는 YES로
            if (!yesListCopy.includes(testList[pick])) {
              yesListCopy.push(testList[pick]);
              const unpairable = getUnpairableVowels(testList[pick]);
              for (let i = 0; i < unpairable.length; i++) {
                if (!noListCopy.includes(unpairable[i])) {
                  noListCopy.push(unpairable[i]);
                }
              }
            }
          } else {
            // 다른 자모들은 NO로
            if (!noListCopy.includes(testList[pick])) {
              noListCopy.push(testList[pick]);
            }
          }
        }

        let poppedYes: string[] = [];

        // 각 Hot Combo 제약 조건 확인
        for (let hotCombo = 0; hotCombo < hotComboList[index].length; hotCombo++) {
          // 이전에 제거된 YES 자모들 복원
          for (let i = 0; i < poppedYes.length; i++) {
            yesListCopy.push(poppedYes[i]);
          }
          poppedYes = [];

          // 현재 Hot Combo에 대해 가능한 개수와 최대 개수 계산
          let possibleCount = 0;
          let maxCount = 0;
          
          const combo = hotComboList[index][hotCombo];
          for (let letter = 0; letter < combo.jamoComponents.length; letter++) {
            const jamo = combo.jamoComponents[letter];
            
            if (!noListCopy.includes(jamo)) {
              possibleCount++;
            }

            const yesPos = yesListCopy.indexOf(jamo);
            if (yesPos >= 0) {
              // YES 리스트에서 임시 제거
              poppedYes.push(yesListCopy[yesPos]);
              yesListCopy.splice(yesPos, 1);
              maxCount++;
            }
          }

          // 제약 조건 위반 확인
          if (possibleCount < combo.min || maxCount > combo.max) {
            // 이 테스트 자모는 NO로 추가해야 함
            return store.addToNoList(testList[test], index);
          }
        }
      }

      return false;
    },
    shadeKeyBoard
  }), [store, shadeKeyBoard]);

  // ===== 키보드 서비스 인스턴스 =====
  const keyboardService = useMemo(() => new KeyboardService(keyboardCallbacks), [keyboardCallbacks]);

  // ===== 키보드 색상 업데이트 =====
  const colorKeyboardFromClues = useCallback(() => {
    const input = {
      yesList: store.yesList,
      noList: store.noList,
      hotComboList: store.hotComboList,
      hintList: store.hintList,
      allNewYes: store.allNewYes,
      allNewNo: store.allNewNo,
      board: store.board,
      guessesRemaining: store.guessesRemaining
    };

    const result = keyboardService.processKeyboardAnalysis(input);
    
    // allNew 리스트 초기화
    store.clearAllNewLists();
    
    return result;
  }, [store, keyboardService]);

  // ===== 키보드 이벤트 처리 =====
  const handleKeyPress = useCallback((key: string) => {
    // 키보드 이벤트에 따른 처리 로직
    // 이 부분은 실제 게임 로직과 연동해야 함
    console.log(`Key pressed: ${key}`);
  }, []);

  // ===== 키보드 상태 조회 =====
  const getKeyboardStatus = useCallback(() => {
    return {
      keyboardState: store.keyboardState,
      hasDisabledKeys: Object.values(store.keyboardState).some(state => (state as any).disabled),
      coloredKeysCount: Object.values(store.keyboardState).filter(state => (state as any).color).length
    };
  }, [store.keyboardState]);

  // ===== 키보드 초기화 =====
  const resetKeyboard = useCallback(() => {
    store.resetKeyboardState();
    
    // DOM 요소들도 초기화
    const elements = document.getElementsByClassName("keyboard-button");
    for (let i = 0; i < elements.length; i++) {
      const elem = elements[i] as HTMLElement;
      elem.style.backgroundColor = '';
      elem.removeAttribute('disabled');
    }
  }, [store]);

  return {
    // DOM 유틸리티
    getKeyboardKey,
    shadeKeyBoard,
    shadeKeyBoardDelayed,
    getKeyBoardShade,
    disableKeyBoardUnmatched,
    
    // 키보드 로직
    colorKeyboardFromClues,
    handleKeyPress,
    
    // 상태 관리
    getKeyboardStatus,
    resetKeyboard,
    
    // 상태
    keyboardState: store.keyboardState
  };
};