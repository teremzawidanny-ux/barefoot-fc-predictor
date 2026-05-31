import { sign, verify } from 'hono/jwt';
import { env } from '../env';

export interface SessionPayload {
  participantId: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

export async function signToken(payload: Omit<SessionPayload, 'iat' | 'exp'>): Promise<string> {
  return sign(
    {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    },
    env.JWT_SECRET
  );
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const decoded = await verify(token, env.JWT_SECRET, 'HS256');
    return decoded as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function isAdminEmail(email: string): boolean {
  const adminEmails = env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}
