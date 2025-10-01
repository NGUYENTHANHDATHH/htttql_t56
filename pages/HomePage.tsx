import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { ADMIN_CODE } from '../constants';

const HomePage: React.FC = () => {
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const { socket, gameState, unlockAudio } = useGame();

  // Automatically reconnect player on page load if they are already in the game
  useEffect(() => {
    if (gameState) {
      const storedPlayer = localStorage.getItem('olympiaPlayer');
      if (storedPlayer) {
        try {
          const parsedPlayer = JSON.parse(storedPlayer);
          if (gameState.players.some(p => p.id === parsedPlayer.id)) {
            navigate(`/player/${parsedPlayer.id}`);
          }
        } catch (e) {
          console.error("Failed to parse player data from localStorage", e);
          localStorage.removeItem('olympiaPlayer');
        }
      }
    }
  }, [gameState, navigate]);

  const handleJoin = () => {
    unlockAudio(); // Unlock audio on user interaction
    if (!name.trim()) return;

    const trimmedName = name.trim();

    if (trimmedName.toLowerCase() === ADMIN_CODE) {
      navigate('/admin');
      return;
    }

    // Check if a player with this name already exists (reconnection attempt)
    const existingPlayer = gameState?.players.find(p => p.name.toLowerCase() === trimmedName.toLowerCase());

    if (existingPlayer) {
      // Player exists, this is a reconnection.
      // Update local storage with their correct ID and navigate.
      localStorage.setItem('olympiaPlayer', JSON.stringify({ name: existingPlayer.name, id: existingPlayer.id }));
      navigate(`/player/${existingPlayer.id}`);
      return;
    }

    // If player does not exist, check if game has started.
    if (gameState?.isGameStarted) {
      alert("Game has already started and your name is not on the list. You can only watch.");
      return;
    }

    // If game has not started and player does not exist, create a new player.
    try {
      const id = `${Date.now()}-${Math.random()}`;
      localStorage.setItem('olympiaPlayer', JSON.stringify({ name: trimmedName, id }));
      socket.joinGame(trimmedName, id);
      navigate(`/player/${id}`);
    } catch (error) {
      console.error("Failed to join game:", error);
      alert("Could not join the game. Please try again.");
    }
  };

  const handleViewPublicScreen = () => {
    unlockAudio(); // Unlock audio on user interaction
    navigate('/game');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-center bg-cover p-4" style={{ backgroundImage: "url('/assets/imgs/bua_liem.jpg')" }}>
      <div className="w-full max-w-4xl text-center">
        <h1 className="text-5xl mb-8 md:text-6xl font-extrabold text-yellow-400 mb-2">
          Hệ Thống Thông Tin Quản Lý
        </h1>
        <h2 className="text-6xl md:text-7xl font-extrabold text-white mb-8">Thương Mại Điện Tử</h2>

        <div className="bg-gray-800 bg-opacity-70 rounded-xl shadow-lg p-6 md:p-8 max-w-md mx-auto">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name to join or reconnect"
            className="w-full px-4 py-3 mb-4 text-lg bg-gray-700 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-white transition"
            onKeyUp={(e) => e.key === 'Enter' && handleJoin()}
          />
          <button
            onClick={handleJoin}
            className="w-full bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg text-lg hover:bg-yellow-400 transition-transform transform hover:scale-105"
          >
            Join / Reconnect
          </button>
        </div>

        <button
          onClick={handleViewPublicScreen}
          className="mt-8 text-yellow-400 hover:text-yellow-300 transition text-lg"
        >
          View Public Screen <i className="fas fa-tv ml-2"></i>
        </button>
      </div>
    </div>
  );
};

export default HomePage;
