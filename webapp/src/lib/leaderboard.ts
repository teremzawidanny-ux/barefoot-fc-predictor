import { LeaderboardEntry } from './types';
import { getLeaderboard } from './storage';

export async function calculateLeaderboard(): Promise<LeaderboardEntry[]> {
  return getLeaderboard();
}
