import type { MiddlewareHandler } from 'hono';
import { verifyToken } from '../lib/jwt';

declare module 'hono' {
  interface ContextVariableMap {
    participantId: string;
    participantEmail: string;
    participantDisplayName: string;
    isAdmin: boolean;
  }
}

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }, 401);
  }
  const payload = await verifyToken(authHeader.slice(7));
  if (!payload) {
    return c.json({ error: { message: 'Invalid or expired token', code: 'INVALID_TOKEN' } }, 401);
  }
  c.set('participantId', payload.participantId);
  c.set('participantEmail', payload.email);
  c.set('participantDisplayName', payload.displayName);
  c.set('isAdmin', payload.isAdmin);
  await next();
};

export const requireAdmin: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }, 401);
  }
  const payload = await verifyToken(authHeader.slice(7));
  if (!payload) {
    return c.json({ error: { message: 'Invalid or expired token', code: 'INVALID_TOKEN' } }, 401);
  }
  if (!payload.isAdmin) {
    return c.json({ error: { message: 'Forbidden — admin access required', code: 'FORBIDDEN' } }, 403);
  }
  c.set('participantId', payload.participantId);
  c.set('participantEmail', payload.email);
  c.set('participantDisplayName', payload.displayName);
  c.set('isAdmin', true);
  await next();
};
