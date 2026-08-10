import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const AUTH_COOKIE = "family_meal_session";

export type SessionUser = {
  authenticated: true;
  userId: string;
  name?: string;
  email: string;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: {
  userId: string;
  name?: string | null;
  email: string;
}) {
  return new SignJWT({
    authenticated: true,
    userId: user.userId,
    name: user.name?.trim() || undefined,
    email: user.email.trim().toLowerCase(),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.authenticated === true && typeof payload.userId === "string";
  } catch {
    return false;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.authenticated !== true) return null;
    if (typeof payload.userId !== "string" || !payload.userId) return null;
    if (typeof payload.email !== "string" || !payload.email) return null;
    return {
      authenticated: true,
      userId: payload.userId,
      name: typeof payload.name === "string" ? payload.name : undefined,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
