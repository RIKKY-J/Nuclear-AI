import { join } from "node:path";

let db: any = null;

function initDb(database: any) {
  // Enable WAL mode for performance
  database.exec("PRAGMA journal_mode = WAL;");

  // Create Users table
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      createdAt INTEGER NOT NULL
    );
  `);

  // Create Sessions table
  database.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Create Summaries table
  database.exec(`
    CREATE TABLE IF NOT EXISTS summaries (
      id TEXT PRIMARY KEY,
      userId TEXT,
      createdAt INTEGER NOT NULL,
      preview TEXT NOT NULL,
      input TEXT NOT NULL,
      response TEXT NOT NULL,
      length TEXT NOT NULL,
      sourceType TEXT NOT NULL,
      favorite INTEGER DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Create Chats table
  database.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      summaryId TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (summaryId) REFERENCES summaries(id) ON DELETE CASCADE
    );
  `);
}

export async function getDb() {
  if (typeof window !== "undefined") {
    throw new Error("Database can only be accessed on the server.");
  }
  if (db) return db;

  const { DatabaseSync } = await import("node:sqlite");
  // Database file stored in /tmp on Vercel/production to avoid read-only filesystem issues
  const dbPath = process.env.VERCEL || process.env.NODE_ENV === "production"
    ? "/tmp/nuclear.db"
    : "nuclear.db.local";
  db = new DatabaseSync(dbPath);
  initDb(db);
  return db;
}

// DB Helper types
export interface DbUser {
  id: string;
  email: string;
  createdAt: number;
}

export interface DbSession {
  id: string;
  userId: string;
  expiresAt: number;
  createdAt: number;
}

export interface DbSummary {
  id: string;
  userId: string | null;
  createdAt: number;
  preview: string;
  input: string; // JSON string
  response: string; // JSON string
  length: string;
  sourceType: string;
  favorite: number; // 0 or 1
}

export interface DbChat {
  id: string;
  summaryId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}
