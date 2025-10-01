
import { io, Socket } from 'socket.io-client';
import { Round } from '../types';

class SocketService {
  private socket: Socket;

  constructor() {
    // Use environment variable for server URL, fallback to localhost for development
    const serverUrl = (import.meta as any).env?.VITE_SERVER_URL || 
      ((import.meta as any).env?.DEV ? 'http://localhost:3001' : 'https://duong-len-dinh-xhcn.onrender.com');
    
    // Explicitly connect to the backend server, defining transports
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect_error', (err) => {
      console.error("Socket connection error:", err.message);
      // You could implement a user-facing error message here
    });
  }

  // Method to listen to events from the server
  on(eventName: string, callback: (data: any) => void) {
    this.socket.on(eventName, callback);
  }

  // Method to remove listeners to prevent memory leaks
  off(eventName: string, callback?: (data: any) => void) {
    if (callback) {
      this.socket.off(eventName, callback);
    } else {
      this.socket.off(eventName);
    }
  }

  // --- Emitters to the server ---

  // Player Actions
  joinGame(name: string, id: string) {
    this.socket.emit('joinGame', { name, id });
  }

  buzz(playerId: string) {
    this.socket.emit('buzz', { playerId });
  }

  submitSpeedUpAnswer(playerId: string, answer: string) {
    this.socket.emit('submitSpeedUpAnswer', { playerId, answer });
  }

  toggleStarOfHope(playerId: string) {
    this.socket.emit('toggleStarOfHope', { playerId });
  }

  // Admin Actions
  startGame() { this.socket.emit('startGame'); }
  endGame() { this.socket.emit('endGame'); }
  switchRound(round: Round) { this.socket.emit('switchRound', { round }); }
  startTimer(seconds: number) { this.socket.emit('startTimer', { seconds }); }
  navigateQuestion(type: 'easy' | 'hard', direction: 'next' | 'prev') { this.socket.emit('navigateQuestion', { type, direction }); }
  navigateTangTocVideo(direction: 'next' | 'prev') { this.socket.emit('navigateTangTocVideo', { direction }); }
  navigateWarmUpQuestion(direction: 'next' | 'prev') { this.socket.emit('navigateWarmUpQuestion', { direction }); }
  revealClue(index: number) { this.socket.emit('revealClue', { index }); }
  revealAnswer(index: number) { this.socket.emit('revealAnswer', { index }); }
  revealAnswers() { this.socket.emit('revealAnswers'); }
  showObstacle() { this.socket.emit('showObstacle'); }
  hideObstacle() { this.socket.emit('hideObstacle'); }
  updateScore(playerId: string, delta: number) { this.socket.emit('updateScore', { playerId, delta }); }
  setActivePlayer(playerId: string) { this.socket.emit('setActivePlayer', { playerId }); }
  kickPlayer(playerId: string) { this.socket.emit('kickPlayer', { playerId }); }
  resetBuzzer() { this.socket.emit('resetBuzzer'); }

  // Broadcast a sound to all clients. 'name' should match a file in public/assets/sounds
  playSound(name: string) { this.socket.emit('playSound', { name }); }
}

// Singleton instance
export const socketService = new SocketService();