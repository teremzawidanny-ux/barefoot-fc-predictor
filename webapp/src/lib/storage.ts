import { api } from './api';
import { setToken, clearSession, getToken } from './auth';
import { Participant, Match, Prediction, LeaderboardEntry } from './types';

const PARTICIPANT_KEY = 'barefoot_current_participant';

// ── Session ──────────────────────────────────────────────────────────

export function getCurrentParticipant(): Participant | null {
  try {
    const raw = localStorage.getItem(PARTICIPANT_KEY);
    return raw ? (JSON.parse(raw) as Participant) : null;
  } catch {
    return null;
  }
}

export function setCurrentParticipant(p: Participant): void {
  localStorage.setItem(PARTICIPANT_KEY, JSON.stringify(p));
}

export function clearCurrentParticipant(): void {
  clearSession();
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export async function verifySession(): Promise<{ participant: Participant; isAdmin: boolean } | null> {
  if (!getToken()) return null;
  try {
    const result = await api.get<{ participant: Participant; isAdmin: boolean }>('/api/auth/me');
    setCurrentParticipant(result.participant);
    return result;
  } catch {
    clearSession();
    return null;
  }
}

// ── Participants ──────────────────────────────────────────────────────

export async function joinParticipant(data: {
  fullName: string; displayName: string; email: string;
  phone?: string; city?: string; country?: string; favoriteTeam?: string;
}): Promise<{ participant: Participant; token: string; isAdmin: boolean }> {
  const result = await api.post<{ participant: Participant; token: string; isAdmin: boolean }>('/api/auth/join', data);
  setToken(result.token);
  setCurrentParticipant(result.participant);
  return result;
}

export async function loginParticipant(email: string): Promise<{ participant: Participant; token: string; isAdmin: boolean }> {
  const result = await api.post<{ participant: Participant; token: string; isAdmin: boolean }>('/api/auth/login', { email });
  setToken(result.token);
  setCurrentParticipant(result.participant);
  return result;
}

// ── Matches ───────────────────────────────────────────────────────────

export async function getMatches(): Promise<Match[]> {
  return api.get<Match[]>('/api/matches');
}

// Admin only
export async function adminGetMatches(): Promise<Match[]> {
  return api.get<Match[]>('/api/admin/matches');
}

export async function adminUpdateMatch(matchId: string, update: Partial<Match>): Promise<Match> {
  return api.put<Match>(`/api/admin/matches/${matchId}`, update);
}

export async function adminRecalculate(): Promise<{ recalculated: number }> {
  return api.post<{ recalculated: number }>('/api/admin/recalculate');
}

// ── Predictions ───────────────────────────────────────────────────────

export async function getMyPredictions(): Promise<Prediction[]> {
  if (!getToken()) return [];
  try {
    return await api.get<Prediction[]>('/api/predictions/mine');
  } catch {
    return [];
  }
}

export async function savePrediction(
  data: { matchId: string; team1ScorePredicted: number; team2ScorePredicted: number; winnerPredicted: string; methodPredicted: string },
  existingId?: string
): Promise<Prediction> {
  if (existingId) {
    return api.put<Prediction>(`/api/predictions/${existingId}`, data);
  }
  return api.post<Prediction>('/api/predictions', data);
}

// ── Leaderboard ───────────────────────────────────────────────────────

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return api.get<LeaderboardEntry[]>('/api/leaderboard');
}

// ── Legacy compatibility stubs (kept so nothing breaks during transition) ──

export function getParticipants(): Participant[] { return []; }
export function saveParticipant(_p: Participant): void {}
export function initializeMatches(_m: Match[]): void {}
export function initializePredictions(_p: Prediction[]): void {}
export function getMatches_sync(): Match[] { return []; }
export function getPredictions(): Prediction[] { return []; }
export function saveMatch(_m: Match): void {}
