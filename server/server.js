
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// --- Constants ---
const ROUNDS = {
  LOBBY: 'LOBBY',
  WARM_UP: 'Khởi động',
  OBSTACLE: 'Chướng ngại vật',
  SPEED_UP: 'Tăng tốc',
  FINISH: 'Về đích',
};
const DB_PATH = path.join(__dirname, 'db.json');
const QUESTIONS_PATH = path.join(projectRoot, 'data', 'questions.json');


// --- Server Setup ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});

// API endpoint for health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Olympia Game Show Backend is running' });
});

// API endpoint for game status
app.get('/api/status', (req, res) => {
  res.json({ 
    gameState: gameState,
    isConnected: true,
    players: gameState.players.length
  });
});

// --- Game State Management ---
let questions;
let gameState;
let timerInterval = null;

const defaultState = {
  isGameStarted: false,
  currentRound: ROUNDS.LOBBY,
  players: [],
  buzzerQueue: [],
  timer: 0,
  activePlayerId: undefined,
  currentEasyQuestion: -1,
  currentHardQuestion: -1,
  revealedClues: [false, false, false, false],
  revealedAnswers: [false, false, false, false],
  showSpeedUpAnswers: false,
  finishQuestionType: '20p',
};

function loadState() {
  try {
    // Load questions
    const questionsData = fs.readFileSync(QUESTIONS_PATH, 'utf-8');
    questions = JSON.parse(questionsData);

    // Load game state from DB
    if (fs.existsSync(DB_PATH)) {
      const dbData = fs.readFileSync(DB_PATH, 'utf-8');
      const persistedState = JSON.parse(dbData);
      // Combine default state with persisted players and game status
      gameState = { ...defaultState, ...persistedState };
    } else {
      gameState = { ...defaultState };
    }
  } catch (error) {
    console.error("Error loading state:", error);
    questions = {};
    gameState = { ...defaultState };
  }
}

function saveState() {
  try {
    // Persist key parts of the game state
    const persistentState = {
      players: gameState.players,
      isGameStarted: gameState.isGameStarted,
      currentRound: gameState.currentRound,
      currentEasyQuestion: gameState.currentEasyQuestion,
      currentHardQuestion: gameState.currentHardQuestion,
      revealedClues: gameState.revealedClues,
      revealedAnswers: gameState.revealedAnswers,
      showSpeedUpAnswers: gameState.showSpeedUpAnswers,
      activePlayerId: gameState.activePlayerId,
      finishQuestionType: gameState.finishQuestionType,
    };
    fs.writeFile(DB_PATH, JSON.stringify(persistentState, null, 2), (err) => {
      if (err) console.error("Error saving state:", err);
    });
  } catch (error) {
    console.error("Error preparing state for saving:", error);
  }
}

// --- Socket.IO Logic ---
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Send initial state to the new client
  socket.emit('init', { gameState, questions });

  const broadcastState = () => {
    io.emit('gameStateUpdate', gameState);
  };

  // Player Actions
  socket.on('joinGame', ({ name, id }) => {
    try {
      if (gameState.isGameStarted || gameState.players.find(p => p.id === id)) return;
      const newPlayer = { id, name, score: 0 };
      gameState.players.push(newPlayer);
      saveState();
      broadcastState();
    } catch (e) { console.error('joinGame Error:', e); }
  });

  socket.on('buzz', ({ playerId }) => {
    try {
      if (!gameState.buzzerQueue.includes(playerId)) {
        gameState.buzzerQueue.push(playerId);
        broadcastState();
        // Broadcast a dedicated buzz event so clients can play a sound
        io.emit('buzzed', { playerId });
      }
    } catch (e) { console.error('buzz Error:', e); }
  });

  socket.on('submitSpeedUpAnswer', ({ playerId, answer }) => {
    try {
      const player = gameState.players.find(p => p.id === playerId);
      if (player) {
        player.speedUpAnswer = answer;
        broadcastState();
      }
    } catch (e) { console.error('submitSpeedUpAnswer Error:', e); }
  });

  socket.on('toggleStarOfHope', ({ playerId }) => {
    try {
      const player = gameState.players.find(p => p.id === playerId);
      if (player) {
        player.hasStarOfHope = !player.hasStarOfHope;
        broadcastState();
      }
    } catch (e) { console.error('toggleStarOfHope Error:', e); }
  });

  // Admin Actions
  socket.on('startGame', () => {
    try {
      gameState.isGameStarted = true;
      saveState();
      broadcastState();
    } catch (e) { console.error('startGame Error:', e); }
  });

  socket.on('endGame', () => {
    try {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }

      // Preserve players but reset their scores and round-specific data
      const resetPlayers = gameState.players.map(p => ({
        id: p.id,
        name: p.name,
        score: 0,
      }));

      // Reset the game state to its default values
      gameState = { ...defaultState };

      // Restore the player list with reset scores
      gameState.players = resetPlayers;

      saveState();
      broadcastState();
    } catch (e) { console.error('endGame Error:', e) }
  });

  socket.on('switchRound', ({ round }) => {
    try {
      gameState.currentRound = round;
      gameState.buzzerQueue = [];
      gameState.timer = 0;
      gameState.revealedClues = [false, false, false, false];
      gameState.revealedAnswers = [false, false, false, false];
      gameState.showSpeedUpAnswers = false;

      // Reset question indices to -1 to show intro screen on the frontend
      gameState.currentEasyQuestion = -1;
      gameState.currentHardQuestion = -1;

      gameState.players.forEach(p => {
        p.speedUpAnswer = '';
        p.hasStarOfHope = false;
      });
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = null;
      broadcastState();
    } catch (e) { console.error('switchRound Error:', e); }
  });

  socket.on('startTimer', ({ seconds }) => {
    try {
      gameState.timer = seconds;
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        gameState.timer -= 1;
        if (gameState.timer <= 0) {
          if (timerInterval) clearInterval(timerInterval);
          timerInterval = null;
          gameState.timer = 0;
        }
        broadcastState();
      }, 1000);
      broadcastState();
    } catch (e) { console.error('startTimer Error:', e); }
  });

  socket.on('navigateQuestion', ({ type, direction }) => {
    try {
      if (!questions) return;
      const veDich = questions.VeDich || {};
      const easySet = veDich.easy || veDich['20p'] || [];
      const hardSet = veDich.hard || veDich['30p'] || [];

      if (type === 'easy') {
        const newIndex = gameState.currentEasyQuestion + (direction === 'next' ? 1 : -1);
        if (newIndex >= 0 && newIndex < easySet.length) {
          gameState.currentEasyQuestion = newIndex;
        }
      } else {
        const newIndex = gameState.currentHardQuestion + (direction === 'next' ? 1 : -1);
        if (newIndex >= 0 && newIndex < hardSet.length) {
          gameState.currentHardQuestion = newIndex;
        }
      }
      gameState.finishQuestionType = type;
      broadcastState();
    } catch (e) { console.error('navigateQuestion Error:', e); }
  });

  socket.on('navigateTangTocVideo', ({ direction }) => {
    try {
      if (!questions || gameState.currentRound !== ROUNDS.SPEED_UP) return;
      const videoCount = questions.TangToc.length;
      const newIndex = gameState.currentEasyQuestion + (direction === 'next' ? 1 : -1);
      if (newIndex >= 0 && newIndex < videoCount) {
        gameState.currentEasyQuestion = newIndex;
        // Reset state for the new Speed Up question
        gameState.showSpeedUpAnswers = false;
        gameState.players.forEach(p => {
          p.speedUpAnswer = '';
        });
      }
      broadcastState();
    } catch (e) { console.error('navigateTangTocVideo Error:', e); }
  });

  socket.on('navigateWarmUpQuestion', ({ direction }) => {
    try {
      if (!questions || gameState.currentRound !== ROUNDS.WARM_UP) return;
      const questionCount = questions.KhoiDong.length;
      const newIndex = gameState.currentEasyQuestion + (direction === 'next' ? 1 : -1);
      if (newIndex >= 0 && newIndex < questionCount) {
        gameState.currentEasyQuestion = newIndex;
      }
      broadcastState();
    } catch (e) { console.error('navigateWarmUpQuestion Error:', e); }
  });

  socket.on('revealClue', ({ index }) => {
    try {
      if (index >= 0 && index < 8) {
        gameState.revealedClues[index] = true;
        broadcastState();
      }
    } catch (e) { console.error('revealClue Error:', e); }
  });

  socket.on('revealAnswer', ({ index }) => {
    try {
      if (index >= 0 && index < 8) {
        gameState.revealedAnswers[index] = true;
        broadcastState();
      }
    } catch (e) { console.error('revealAnswer Error:', e); }
  });

  socket.on('revealAnswers', () => {
    try {
      gameState.showSpeedUpAnswers = true;
      broadcastState();
    } catch (e) { console.error('revealAnswers Error:', e); }
  });

  socket.on('showObstacle', () => {
    try {
      if (gameState.currentRound === ROUNDS.OBSTACLE) {
        gameState.currentEasyQuestion = 0; // Move from intro (-1) to main content (0)
        broadcastState();
      }
    } catch (e) { console.error('showObstacle Error:', e); }
  });

  socket.on('hideObstacle', () => {
    try {
      if (gameState.currentRound === ROUNDS.OBSTACLE) {
        gameState.currentEasyQuestion = -1; // Move back to intro state
        broadcastState();
      }
    } catch (e) { console.error('hideObstacle Error:', e); }
  });

  socket.on('updateScore', ({ playerId, delta }) => {
    try {
      const player = gameState.players.find(p => p.id === playerId);
      if (player) {
        player.score += delta;
        saveState();
        // Instead of broadcasting the whole state, emit a specific event
        io.emit('scoreUpdated', { playerId, newScore: player.score });
      }
    } catch (e) { console.error('updateScore Error:', e); }
  });

  socket.on('setActivePlayer', ({ playerId }) => {
    try {
      gameState.activePlayerId = playerId;
      broadcastState();
    } catch (e) { console.error('setActivePlayer Error:', e); }
  });

  socket.on('kickPlayer', ({ playerId }) => {
    try {
      gameState.players = gameState.players.filter(p => p.id !== playerId);
      saveState();
      broadcastState();
    } catch (e) { console.error('kickPlayer Error:', e); }
  });

  socket.on('resetBuzzer', () => {
    try {
      gameState.buzzerQueue = [];
      broadcastState();
    } catch (e) { console.error('resetBuzzer Error:', e); }
  });

  // Generic sound broadcast: clients will play a file from public/assets/sounds
  socket.on('playSound', ({ name }) => {
    try {
      if (typeof name !== 'string' || !name) return;
      io.emit('playSound', { name });
    } catch (e) { console.error('playSound Error:', e); }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  loadState();
  console.log(`Olympia server running on port ${PORT}`);
});