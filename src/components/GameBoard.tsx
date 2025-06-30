import React from 'react';
import { useGameStore, type GameEmote } from '../stores/gameStore';
import { 
  FEEDBACK_DATA_MAP,
  NUMBER_OF_GUESSES,
  MAX_LETTERS 
} from '../data/constants';

const GameBoard: React.FC = () => {
  const { board, currentGuess, currentGuessIndex } = useGameStore();

  return (
    <div className="game-board" id="game-board">
      {Array.from({ length: NUMBER_OF_GUESSES }, (_, rowIndex) => (
        <GameRow
          key={rowIndex}
          rowIndex={rowIndex}
          isCurrentRow={rowIndex === currentGuessIndex}
          letters={
            rowIndex < board.length
              ? board[rowIndex].letters
              : rowIndex === currentGuessIndex
              ? currentGuess
              : ['', '']
          }
          emotes={
            rowIndex < board.length
              ? board[rowIndex].emotes
              : undefined
          }
          hint={
            rowIndex < board.length
              ? board[rowIndex].hint
              : undefined
          }
        />
      ))}
    </div>
  );
};

interface GameRowProps {
  rowIndex: number;
  isCurrentRow: boolean;
  letters: string[];
  emotes?: GameEmote[];
  hint?: string;
}

const GameRow: React.FC<GameRowProps> = ({ 
  rowIndex, 
  isCurrentRow, 
  letters, 
  emotes,
  hint 
}) => {
  return (
    <div className={`letter-row game-row ${isCurrentRow ? 'current-row' : ''}`}>
      {/* 단일 행에 글자 박스들만 렌더링 (가로 정렬) */}
      {Array.from({ length: MAX_LETTERS }, (_, colIndex) => (
        <LetterBox
          key={`${rowIndex}-${colIndex}`}
          letter={letters[colIndex] || ''}
          emote={emotes?.[colIndex]}
          isRevealed={!!emotes}
          rowIndex={rowIndex}
          colIndex={colIndex}
        />
      ))}
      
      {/* 힌트 표시 (필요한 경우) */}
      {hint && hint !== 'X' && (
        <div className="shade-hint" id="shade-hint-box">
          {hint}
        </div>
      )}
    </div>
  );
};

interface LetterBoxProps {
  letter: string;
  emote?: GameEmote;
  isRevealed: boolean;
  rowIndex: number;
  colIndex: number;
}

const LetterBox: React.FC<LetterBoxProps> = ({ 
  letter, 
  emote, 
  isRevealed,
  rowIndex,
  colIndex 
}) => {
  const feedbackData = emote ? FEEDBACK_DATA_MAP[emote] : null;
  
  return (
    <div 
      className={`letter-box ${isRevealed ? 'revealed' : ''} ${letter ? 'filled' : ''}`}
      style={{
        backgroundColor: feedbackData?.[3] || 'transparent', // DATA_COLOR 인덱스는 3
        animationDelay: isRevealed ? `${colIndex * 150}ms` : '0ms'
      }}
    >
      <div className="letter-content">
        {letter}
      </div>
      
      {/* 이모지 오버레이 (우측 상단) */}
      {emote && (
        <div className="emote-overlay">
          <div className="emote-image">
            <span className="emote-text">
              {emote}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;