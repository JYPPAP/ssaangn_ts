import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { FEEDBACK_DATA, type GameEmote } from '../utils/gameLogic';

const GameBoard: React.FC = () => {
  const { board, currentGuess, currentGuessIndex } = useGameStore();

  return (
    <div className="game-board">
      {Array.from({ length: 7 }, (_, rowIndex) => (
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
}

const GameRow: React.FC<GameRowProps> = ({ 
  rowIndex, 
  isCurrentRow, 
  letters, 
  emotes 
}) => {
  return (
    <div className={`game-row ${isCurrentRow ? 'current-row' : ''}`}>
      {Array.from({ length: 2 }, (_, colIndex) => (
        <LetterBox
          key={`${rowIndex}-${colIndex}`}
          letter={letters[colIndex] || ''}
          emote={emotes?.[colIndex]}
          isRevealed={!!emotes}
          rowIndex={rowIndex}
          colIndex={colIndex}
        />
      ))}
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
  const feedbackData = emote ? FEEDBACK_DATA[emote] : null;
  
  return (
    <div 
      className={`letter-box ${isRevealed ? 'revealed' : ''} ${letter ? 'filled' : ''}`}
      style={{
        backgroundColor: feedbackData?.color || 'transparent',
        animationDelay: isRevealed ? `${colIndex * 100}ms` : '0ms'
      }}
    >
      <div className="letter-content">
        {letter}
      </div>
      {isRevealed && emote && (
        <div className="emote-overlay">
          <div className="emote-image">
            <span className="emote-text" title={FEEDBACK_DATA[emote]?.description || emote}>
              {emote}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;