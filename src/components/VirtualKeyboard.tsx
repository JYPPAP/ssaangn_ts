import React from 'react';
import { useGame } from '../hooks/useGame';
import { useKeyboard } from '../hooks/useKeyboard';
import { useGameStore } from '../stores/gameStore';
import type { KeyboardState } from '../types/gameTypes';
import { 
  HANGUL_KEYBOARD_ROWS,
  EMOTE_HINT,
  DATA_MATCH,
  DATA_NONE,
  DATA_COLOR,
  COLOR_MAYBE
} from '../data/constants';

const VirtualKeyboard: React.FC = () => {
  const { 
    insertLetter, 
    deleteLetter, 
    submitGuess, 
    useHint,
    guessesRemaining,
    hintsRemaining
  } = useGame();
  
  const { getKeyBoardShade } = useKeyboard();
  const { hintList } = useGameStore();

  const handleKeyPress = (key: string) => {
    if (guessesRemaining <= 0) return;

    switch (key) {
      case '⌫':
        deleteLetter();
        break;
      case '⏎':
        submitGuess();
        break;
      case EMOTE_HINT:
        if (hintsRemaining > 0) {
          useHint();
        }
        break;
      default:
        insertLetter(key);
        break;
    }
  };

  const getKeyStyle = (key: string): React.CSSProperties => {
    // 힌트로 공개된 자모는 항상 MATCH 색상
    if (hintList.includes(key)) {
      return { 
        backgroundColor: DATA_MATCH[DATA_COLOR],
        color: '#ffffff',
        border: 'none'
      };
    }
    
    // gameStore의 키보드 색상 가져오기
    const keyColor = getKeyBoardShade(key);
    
    if (keyColor === DATA_MATCH[DATA_COLOR]) {
      return { 
        backgroundColor: DATA_MATCH[DATA_COLOR],
        color: '#ffffff',
        border: 'none'
      };
    } else if (keyColor === DATA_NONE[DATA_COLOR]) {
      return { 
        backgroundColor: DATA_NONE[DATA_COLOR],
        color: '#ffffff', 
        border: 'none'
      };
    } else if (keyColor === COLOR_MAYBE) {
      return { 
        backgroundColor: COLOR_MAYBE,
        color: '#ffffff',
        border: 'none'
      };
    }
    
    // 기본 스타일
    return {
      backgroundColor: '#f8f9fa',
      color: '#000000',
      border: '1px solid #dee2e6'
    };
  };

  const isKeyDisabled = (key: string): boolean => {
    if (guessesRemaining <= 0) return true;
    
    // 특수 키들은 항상 활성화
    if (['⌫', '⏎'].includes(key)) return false;
    
    // 힌트 키는 힌트가 남아있을 때만 활성화
    if (key === EMOTE_HINT) return hintsRemaining <= 0;
    
    // NONE 색상인 키는 비활성화
    const keyColor = getKeyBoardShade(key);
    return keyColor === DATA_NONE[DATA_COLOR];
  };

  return (
    <div className="virtual-keyboard" id="keyboard-cont">
      {HANGUL_KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="keyboard-row">
          {row.map((key) => (
            <KeyboardKey
              key={key}
              keyValue={key}
              onClick={() => handleKeyPress(key)}
              style={getKeyStyle(key)}
              disabled={isKeyDisabled(key)}
              isSpecial={['⌫', '⏎', EMOTE_HINT].includes(key)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

interface KeyboardKeyProps {
  keyValue: string;
  onClick: () => void;
  style: React.CSSProperties;
  disabled: boolean;
  isSpecial: boolean;
}

const KeyboardKey: React.FC<KeyboardKeyProps> = ({
  keyValue,
  onClick,
  style,
  disabled,
  isSpecial
}) => {
  // gameStore에서 찾는 클래스명과 ID 적용
  const getKeyId = (key: string) => {
    if (key === '⌫') return 'backspace-key';
    if (key === '⏎') return 'submit-key';
    if (key === EMOTE_HINT) return 'hint-key';
    return `key-${key}`;
  };

  return (
    <button
      id={getKeyId(keyValue)}
      className={`keyboard-button ${isSpecial ? 'special-key' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      <span className="key-text">
        {keyValue}
      </span>
    </button>
  );
};

export default VirtualKeyboard;