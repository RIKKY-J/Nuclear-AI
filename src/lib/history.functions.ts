import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { getDb } from "./db";

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

async function getUserIdFromSession(): Promise<string | null> {
  const req = getRequest();
  const cookies = parseCookies(req);
  const sessionId = cookies["session_id"];
  if (!sessionId) return null;

  const db = await getDb();
  const session = db
    .prepare("SELECT userId FROM sessions WHERE id = ? AND expiresAt > ?")
    .get(sessionId, Date.now()) as any;
  return session ? session.userId : null;
}

export const getHistoryListFn = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await getUserIdFromSession();
  if (!userId) return [];

  const db = await getDb();
  const rows = db
    .prepare("SELECT * FROM summaries WHERE userId = ? ORDER BY createdAt DESC")
    .all(userId) as any[];

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    preview: row.preview,
    length: row.length,
    sourceType: row.sourceType,
    favorite: row.favorite === 1,
    input: JSON.parse(row.input),
    response: JSON.parse(row.response),
  }));
});

export const toggleFavoriteFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const db = await getDb();
    const summary = db.prepare("SELECT favorite FROM summaries WHERE id = ?").get(data.id) as any;
    if (!summary) throw new Error("Summary not found");

    const newFav = summary.favorite === 1 ? 0 : 1;
    db.prepare("UPDATE summaries SET favorite = ? WHERE id = ?").run(newFav, data.id);
    return { favorite: newFav === 1 };
  });

export const deleteSummaryFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const db = await getDb();
    db.prepare("DELETE FROM summaries WHERE id = ?").run(data.id);
    return { success: true };
  });

export const clearUserHistoryFn = createServerFn({ method: "POST" }).handler(async () => {
  const userId = await getUserIdFromSession();
  if (!userId) return { success: false };

  const db = await getDb();
  db.prepare("DELETE FROM summaries WHERE userId = ?").run(userId);
  return { success: true };
});

export const syncAnonymousHistoryFn = createServerFn({ method: "POST" })
  .validator(z.object({ ids: z.array(z.string()) }))
  .handler(async ({ data }) => {
    const userId = await getUserIdFromSession();
    if (!userId || data.ids.length === 0) return { success: false };

    const db = await getDb();
    const placeholders = data.ids.map(() => "?").join(",");
    db.prepare(
      `
      UPDATE summaries 
      SET userId = ? 
      WHERE id IN (${placeholders}) AND userId IS NULL
    `,
    ).run(userId, ...data.ids);

    return { success: true };
  });

export const fetchSummaryDetailsFn = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const db = await getDb();
    const row = db.prepare("SELECT * FROM summaries WHERE id = ?").get(data.id) as any;
    if (!row) return null;

    return {
      id: row.id,
      createdAt: row.createdAt,
      preview: row.preview,
      length: row.length,
      sourceType: row.sourceType,
      favorite: row.favorite === 1,
      input: JSON.parse(row.input),
    };
  });

export const updateSummaryResponseFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string(), response: z.any() }))
  .handler(async ({ data }) => {
    const db = await getDb();
    db.prepare("UPDATE summaries SET response = ? WHERE id = ?").run(
      JSON.stringify(data.response),
      data.id,
    );
    return { success: true };
  });
