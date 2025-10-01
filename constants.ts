
import { Round } from './types';

export const ADMIN_CODE = 'admin2425';

export const ROUND_COLORS: { [key in Round]: string } = {
  [Round.LOBBY]: 'bg-gray-700',
  [Round.WARM_UP]: 'bg-green-600',
  [Round.OBSTACLE]: 'bg-blue-600',
  [Round.SPEED_UP]: 'bg-purple-600',
  [Round.FINISH]: 'bg-red-600',
};

export const ROUND_BORDER_COLORS: { [key in Round]: string } = {
  [Round.LOBBY]: 'border-gray-500',
  [Round.WARM_UP]: 'border-green-400',
  [Round.OBSTACLE]: 'border-blue-400',
  [Round.SPEED_UP]: 'border-purple-400',
  [Round.FINISH]: 'border-red-400',
};
