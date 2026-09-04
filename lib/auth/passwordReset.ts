// lib/auth/passwordReset.ts
//
// Password reset. Every account on this platform is email + password — no
// working OAuth sign-ins exist — so before this, forgetting a password meant
// permanently losing the account.
import { randomBytes, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

/** Short, because a live reset link in an inbox is a standing key to the account. */
export const RESET_TOKEN_TTL_MINUTES = 60;

/** Per email, per hour. Stops the endpoint being used to mailbomb someone. */
export const RESET_REQUESTS_PER_HOUR = 3;

export const MIN_PASSWORD_LENGTH = 8;

/**
 * SHA-256, not bcrypt.
 *
 * The token is 32 random bytes, so it has no guessable structure for bcrypt's
 * slowness to protect — and lookup needs to find the row by hash, which a
 * per-row bcrypt salt makes impossible without scanning every outstanding
 * reset. Passwords still use bcrypt; this is a different problem.
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('hex');
  return { token, tokenHash: hashToken(token) };
}

/**
 * Issues a reset for an email address, or returns null if we won't.
 *
 * Returning null covers both "no such account" and "asked too many times", and
 * the caller must respond identically either way — a different response would
 * turn this into a way to test which addresses have accounts.
 */
export async function createResetForEmail(
  email: string
): Promise<{ token: string; userId: string; name: string | null } | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true, name: true, passwordHash: true },
  });
  if (!user) return null;

  // Counted on issue time, not expiry. Expiry would also count links that were
  // already consumed, so a user who successfully reset an hour ago would find
  // themselves refused a second, legitimate reset.
  const recent = await prisma.passwordReset.count({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 3_600_000) } },
  });
  if (recent >= RESET_REQUESTS_PER_HOUR) return null;

  // Outstanding links for this account stop working the moment a new one is
  // issued, so a forwarded or intercepted older email is inert.
  await prisma.passwordReset.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const { token, tokenHash } = generateResetToken();
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000),
    },
  });

  return { token, userId: user.id, name: user.name };
}

export type ResetOutcome =
  | { ok: true; userId: string }
  | { ok: false; reason: 'invalid' | 'expired' | 'used' | 'weak' };

/**
 * Consumes a token and sets the new password.
 *
 * Every session is destroyed on success. Someone resetting a password may be
 * doing it because another person has their account — leaving that person
 * signed in would defeat the point.
 */
export async function consumeResetToken(
  token: string,
  newPassword: string
): Promise<ResetOutcome> {
  if (!token || typeof token !== 'string') return { ok: false, reason: 'invalid' };
  if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, reason: 'weak' };
  }

  const record = await prisma.passwordReset.findFirst({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!record) return { ok: false, reason: 'invalid' };
  if (record.usedAt) return { ok: false, reason: 'used' };
  if (record.expiresAt < new Date()) return { ok: false, reason: 'expired' };

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        // Completing a reset proves control of the mailbox, so an account that
        // never finished verification is verified by this.
        emailVerified: new Date(),
      },
    }),
    prisma.passwordReset.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.session.deleteMany({ where: { userId: record.userId } }),
  ]);

  return { ok: true, userId: record.userId };
}
