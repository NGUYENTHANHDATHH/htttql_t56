
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './contexts/GameContext';
import HomePage from './pages/HomePage';
import AdminDashboard from './pages/AdminDashboard';
import GameScreen from './pages/GameScreen';

const App: React.FC = () => {
  return (
    <GameProvider>
      <HashRouter>
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/game" element={<GameScreen isPlayerView={false} />} />
            <Route path="/player/:id" element={<GameScreen isPlayerView={true} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </HashRouter>
    </GameProvider>
  );
};

export default App;
