import { createHash, randomBytes } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "./db";
import { sendPasswordResetEmail } from "./email";
import { hashPassword } from "./password";
import { passwordResetTokens, profiles } from "./schema";
import { getProfileByEmail, getProfileById } from "./users";

const TOKEN_TTL_MS = 1000 * 60 * 60;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getAppUrl() {
  const explicit =
    process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

export async function requestPasswordReset(emailInput: string) {
  const email = emailInput.trim().toLowerCase();
  if (!email) {
    return { ok: true as const };
  }

  const user = await getProfileByEmail(email);
  if (!user) {
    return { ok: true as const };
  }

  const db = getDb();
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(passwordResetTokens.userId, user.id),
        isNull(passwordResetTokens.usedAt),
      ),
    );

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const resetUrl = `${getAppUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
  await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl,
  });

  return { ok: true as const };
}

export async function resetPasswordWithToken(
  rawToken: string,
  newPassword: string,
) {
  const token = rawToken.trim();
  if (!token) {
    throw new Error("Reset link is invalid or expired");
  }

  const db = getDb();
  const tokenHash = hashToken(token);
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date()),
      ),
    );

  if (!row) {
    throw new Error("Reset link is invalid or expired");
  }

  const user = await getProfileById(row.userId);
  if (!user) {
    throw new Error("Reset link is invalid or expired");
  }

  const passwordHash = await hashPassword(newPassword);
  await db
    .update(profiles)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, user.id));

  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, row.id));

  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(passwordResetTokens.userId, user.id),
        isNull(passwordResetTokens.usedAt),
      ),
    );

  return { ok: true as const, email: user.email };
}
