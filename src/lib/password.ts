import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function validatePassword(password: string) {
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }
  return null;
}
