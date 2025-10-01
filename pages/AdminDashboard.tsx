
import React from 'react';
import { useGame } from '../contexts/GameContext';
import { Player, Round } from '../types';
import { ROUND_COLORS } from '../constants';

const AdminDashboard: React.FC = () => {
  const { gameState, socket } = useGame();

  if (!gameState) {
    return <div className="flex items-center justify-center min-h-screen">Loading Admin Panel...</div>;
  }

  const handleScoreChange = (playerId: string, delta: number) => {
    try {
      socket.updateScore(playerId, delta);
    } catch (e) {
      console.error("Failed to update score", e);
    }
  };

  const handleKickPlayer = (playerId: string) => {
    if (window.confirm("Are you sure you want to kick this player?")) {
      try {
        socket.kickPlayer(playerId);
      } catch (e) {
        console.error("Failed to kick player", e);
      }
    }
  };

  const handleEndGame = () => {
    if (window.confirm("Are you sure you want to end the game and reset all scores? This cannot be undone.")) {
      try {
        socket.endGame();
      } catch (e) {
        console.error("Failed to end game", e);
      }
    }
  };

  const PlayerControls: React.FC<{ player: Player }> = ({ player }) => (
    <div className="bg-gray-700 p-3 rounded-lg flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0 md:space-x-2">
      <span className="font-bold w-full md:w-1/4">{player.name} ({player.score})</span>
      <div className="flex items-center space-x-2">
      <button onClick={() => handleScoreChange(player.id, 5)} className="bg-green-500 px-2 py-1 rounded hover:bg-green-400 text-sm">+5</button>

        <button onClick={() => handleScoreChange(player.id, 10)} className="bg-green-500 px-2 py-1 rounded hover:bg-green-400 text-sm">+10</button>
        <button onClick={() => handleScoreChange(player.id, 20)} className="bg-green-500 px-2 py-1 rounded hover:bg-green-400 text-sm">+20</button>
        <button onClick={() => handleScoreChange(player.id, -5)} className="bg-yellow-500 px-2 py-1 rounded hover:bg-yellow-400 text-sm">-5</button>

        <button onClick={() => handleScoreChange(player.id, -10)} className="bg-yellow-500 px-2 py-1 rounded hover:bg-yellow-400 text-sm">-10</button>
        <button onClick={() => handleScoreChange(player.id, -20)} className="bg-yellow-500 px-2 py-1 rounded hover:bg-yellow-400 text-sm">-20</button>
      </div>
      <div className="flex items-center space-x-2">
        <button onClick={() => socket.setActivePlayer(player.id)} className={`px-2 py-1 rounded text-sm ${gameState.activePlayerId === player.id ? 'bg-blue-500' : 'bg-gray-500 hover:bg-gray-400'}`}>Set Active</button>
        <button
          onClick={() => { try { socket.toggleStarOfHope(player.id) } catch (e) { console.error("Failed to toggle star", e) } }}
          className={`px-2 py-1 rounded text-sm transition-colors ${player.hasStarOfHope ? 'bg-yellow-400 text-black' : 'bg-gray-500 hover:bg-gray-400'}`}
        >
          🌟 Star
        </button>
        <button onClick={() => handleKickPlayer(player.id)} className="bg-red-600 px-2 py-1 rounded hover:bg-red-500 text-sm">Kick</button>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-gray-800 min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-yellow-400">Admin Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Game State & Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-700 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-3 border-b border-gray-600 pb-2">Game Controls</h2>
            <div className="flex flex-wrap gap-2">
              {!gameState.isGameStarted && <button onClick={() => socket.startGame()} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-md font-semibold">Start Game</button>}
              {gameState.isGameStarted && <button onClick={handleEndGame} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-md font-semibold">End Game & Reset</button>}
              <button onClick={() => socket.resetBuzzer()} className="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded-md font-semibold">Reset Buzzer</button>
              {gameState.currentRound === Round.SPEED_UP && <button onClick={() => socket.revealAnswers()} className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-md font-semibold">Reveal Answers</button>}
              <button onClick={() => socket.playSound('correct.mp3')} className="bg-green-600 hover:bg-yellow-500 px-4 py-2 rounded-md font-semibold">Correct</button>
              <button onClick={() => socket.playSound('incorrect.mp3')} className="bg-red-600 hover:bg-yellow-500 px-4 py-2 rounded-md font-semibold">Incorrect</button>
              <button onClick={() => socket.playSound('congratulation.mp3')} className="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded-md font-semibold">Congratulation</button>
            
            </div>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-3 border-b border-gray-600 pb-2">Switch Round</h2>
            <div className="flex flex-wrap gap-2">
              {Object.values(Round).filter(r => r !== Round.LOBBY).map(round => (
                <button key={round} onClick={() => socket.switchRound(round)} className={`${ROUND_COLORS[round]} px-4 py-2 rounded-md font-semibold hover:opacity-80`}>{round}</button>
              ))}
            </div>
            <p className="mt-4 text-lg">Current Round: <span className="font-bold text-yellow-300">{gameState.currentRound}</span></p>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-3 border-b border-gray-600 pb-2">Timer Controls</h2>
            <div className="flex flex-wrap gap-2">
            <button key={5} onClick={() => { socket.startTimer(5); socket.playSound('countdown_5s.mp3'); }} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md font-semibold">5s</button>
            <button key={15} onClick={() => { socket.startTimer(15); socket.playSound('countdown_15s.mp3'); }} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md font-semibold">15s</button>
            <button key={15} onClick={() => { socket.startTimer(15); socket.playSound('countdown_20s.mp3'); }} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md font-semibold">20s</button>
            <button key={120} onClick={() => { socket.startTimer(120); socket.playSound('countdown_120s.mp3'); }} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md font-semibold">120s</button>
            </div>
            <p className="mt-4 text-2xl font-mono">Time Left: {gameState.timer}s</p>
          </div>

          {(gameState.currentRound === Round.WARM_UP || gameState.currentRound === Round.OBSTACLE || gameState.currentRound === Round.FINISH || gameState.currentRound === Round.SPEED_UP) &&
            <div className="bg-gray-700 p-4 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-3 border-b border-gray-600 pb-2">Round-Specific Controls</h2>
              {gameState.currentRound === Round.WARM_UP && (
                <div>
                  <h3 className="font-semibold mb-2">"Khởi động" Question Control</h3>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => socket.navigateWarmUpQuestion('prev')} className="bg-gray-500 hover:bg-gray-400 px-3 py-1 rounded">Prev Question</button>
                    <button onClick={() => socket.navigateWarmUpQuestion('next')} className="bg-green-500 hover:bg-green-400 px-3 py-1 rounded">Next Question</button>
                  </div>
                </div>
              )}
              {gameState.currentRound === Round.OBSTACLE && (
                <div>
                  <h3 className="font-semibold mb-2">"Chướng ngại vật" Controls</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => socket.showObstacle()}
                      disabled={gameState.currentEasyQuestion !== -1}
                      className="bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded-md font-semibold disabled:bg-gray-500"
                    >
                      Show Obstacle
                    </button>
                    <button
                      onClick={() => socket.hideObstacle()}
                      disabled={gameState.currentEasyQuestion === -1}
                      className="bg-pink-600 hover:bg-pink-500 px-3 py-1 rounded-md font-semibold disabled:bg-gray-500"
                    >
                      Hide Obstacle
                    </button>
                  </div>
                  <div className="space-y-2">
                    {[0, 1, 2, 3,4,5,6,7].map(i => (
                      <div key={i} className="flex gap-2 items-center">
                        <span className="font-bold w-16">Clue {i + 1}:</span>
                        <button
                          onClick={() => {socket.revealClue(i); socket.playSound('show_question.mp3');}}
                          disabled={gameState.revealedClues[i]}
                          className="bg-cyan-600 hover:bg-cyan-500 px-3 py-1 rounded-md font-semibold disabled:bg-gray-500"
                        >
                          Reveal Clue
                        </button>
                        <button
                          onClick={() => socket.revealAnswer(i)}
                          disabled={gameState.revealedAnswers[i]}
                          className="bg-teal-600 hover:bg-teal-500 px-3 py-1 rounded-md font-semibold disabled:bg-gray-500"
                        >
                          Reveal Answer
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {gameState.currentRound === Round.SPEED_UP && (
                <div>
                  <h3 className="font-semibold mb-2">"Tăng tốc" Video Control</h3>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => socket.navigateTangTocVideo('prev')} className="bg-gray-500 hover:bg-gray-400 px-3 py-1 rounded">Prev Video</button>
                    <button onClick={() => socket.navigateTangTocVideo('next')} className="bg-purple-500 hover:bg-purple-400 px-3 py-1 rounded">Next Video</button>
                  </div>
                </div>
              )}
              {gameState.currentRound === Round.FINISH && (
                <div>
                  <h3 className="font-semibold mb-2">"Về đích" Question Control</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <button onClick={() => socket.navigateQuestion('easy', 'prev')} className="bg-gray-500 hover:bg-gray-400 px-3 py-1 rounded">Prev Easy</button>
                    <button onClick={() => { socket.navigateQuestion('easy', 'next'); socket.playSound('show_question.mp3'); }} className="bg-green-500 hover:bg-green-400 px-3 py-1 rounded">Next Easy</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => socket.navigateQuestion('hard', 'prev')} className="bg-gray-500 hover:bg-gray-400 px-3 py-1 rounded">Prev Hard</button>
                    <button onClick={() => { socket.navigateQuestion('hard', 'next'); socket.playSound('show_question.mp3'); }} className="bg-red-500 hover:bg-red-400 px-3 py-1 rounded">Next Hard</button>
                  </div>
                </div>
              )}
            </div>
          }
        </div>

        {/* Player List & Management */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-gray-700 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-3 border-b border-gray-600 pb-2">Players ({gameState.players.length})</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {gameState.players.map(p => <PlayerControls key={p.id} player={p} />)}
            </div>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-3 border-b border-gray-600 pb-2">Buzzer Queue</h2>
            <ul className="list-decimal list-inside">
              {gameState.buzzerQueue.map((playerId, index) => {
                const player = gameState.players.find(p => p.id === playerId);
                return <li key={playerId} className="text-lg">{index + 1}. {player?.name || 'Unknown'}</li>;
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;