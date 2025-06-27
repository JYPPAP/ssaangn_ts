import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { useStatsStore } from '../stores/statsStore';
import { parseMeanings } from '../data/words';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ResultModal: React.FC<ResultModalProps> = ({ isOpen, onClose }) => {
  const { 
    gameStatus, 
    secretWord, 
    currentGuessIndex, 
    board,
    resetGame 
  } = useGameStore();
  
  const { totalGames, winRate, currentStreak } = useStatsStore();

  if (!isOpen || gameStatus === 'playing') return null;

  const isWin = gameStatus === 'won';
  const guessCount = isWin ? currentGuessIndex : 7;
  
  const meanings = secretWord ? parseMeanings(secretWord.meanings) : [];

  const handleNewGame = () => {
    resetGame();
    onClose();
  };

  const handleShare = async () => {
    const gameResult = generateGameResult();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: '쌍근 게임 결과',
          text: gameResult
        });
      } catch (err) {
        // 공유 실패 시 클립보드로 복사
        await copyToClipboard(gameResult);
      }
    } else {
      await copyToClipboard(gameResult);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // 복사 성공 피드백 (토스트 등)
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  const generateGameResult = (): string => {
    const emoteBoard = board.map(row => 
      row.emotes.join('')
    ).join('\n');

    return `쌍근 ${getCurrentGameNumber()} ${isWin ? guessCount : 'X'}/7\n\n${emoteBoard}\n\nhttps://ssaangn.com`;
  };

  const getCurrentGameNumber = (): number => {
    // 시작일로부터 며칠째인지 계산
    const startDate = new Date('2024-01-01');
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="result-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="result-title">
            {isWin ? '🎉 성공!' : '😅 실패...'}
          </h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-content">
          {/* 정답 단어 및 의미 */}
          <div className="answer-section">
            <h3>정답</h3>
            <div className="answer-word">
              {secretWord?.word || ''}
            </div>
            <div className="answer-meanings">
              {meanings.map((meaning, index) => (
                <div key={index} className="meaning-item">
                  {meaning}
                </div>
              ))}
            </div>
          </div>

          {/* 게임 결과 */}
          <div className="game-result">
            <div className="result-stats">
              <div className="stat-item">
                <span className="stat-label">시도 횟수</span>
                <span className="stat-value">
                  {isWin ? `${guessCount}/7` : '실패'}
                </span>
              </div>
            </div>
          </div>

          {/* 통계 */}
          <div className="stats-section">
            <h3>통계</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">{totalGames}</span>
                <span className="stat-label">총 게임</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{Math.round(winRate)}%</span>
                <span className="stat-label">승률</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{currentStreak}</span>
                <span className="stat-label">연승</span>
              </div>
            </div>
          </div>

          {/* 게임 보드 미리보기 */}
          <div className="board-preview">
            <h3>결과</h3>
            <div className="mini-board">
              {board.map((row, index) => (
                <div key={index} className="mini-row">
                  {row.emotes.map((emote, emoteIndex) => (
                    <span key={emoteIndex} className="mini-emote">
                      {emote}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="share-button" onClick={handleShare}>
            📤 공유하기
          </button>
          <button className="new-game-button" onClick={handleNewGame}>
            🎮 새 게임
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;