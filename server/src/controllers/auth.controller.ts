import type { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service.js';
import { env } from '../lib/env.js';

const REFRESH_COOKIE_NAME = 'refreshToken';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api/auth',
    maxAge: env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
  };
}

function toUserDto(user: { id: string; email: string; name: string | null; timezone: string }) {
  return { id: user.id, email: user.email, name: user.name, timezone: user.timezone };
}

export async function signup(req: Request, res: Response) {
  const input = signupSchema.parse(req.body);
  const { accessToken, refreshToken, user } = await authService.signup(input);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  res.status(201).json({ accessToken, user: toUserDto(user) });
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const { accessToken, refreshToken, user } = await authService.login(input);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  res.json({ accessToken, user: toUserDto(user) });
}

export async function refresh(req: Request, res: Response) {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!rawToken) {
    res.status(401).json({ error: 'Missing refresh token' });
    return;
  }
  const { accessToken, refreshToken } = await authService.rotateRefreshToken(rawToken);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  res.json({ accessToken });
}

export async function logout(req: Request, res: Response) {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (rawToken) {
    await authService.revokeRefreshToken(rawToken);
  }
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  const user = await authService.getUserById(req.userId!);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(toUserDto(user));
}
