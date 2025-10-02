
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { Player, Round, GameState, QuestionData } from '../types';
import { ROUND_COLORS, ROUND_BORDER_COLORS } from '../constants';

interface GameScreenProps {
  isPlayerView: boolean;
}

const VideoFrame: React.FC<{ src: string }> = React.memo(({ src }) => {
  const isYouTube = /youtube\.com\/embed\//.test(src) || /youtu\.be\//.test(src);
  if (isYouTube) {
    return (
      <iframe
        src={src}
        title="Speed up video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full rounded-lg"
      />
    );
  }
  return (
    <video
      src={src}
      className="absolute top-0 left-0 w-full h-full object-contain rounded-lg"
      autoPlay
      muted
      loop
      playsInline
    />
  );
});

// Extracted to prevent re-renders on parent state changes
const PlayerCard: React.FC<{
  player: Player,
  isBuzzerWinner: boolean,
  isActivePlayer: boolean,
  currentRound: Round,
  showSpeedUpAnswers: boolean
}> = React.memo(({ player, isBuzzerWinner, isActivePlayer, currentRound, showSpeedUpAnswers }) => {
  return (
    <div className={`p-3 rounded-lg transition-all duration-300 ${isBuzzerWinner ? 'bg-yellow-500 text-black scale-105 shadow-lg' : 'bg-gray-800 bg-opacity-40'} ${isActivePlayer ? 'border-2 border-red-300' : 'border-2 border-yellow-200 shadow-[0_0_15px_rgba(255,255,0,0.6)] bg-black bg-opacity-50'}`}>
      <div className="flex justify-between items-center">
        <span className="font-bold text-lg">{player.name} {player.hasStarOfHope && '🌟'}</span>
        <span className="font-bold text-2xl">{player.score}</span>
      </div>
      {currentRound === Round.SPEED_UP && showSpeedUpAnswers && (
        <p className="text-sm mt-1 bg-gray-700 p-2 rounded">Answer: {player.speedUpAnswer || ''}</p>
      )}
      {currentRound === Round.OBSTACLE && player.obstacleAnswer && (
        <p className="text-sm mt-1 bg-gray-700 p-2 rounded">Answer: {player.obstacleAnswer}</p>
      )}
    </div>
  );
});

// New component to render black boxes for the answer length
const AnswerBoxes: React.FC<{ answer: string }> = React.memo(({ answer }) => {
  return (
    <div className="flex flex-wrap items-center gap-1 mt-2">
      {answer.split('').map((char, index) => {
        if (char === ' ') {
          return <div key={index} className="w-5 h-8" />; // A gap for a space
        }
        if (char === '/') {
          return (
            <div key={index} className="w-5 h-8 flex items-center justify-center text-xl font-bold">
              /
            </div>
          );
        }
        return (
          <div
            key={index}
            className="w-5 h-8 bg-black border border-gray-400 rounded-sm"
          />
        );
      })}
    </div>
  );
});


// Extracted to prevent re-renders and added intro screen logic
const RoundDisplay: React.FC<{
  currentRound: Round,
  gameState: GameState,
  questions: QuestionData
}> = React.memo(({ currentRound, gameState, questions }) => {

  const IntroScreen = () => {
    const videoMap: Partial<{ [key in Round]: { src: string, title: string } }> = {
      [Round.WARM_UP]: { src: "/assets/videos/khoi_dong.mp4", title: "Intro phần thi Khởi động" },
      [Round.OBSTACLE]: { src: "/assets/videos/vuot_chuong_ngoai_vat.mp4", title: "Intro phần thi Vượt chướng ngại vật" },
      [Round.SPEED_UP]: { src: "/assets/videos/tang_toc.mp4", title: "Intro phần thi Tăng tốc" },
      [Round.FINISH]: { src: "/assets/videos/ve_dich.mp4", title: "Intro phần thi Về đích" },
    };

    const video = videoMap[currentRound];

    if (video) {
      return (
        <div className="relative w-full max-w-4xl aspect-video overflow-hidden">
          <video
            src={video.src}
            title={video.title}
            className="absolute top-1/2 left-1/2 min-w-full min-h-full -translate-x-1/2 -translate-y-1/2"
            frameBorder="0"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            controls
          />
        </div>
      );
    }
    return null;
  };

  const isIntro =
    (currentRound === Round.WARM_UP && gameState.currentEasyQuestion === -1) ||
    (currentRound === Round.OBSTACLE && gameState.currentEasyQuestion === -1) ||
    (currentRound === Round.SPEED_UP && gameState.currentEasyQuestion === -1) ||
    (currentRound === Round.FINISH && gameState.currentEasyQuestion === -1 && gameState.currentHardQuestion === -1);

  if (isIntro) {
    return <IntroScreen />;
  }

  const getPlayerById = (playerId: string) => gameState.players.find(p => p.id === playerId);

  switch (currentRound) {
    case Round.LOBBY:
      return <div className="text-center"><h2 className="text-4xl">Waiting for the game to start...</h2></div>
    case Round.WARM_UP: {
      const activePlayer = getPlayerById(gameState.activePlayerId || '');
      if (!activePlayer) return <p>Waiting for admin to select a player...</p>;
      const question = questions.KhoiDong[gameState.currentEasyQuestion % questions.KhoiDong.length];
      return (
        <div>
          <p className="text-3xl bg-gray-700 p-6 rounded-lg">{question.question}</p>
          {question.options && question.options.length > 0 ? (
            <div className="space-y-3 mt-4">
              {question.options.map((option, index) => (
                <p key={index} className="text-xl pl-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200">
                  {option}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      );
    }
    case Round.OBSTACLE: {
      const data = questions.ChuongNgaiVat;
      return (
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4 uppercase">Từ khóa cần tìm gồm 4 chữ</h2>
          <div className="relative mb-4">
            <img src={"/assets/imgs/obstacle.png"} alt="Obstacle" className="w-full max-w-2xl mx-auto rounded-lg shadow-lg" />
            {/* 2x2 numbered black boxes overlay; hide each when its clue is revealed */}
            <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none">
              <div className="w-full max-w-2xl h-full grid grid-cols-4 grid-rows-2"> {/* Đảm bảo grid này bao phủ hoàn hảo ảnh */}
                {data.clues.slice(0, 8).map((_, i) => (
                  <div
                    key={i}
                    className={`
                        flex items-center justify-center
                        bg-black text-white text-4xl font-extrabold border border-gray-500
                        transition-opacity duration-300 ease-in-out
                        ${gameState.revealedAnswers[i] ? 'opacity-0' : 'opacity-100'}
                    `}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            {data.clues.map((clue, index) => (
              <div key={index} className={`p-4 rounded-lg transition-colors duration-300 ${gameState.revealedClues[index] ? 'bg-blue-800' : 'bg-gray-700'}`}>
                <h4 className="font-bold">Hình số {index + 1}</h4>
                {gameState.revealedClues[index] ? (
                  <>
                    <p>{clue.question}</p>
                    {gameState.revealedAnswers[index] && (
                      <p className="mt-2 pt-2 border-t border-blue-600 font-bold text-yellow-300">Answer: {clue.answer}</p>
                    )}
                  </>
                ) : <AnswerBoxes answer={clue.answer} />}
              </div>
            ))}
          </div>
        </div>
      );
    }
    case Round.SPEED_UP: {
      const video = questions.TangToc[gameState.currentEasyQuestion % questions.TangToc.length];
      return (
        <div className="w-full max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-4">Speed Up!</h2>
          <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 Aspect Ratio */ }}>
            <VideoFrame key={video.video} src={video.video} />
          </div>
        </div>
      );
    }
    case Round.FINISH: {
      const veDich = questions.VeDich as any;
      const easySet = veDich.easy || veDich['20p'];
      const hardSet = veDich.hard || veDich['30p'];
      const questionSet = gameState.finishQuestionType === 'easy' ? easySet : hardSet;
      const index = gameState.finishQuestionType === 'easy' ? gameState.currentEasyQuestion : gameState.currentHardQuestion;
      const question = questionSet[index % questionSet.length];
      const activePlayer = getPlayerById(gameState.activePlayerId || '');

      if (!activePlayer) return <p>Waiting for admin to select a player...</p>;

      return (
        <div>
          <h3 className="text-2xl font-bold mb-4">Player: <span className="text-yellow-400">{activePlayer.name}</span></h3>
          <p className="text-3xl bg-gray-700 p-6 rounded-lg">
            <span className={`font-bold ${gameState.finishQuestionType === 'easy' ? 'text-green-400' : 'text-red-400'}`}>

            </span>
            {" "}{question.question}
          </p>
        </div>
      );
    }
    default:
      return <h2 className="text-4xl">Xã Hội Chủ Nghĩa</h2>
  }
});

const GameScreen: React.FC<GameScreenProps> = ({ isPlayerView }) => {
  const { gameState, socket, questions } = useGame();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [speedUpAnswer, setSpeedUpAnswer] = useState('');
  const [obstacleAnswer, setObstacleAnswer] = useState('');

  useEffect(() => {
    if (isPlayerView) {
      const storedPlayer = localStorage.getItem('olympiaPlayer');
      if (!storedPlayer) {
        navigate('/');
        return;
      }
      const parsedPlayer = JSON.parse(storedPlayer);
      if (parsedPlayer.id !== id) {
        navigate('/');
        return;
      }
      const playerInState = gameState?.players.find(p => p.id === id);
      if (gameState && !playerInState && gameState.isGameStarted) {
        alert("You are no longer in the game.");
        localStorage.removeItem('olympiaPlayer');
        navigate('/');
      } else if (playerInState) {
        setCurrentPlayer(playerInState);
      }
    }
  }, [id, isPlayerView, navigate, gameState]);

  // Clear local answer input when the Speed Up question changes
  useEffect(() => {
    if (gameState?.currentRound === Round.SPEED_UP) {
      setSpeedUpAnswer('');
    }
  }, [gameState?.currentEasyQuestion, gameState?.currentRound]);

  // Clear local obstacle answer input when the Obstacle round changes or when obstacle answers are cleared
  useEffect(() => {
    if (gameState?.currentRound === Round.OBSTACLE) {
      setObstacleAnswer('');
    }
  }, [gameState?.currentRound]);

  // Clear local obstacle answer input when server clears obstacle answers (showObstacle called)
  useEffect(() => {
    if (gameState?.currentRound === Round.OBSTACLE && currentPlayer) {
      const playerInState = gameState.players.find(p => p.id === currentPlayer.id);
      if (playerInState && !playerInState.obstacleAnswer) {
        setObstacleAnswer('');
      }
    }
  }, [gameState?.players, currentPlayer, gameState?.currentRound]);

  if (!gameState || !questions) {
    return <div className="flex items-center justify-center min-h-screen text-2xl">Connecting to the game...</div>;
  }

  const { currentRound, players, timer, buzzerQueue } = gameState;

  const getPlayerById = (playerId: string) => players.find(p => p.id === playerId);

  const handleBuzz = () => {
    if (currentPlayer) {
      try {
        socket.buzz(currentPlayer.id);
      } catch (error) {
        console.error("Failed to buzz:", error);
      }
    }
  };

  const handleSubmitAnswer = () => {
    if (currentPlayer) {
      try {
        if (currentRound === Round.SPEED_UP) {
          socket.submitSpeedUpAnswer(currentPlayer.id, speedUpAnswer);
        } else if (currentRound === Round.OBSTACLE) {
          socket.submitObstacleAnswer(currentPlayer.id, obstacleAnswer);
        }
        // Don't clear answer here, let it be controlled by server state if needed
        // setSpeedUpAnswer(''); 
      } catch (error) {
        console.error("Failed to submit answer:", error);
      }
    }
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-cover bg-center" style={{ backgroundImage: "url('/assets/imgs/bg.jpg')" }}>
      {/* Main Content */}
      <main className="flex-grow-[3] max-w-[calc(100vh+400px)] p-4 md:p-8 flex flex-col" >
        <header className={`p-4 rounded-t-xl text-center ${ROUND_COLORS[currentRound]}`}>
          <h1 className="text-3xl font-bold">{currentRound}</h1>
        </header>
        <div className={`flex-1 p-6 md:p-8 bg-gray-800 bg-opacity-60 rounded-b-xl border-t-4 ${ROUND_BORDER_COLORS[currentRound]} flex items-center justify-center`}>
          <RoundDisplay
            currentRound={currentRound}
            gameState={gameState}
            questions={questions}
          />
        </div>

        {isPlayerView && currentPlayer && (
          <div className="mt-4 bg-gray-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-4">
            {(currentRound === Round.OBSTACLE || currentRound === Round.FINISH || currentRound === Round.WARM_UP) && (
              <button
                onClick={handleBuzz}
                disabled={buzzerQueue.includes(currentPlayer.id)}
                className="w-full sm:w-auto text-2xl font-bold bg-red-600 hover:bg-red-500 text-white py-4 px-10 rounded-full transition transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                <i className="fas fa-bell mr-2"></i>BẤM CHUÔNG
              </button>
            )}
            {(currentRound === Round.OBSTACLE) && gameState.currentEasyQuestion >= 0 && (
              <div className="w-full max-w-xl flex gap-2">
                <input
                  type="text"
                  value={obstacleAnswer}
                  onChange={(e) => setObstacleAnswer(e.target.value)}
                  onKeyUp={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                  placeholder="Type your answer and press Enter"
                  className="flex-grow bg-gray-700 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleSubmitAnswer}
                  className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-lg font-bold"
                >
                  Submit
                </button>
              </div>
            )}

          </div>
        )}
      </main>

      {/* Sidebar */}
      <aside className="flex-grow-[1] w-full lg:w-auto bg-white-900 p-4 md:p-6 flex flex-col gap-6 bg-opacity-20">
        <div>
          <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200 drop-shadow-[0_0_10px_rgba(255,255,0,0.8)]">
            Players</h2>
          <div className="space-y-3 ">
            {players.map(p => {
              const isBuzzerWinner = buzzerQueue.length > 0 && buzzerQueue[0] === p.id;
              const isActivePlayer = gameState.activePlayerId === p.id;
              return <PlayerCard
                key={p.id}
                player={p}
                isBuzzerWinner={isBuzzerWinner}
                isActivePlayer={isActivePlayer}
                currentRound={currentRound}
                showSpeedUpAnswers={gameState.showSpeedUpAnswers}
              />
            })}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200 drop-shadow-[0_0_10px_rgba(255,255,0,0.8)]">
            Buzzer Queue</h2>
          <div className="border-2 border-yellow-400 rounded-xl p-6 shadow-[0_0_15px_rgba(255,255,0,0.6)] bg-black bg-opacity-50">
            {buzzerQueue.length > 0 ? (
              <ol className="list-decimal list-inside space-y-2 ">
                {buzzerQueue.map(pid => (
                  <li key={pid} className="text-lg font-semibold">{getPlayerById(pid)?.name}</li>
                ))}
              </ol>
            ) : <p className="text-gray-400">Buzzer is clear.</p>}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200 drop-shadow-[0_0_10px_rgba(255,255,0,0.8)]">
            Timer</h2>
          <div className="bg-gray-800 p-4 rounded-lg text-center bg-opacity-40">
            <p className="text-6xl font-mono font-bold">{timer}</p>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default GameScreen;
