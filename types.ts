
export enum Round {
  LOBBY = 'LOBBY',
  WARM_UP = 'Khởi động',
  OBSTACLE = 'Chướng ngại vật',
  SPEED_UP = 'Tăng tốc',
  FINISH = 'Về đích',
}

export interface Player {
  id: string;
  name: string;
  score: number;
  hasStarOfHope?: boolean;
  speedUpAnswer?: string;
  // ISO timestamp when player submitted Speed Up answer
  speedUpAnswerAt?: string;
  obstacleAnswer?: string;
  // ISO timestamp when player submitted Obstacle answer
  obstacleAnswerAt?: string;
}

export interface GameState {
  isGameStarted: boolean;
  currentRound: Round;
  players: Player[];
  buzzerQueue: string[]; // array of player IDs
  timer: number;
  activePlayerId?: string; // For Warm Up and Finish rounds

  // Question indices
  currentEasyQuestion: number;
  currentHardQuestion: number;

  // Obstacle round state
  revealedClues: boolean[]; // For Obstacle round
  revealedAnswers: boolean[]; // For Obstacle round answers

  // Speed Up round state
  showSpeedUpAnswers: boolean;

  // Obstacle round state
  showPlayerAnswers: boolean;

  // Finish round state
  finishQuestionType: '20đ' | '30đ';
}

// Question types
export interface WarmUpQuestion {
  question: string;
  options?: string[];
}

export interface ObstacleData {
  img: string;
  keyword: string;
  clues: { question: string; answer: string; }[];
}

export interface SpeedUpQuestion {
  video: string;
}

export interface FinishQuestion {
  question: string;
}

export interface VeDichQuestions {
  easy: FinishQuestion[];
  hard: FinishQuestion[];
}

export interface QuestionData {
  KhoiDong: WarmUpQuestion[];
  ChuongNgaiVat: ObstacleData;
  TangToc: SpeedUpQuestion[];
  VeDich: VeDichQuestions;
}