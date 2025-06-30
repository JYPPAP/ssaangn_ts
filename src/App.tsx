import React, { useEffect, useState } from 'react';
import GameBoard from './components/GameBoard';
import VirtualKeyboard from './components/VirtualKeyboard';
import ResultModal from './components/ResultModal';
import { useGameStore } from './stores/gameStore';
import { useStatsStore } from './stores/statsStore';
import { useSettingsStore } from './stores/settingsStore';
import { initializeStores } from './stores';
import { keyboardKeyToJamoText } from './utils/hangul/core';
import { EMOTE_HINT } from './data/constants';
import './App.css';

function App() {
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { 
    gameStatus, 
    initializeGame,
    insertLetter,
    deleteLetter,
    submitGuess,
    useHint
  } = useGameStore();
  
  const { loadStats } = useStatsStore();
  const { loadSettings, theme } = useSettingsStore();

  // 초기화
  useEffect(() => {
    const initialize = async () => {
      try {
        // 스토어들 초기화
        initializeStores();
        
        // 게임 초기화
        await initializeGame();
        
        setIsLoading(false);
      } catch (error) {
        console.error('앱 초기화 실패:', error);
        setIsLoading(false);
      }
    };

    initialize();
  }, [initializeGame]);

  // 게임 상태 변화 감지
  useEffect(() => {
    if (gameStatus === 'won' || gameStatus === 'lost') {
      // 결과 모달을 약간의 지연 후 표시
      const timer = setTimeout(() => {
        setIsResultModalOpen(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [gameStatus]);

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 모달이 열려있거나 게임이 끝났으면 키보드 입력 무시
      if (isResultModalOpen || gameStatus !== 'playing') return;

      const key = event.key;
      
      // 백스페이스/삭제
      if (key === 'Backspace' || key === 'Delete') {
        event.preventDefault();
        deleteLetter();
        return;
      }
      
      // 엔터
      if (key === 'Enter') {
        event.preventDefault();
        submitGuess();
        return;
      }

      // 힌트 키 (7번 키)
      if (key === '7' || key === EMOTE_HINT) {
        event.preventDefault();
        useHint();
        return;
      }

      // 한글 자모 변환
      const hangulKey = keyboardKeyToJamoText(key);
      if (hangulKey !== key) {
        event.preventDefault();
        insertLetter(hangulKey);
        return;
      }

      // 직접 한글 입력
      if (/^[ㄱ-ㅎㅏ-ㅣ]$/.test(key)) {
        event.preventDefault();
        insertLetter(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isResultModalOpen, gameStatus, insertLetter, deleteLetter, submitGuess, useHint]);

  // 테마 적용
  useEffect(() => {
    document.body.setAttribute('data-theme', theme.toString());
  }, [theme]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">
          <h1>쌍근</h1>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">쌍근</h1>
        <p className="app-subtitle">한글 두 글자 단어 맞추기</p>
      </header>

      <main className="app-main">
        <div className="game-container">
          <GameBoard />
          <VirtualKeyboard />
        </div>
      </main>

      <footer className="app-footer">
        <p>© 2025 쌍근 게임</p>
      </footer>

      <ResultModal 
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
      />
    </div>
  );
}

export default App;