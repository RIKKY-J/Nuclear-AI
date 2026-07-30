import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { getDb } from "./db";

// Helper to parse cookies
function parseCookies(req: Request): Record<string, string> {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((str) => {
    const parts = str.split("=");
    if (parts[0] && parts[1]) {
      cookies[parts[0].trim()] = decodeURIComponent(parts[1].trim());
    }
  });
  return cookies;
}

export const sendMagicLinkFn = createServerFn({ method: "POST" })
  .input(z.object({ email: z.string().email() }))
  .handler(async ({ input }) => {
    const db = await getDb();
    const email = input.email.toLowerCase().trim();

    // 1. Check if user exists, otherwise create
    let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) {
      const userId = `usr_${Math.random().toString(36).slice(2, 9)}`;
      db.prepare("INSERT INTO users (id, email, createdAt) VALUES (?, ?, ?)").run(
        userId,
        email,
        Date.now(),
      );
      user = { id: userId, email };
    }

    // 2. Generate a magic login token session (valid for 15 mins)
    const token = `token_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

    db.prepare("INSERT INTO sessions (id, userId, expiresAt, createdAt) VALUES (?, ?, ?, ?)").run(
      token,
      user.id,
      expiresAt,
      Date.now(),
    );

    // 3. Log to console for development / ease of testing
    console.log("\n==================================================");
    console.log(`[MAGIC LINK AUTH] Login link for ${email}:`);
    console.log(`http://localhost:3000/login?token=${token}`);
    console.log("==================================================\n");

    return { success: true, email };
  });

export const loginWithTokenFn = createServerFn({ method: "POST" })
  .input(z.object({ token: z.string() }))
  .handler(async ({ input }) => {
    const db = await getDb();
    const { token } = input;

    // 1. Validate the magic token
    const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(token) as any;
    if (!session) {
      throw new Error("Invalid or expired login link.");
    }

    if (session.expiresAt < Date.now()) {
      db.prepare("DELETE FROM sessions WHERE id = ?").run(token);
      throw new Error("Login link has expired. Please request a new one.");
    }

    // 2. Generate a long-lived session (30 days)
    const newSessionId = `sess_${Math.random().toString(36).slice(2, 15)}`;
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

    db.prepare("INSERT INTO sessions (id, userId, expiresAt, createdAt) VALUES (?, ?, ?, ?)").run(
      newSessionId,
      session.userId,
      expiresAt,
      Date.now(),
    );

    // Delete the verification token session
    db.prepare("DELETE FROM sessions WHERE id = ?").run(token);

    // 3. Set the session cookie
    const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
    const cookieString = `session_id=${newSessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
    setResponseHeader("Set-Cookie", cookieString);

    return { success: true };
  });

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(async () => {
  const req = getRequest();
  const cookies = parseCookies(req);
  const sessionId = cookies["session_id"];

  if (!sessionId) return null;

  const db = await getDb();
  const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId) as any;

  if (!session || session.expiresAt < Date.now()) {
    if (session) {
      db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    }
    return null;
  }

  const user = db.prepare("SELECT id, email FROM users WHERE id = ?").get(session.userId) as any;
  return user || null;
});

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const req = getRequest();
  const cookies = parseCookies(req);
  const sessionId = cookies["session_id"];

  if (sessionId) {
    const db = await getDb();
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
  }

  // Clear the cookie
  const cookieString = `session_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  setResponseHeader("Set-Cookie", cookieString);

  return { success: true };
});
