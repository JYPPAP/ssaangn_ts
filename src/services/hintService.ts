import {
  DATA_NONE,
  DATA_MATCH,
  DATA_COLOR,
  EMOTE_HINT
} from '../data/constants';

export interface HintInput {
  secretWordJamoSets: string[][];
  hintsRemaining: number;
}

export interface HintCallbacks {
  getKeyBoardShade: (letter: string) => string;
  shadeKeyBoardDelayed: (letter: string, color: string, delay: number) => void;
  disableKeyBoardUnmatched: () => void;
  getKeyboardKey: (letter: string) => HTMLElement | null;
  addToHintList: (hint: string) => void;
  decrementHintsRemaining: () => void;
  setHintsRemaining: (count: number) => void;
  colorKeyboardFromClues: () => void;
}

export interface HintResult {
  hintProvided: string | null; // 'X'는 모든 힌트 소진
  newHintsRemaining: number;
  shouldColorKeyboard: boolean;
  shouldDisableUnmatched: boolean;
  message: string;
}

export class HintService {
  private callbacks: HintCallbacks;

  constructor(callbacks: HintCallbacks) {
    this.callbacks = callbacks;
  }

  generateHint(input: HintInput): HintResult {
    const { secretWordJamoSets, hintsRemaining } = input;

    if (hintsRemaining <= 0) {
      return {
        hintProvided: null,
        newHintsRemaining: 0,
        shouldColorKeyboard: false,
        shouldDisableUnmatched: false,
        message: '힌트가 모두 소진되었습니다.'
      };
    }

    // 힌트 후보 수집
    const possibleHints: string[] = [];
    
    for (const jamoSet of secretWordJamoSets) {
      for (const character of jamoSet) {
        if (!possibleHints.includes(character)) {
          const shade = this.callbacks.getKeyBoardShade(character);
          
          // 이미 MATCH나 NONE 상태가 아닌 자모들만 힌트 후보로
          if (shade !== DATA_NONE[DATA_COLOR] && shade !== DATA_MATCH[DATA_COLOR]) {
            possibleHints.push(character);
          }
        }
      }
    }

    let hint = 'X'; // 'X'는 모든 힌트가 소진된 상태

    if (possibleHints.length > 0) {
      // 일관된 힌트를 위해 dayNumber 기반으로 선택
      hint = this.selectConsistentHint(possibleHints);
    }

    const shadeDelay = 700; // manual이므로 지연 적용

    if (hint !== 'X') {
      // 일반 힌트 제공
      this.callbacks.addToHintList(hint);
      this.callbacks.decrementHintsRemaining();

      // 키보드에 힌트 표시
      this.callbacks.shadeKeyBoardDelayed(hint, DATA_MATCH[DATA_COLOR], shadeDelay);

      return {
        hintProvided: hint,
        newHintsRemaining: hintsRemaining - 1,
        shouldColorKeyboard: true,
        shouldDisableUnmatched: false,
        message: `힌트 제공: ${hint} (남은 힌트: ${hintsRemaining - 1})`
      };
    } else {
      // 모든 힌트 소진 - 일치하지 않는 키 모두 비활성화
      this.callbacks.setHintsRemaining(0);

      return {
        hintProvided: 'X',
        newHintsRemaining: 0,
        shouldColorKeyboard: false,
        shouldDisableUnmatched: true,
        message: '모든 힌트가 소진되었습니다. 일치하지 않는 키들을 비활성화합니다.'
      };
    }
  }

  private selectConsistentHint(possibleHints: string[]): string {
    // 일관된 힌트를 위해 dayNumber 기반으로 선택
    const today = new Date();
    const startDate = new Date('2024-01-01');
    const dayNumber = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // 원본과 동일한 mulberry32 랜덤 로직 (간단한 의사랜덤)
    const mulberry32 = (a: number) => {
      return function() {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      }
    };
    
    const rand = Math.floor(mulberry32(dayNumber)() * possibleHints.length);
    return possibleHints[rand];
  }

  async executeHint(input: HintInput): Promise<HintResult> {
    const result = this.generateHint(input);

    const shadeDelay = 700;

    if (result.hintProvided && result.hintProvided !== 'X') {
      // 일반 힌트 실행
      setTimeout(() => {
        this.callbacks.colorKeyboardFromClues();
      }, shadeDelay);

      console.log(result.message);
    } else if (result.shouldDisableUnmatched) {
      // 모든 힌트 소진 처리
      setTimeout(() => {
        this.callbacks.disableKeyBoardUnmatched();
      }, shadeDelay);

      console.log(result.message);
    }

    // 힌트 키보드 버튼 비활성화
    const hintButton = this.callbacks.getKeyboardKey(EMOTE_HINT);
    if (hintButton && result.newHintsRemaining <= 0) {
      hintButton.setAttribute('disabled', 'true');
    }

    return result;
  }

  canProvideHint(hintsRemaining: number): boolean {
    return hintsRemaining > 0;
  }

  getHintStatus(hintsRemaining: number): {
    canUseHint: boolean;
    statusMessage: string;
  } {
    if (hintsRemaining <= 0) {
      return {
        canUseHint: false,
        statusMessage: '사용 가능한 힌트가 없습니다.'
      };
    }

    return {
      canUseHint: true,
      statusMessage: `남은 힌트: ${hintsRemaining}개`
    };
  }

  calculateOptimalHintTiming(guessesRemaining: number, hintsRemaining: number): {
    shouldUseNow: boolean;
    recommendation: string;
  } {
    // 게임 후반부로 갈수록 힌트 사용을 권장
    const urgency = (7 - guessesRemaining) / 7; // 0~1 사이 값

    if (guessesRemaining <= 2 && hintsRemaining > 0) {
      return {
        shouldUseNow: true,
        recommendation: '게임이 거의 끝나갑니다. 힌트를 사용하세요!'
      };
    }

    if (guessesRemaining <= 4 && hintsRemaining > 1) {
      return {
        shouldUseNow: true,
        recommendation: '힌트를 사용할 좋은 타이밍입니다.'
      };
    }

    return {
      shouldUseNow: false,
      recommendation: '아직 여유가 있습니다. 더 시도해보세요.'
    };
  }
}