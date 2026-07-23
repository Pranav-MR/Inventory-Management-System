import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { signAccessToken } from '../lib/jwt.js';
import { env } from '../lib/env.js';
import { ConflictError } from '../lib/errors.js';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_BYTES = 48;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function refreshTokenExpiry(): Date {
  return new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);
}

export class AuthError extends Error {}

export async function signup(input: { email: string; password: string; name?: string }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError('Email already in use');

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email: input.email, passwordHash, name: input.name },
  });

  return issueSession(user.id);
}

export async function login(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new AuthError('Invalid email or password');

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new AuthError('Invalid email or password');

  return issueSession(user.id);
}

async function issueSession(userId: string) {
  const accessToken = signAccessToken({ userId });
  const refreshToken = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshTokenExpiry(),
    },
  });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return { accessToken, refreshToken, user };
}

export async function rotateRefreshToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    throw new AuthError('Invalid refresh token');
  }

  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  return issueSession(existing.userId);
}

export async function revokeRefreshToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function updateProfile(
  userId: string,
  input: { name?: string; currentPassword?: string; newPassword?: string },
) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const data: { name?: string; passwordHash?: string } = {};
  if (input.name !== undefined) {
    data.name = input.name;
  }

  if (input.newPassword) {
    const valid = await bcrypt.compare(input.currentPassword ?? '', user.passwordHash);
    if (!valid) throw new AuthError('Current password is incorrect');
    data.passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
  }

  return prisma.user.update({ where: { id: userId }, data });
}
