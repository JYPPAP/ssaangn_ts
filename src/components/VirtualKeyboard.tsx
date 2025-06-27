import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { keyboardKeyToJamoText } from '../utils/hangul/core';
import { KeyboardState, FEEDBACK_DATA, GAME_EMOTES } from '../utils/gameLogic';

const KEYBOARD_LAYOUT = [
  ['ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', GAME_EMOTES.HINT, 'ㅒ', 'ㅖ', '⌫'],
  ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
  ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
  ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ', '⏎']
];

const VirtualKeyboard: React.FC = () => {
  const { 
    keyboardState, 
    insertLetter, 
    deleteLetter, 
    submitGuess, 
    useHint,
    guessesRemaining,
    hintsRemaining,
    revealedJamos,
    getKeyboardShade
  } = useGameStore();

  const handleKeyPress = (key: string) => {
    if (guessesRemaining <= 0) return;

    switch (key) {
      case '⌫':
        deleteLetter();
        break;
      case '⏎':
        submitGuess();
        break;
      case GAME_EMOTES.HINT:
        if (hintsRemaining > 0) {
          useHint();
        }
        break;
      default:
        insertLetter(key);
        break;
    }
  };

  const getKeyState = (key: string): KeyboardState => {
    // 힌트로 공개된 자모는 항상 MATCH 상태로 표시
    if (revealedJamos.includes(key)) {
      return KeyboardState.MATCH;
    }
    
    return keyboardState[key] || KeyboardState.UNUSED;
  };

  const getKeyStyle = (key: string): React.CSSProperties => {
    const state = getKeyState(key);
    
    switch (state) {
      case KeyboardState.MATCH:
        return { 
          backgroundColor: FEEDBACK_DATA[GAME_EMOTES.MATCH].color,
          color: '#ffffff',
          border: 'none'
        };
      case KeyboardState.USED:
        return { 
          backgroundColor: '#6c757d',
          color: '#ffffff',
          border: 'none'
        };
      case KeyboardState.NONE:
        return { 
          backgroundColor: FEEDBACK_DATA[GAME_EMOTES.NONE].color,
          color: '#ffffff', 
          border: 'none'
        };
      default:
        return {};
    }
  };

  const isKeyDisabled = (key: string): boolean => {
    if (guessesRemaining <= 0) return true;
    
    const state = getKeyState(key);
    
    // 특수 키들은 항상 활성화
    if (['⌫', '⏎'].includes(key)) return false;
    
    // 힌트 키는 힌트가 남아있을 때만 활성화
    if (key === GAME_EMOTES.HINT) return hintsRemaining <= 0;
    
    // NONE 상태인 키는 비활성화
    return state === KeyboardState.NONE;
  };

  return (
    <div className="virtual-keyboard">
      {KEYBOARD_LAYOUT.map((row, rowIndex) => (
        <div key={rowIndex} className="keyboard-row">
          {row.map((key) => (
            <KeyboardKey
              key={key}
              keyValue={key}
              onClick={() => handleKeyPress(key)}
              style={getKeyStyle(key)}
              disabled={isKeyDisabled(key)}
              isSpecial={['⌫', '⏎', GAME_EMOTES.HINT].includes(key)}
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
  return (
    <button
      className={`keyboard-key ${isSpecial ? 'special-key' : ''} ${disabled ? 'disabled' : ''}`}
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