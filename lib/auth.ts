// lib/auth.ts
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
const COOKIE = "session_token";

export async function createSession(userId: string) {
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
  await prisma.session.create({ data: { userId, token, expires } });
  return { token, expires };
}

export async function destroySession(token?: string) {
  if (!token) return;
  await prisma.session.deleteMany({ where: { token } });
}

export async function setSessionCookie(token: string, expires: Date) {
  cookies().set(COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", expires,
  });
}
export function clearSessionCookie() {
  cookies().set(COOKIE, "", { path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", expires: new Date(0) });
}

export async function getCurrentUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const s = await prisma.session.findUnique({ where: { token }, include: { user: true } });
  if (!s || s.expires < new Date()) {
    if (s?.token) await destroySession(s.token);
    return null;
  }
  return s.user;
}
export async function requireUser() {
  const u = await getCurrentUser();
  if (!u) throw new Error("UNAUTHENTICATED");
  return u;
}
