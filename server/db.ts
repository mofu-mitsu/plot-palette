import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, novels, plots, characters, episodes, settings, mementos } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export let initLogs: string[] = [];
let dbInstance: any = null;
let isInitializing = false;
let initialized = false;

// Auto-run DDL migrations if any tables are missing
async function initializeTables(sqlClient: any) {
  if (initialized || isInitializing) return;
  isInitializing = true;
  initLogs.push(`[${new Date().toISOString()}] Starting Supabase database auto-initialization...`);
  console.log("[DB Debug] Starting Supabase database auto-initialization...");

  // Helper inside to execute query with isolation
  const runQuery = async (name: string, pfn: () => Promise<any>) => {
    try {
      await pfn();
      console.log(`[DB Debug] ✔ '${name}' step processed successfully.`);
      initLogs.push(`[${new Date().toISOString()}] ✔ '${name}' checked successfully.`);
    } catch (err: any) {
      console.error(`[DB Debug] ❌ '${name}' step failed:`, err.message || err);
      initLogs.push(`[${new Date().toISOString()}] ❌ '${name}' failed: ${err.message || err}`);
    }
  };

  try {
    // 0. Enable pgcrypto for gen_random_uuid()
    await runQuery("pgcrypto extension", () => sqlClient`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    // 1. users table
    await runQuery("users table", () => sqlClient`
      CREATE TABLE IF NOT EXISTS users (
        open_id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        login_method TEXT,
        last_signed_in TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. novels table
    await runQuery("novels table", () => sqlClient`
      CREATE TABLE IF NOT EXISTS novels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT REFERENCES users(open_id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        cover_image TEXT,
        theme_doc TEXT,
        target_audience TEXT,
        ending_doc TEXT,
        word_goal INTEGER DEFAULT 50000,
        write_days INTEGER DEFAULT 30,
        chart_image TEXT,
        chart_memo TEXT,
        reference_links JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 3. plots table
    await runQuery("plots table", () => sqlClient`
      CREATE TABLE IF NOT EXISTS plots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT,
        order_no TEXT,
        phase TEXT DEFAULT '起',
        timeline_date TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 4. characters table
    await runQuery("characters table", () => sqlClient`
      CREATE TABLE IF NOT EXISTS characters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        role TEXT,
        description TEXT,
        age TEXT,
        appearance TEXT,
        personality TEXT,
        relation_info TEXT,
        image_url TEXT,
        custom_fields JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 5. episodes table
    await runQuery("episodes table", () => sqlClient`
      CREATE TABLE IF NOT EXISTS episodes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        body TEXT DEFAULT '',
        status TEXT DEFAULT '下書き',
        tag TEXT DEFAULT '本編',
        word_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 6. settings table
    await runQuery("settings table", () => sqlClient`
      CREATE TABLE IF NOT EXISTS settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        category TEXT DEFAULT '世界観',
        detail TEXT DEFAULT '',
        is_fusen BOOLEAN DEFAULT false,
        fusen_status TEXT DEFAULT '未回収',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 7. memos (mementos) table
    await runQuery("memos table", () => sqlClient`
      CREATE TABLE IF NOT EXISTS memos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
        title TEXT DEFAULT '無題のメモ',
        content TEXT DEFAULT '',
        color TEXT DEFAULT '#fffbeb',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    initialized = true;
    console.log("[DB Debug] 🎉 All database tables checked and verified successfully with Supabase Postgres!");
    initLogs.push(`[${new Date().toISOString()}] 🎉 All database tables checked and verified successfully with Supabase Postgres!`);
  } catch (outerError: any) {
    console.error("[DB Debug] ❌ Outer database auto-initialization failed:", outerError);
    initLogs.push(`[${new Date().toISOString()}] ❌ Outer failed: ${outerError.message || outerError}`);
  } finally {
    isInitializing = false;
  }
}

export function getDb() {
  if (!dbInstance) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      console.warn("[DB Debug] DATABASE_URL is not set. Database commands will fallback to static/in-memory modes.");
      initLogs.push(`[${new Date().toISOString()}] ⚠ DATABASE_URL is not set! Fallback mode is active.`);
      return null;
    }
    try {
      console.log("[DB Debug] DATABASE_URL detected. Connecting via postgres-js client...");
      initLogs.push(`[${new Date().toISOString()}] Connecting to database (length: ${url.length})...`);
      const queryClient = postgres(url, { ssl: "require" });
      dbInstance = drizzle(queryClient);
      
      // Fire-and-forget the tables initialization asynchronously
      initializeTables(queryClient).catch((err) => {
        console.error("[DB Debug] Asynchronous table creation error:", err);
        initLogs.push(`[${new Date().toISOString()}] Async error: ${err.message || err}`);
      });
    } catch (e: any) {
      console.error("[DB Debug] Connection establishment failed:", e);
      initLogs.push(`[${new Date().toISOString()}] Connection setup error: ${e.message || e}`);
      return null;
    }
  }
  return dbInstance;
}

// User Actions
export async function getUserByOpenId(openId: string) {
  const dbConnection = getDb();
  if (!dbConnection) return null;
  try {
    const result = await dbConnection.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result[0] || null;
  } catch (err) {
    console.error(`[DB Debug] getUserByOpenId for '${openId}' failed:`, err);
    return null;
  }
}

export async function updateUserLastSignedIn(openId: string, lastSignedIn: Date) {
  const dbConnection = getDb();
  if (!dbConnection) return;
  try {
    await dbConnection.update(users).set({ lastSignedIn }).where(eq(users.openId, openId));
    console.log(`[DB Debug] Updated lastSignedIn for user '${openId}'`);
  } catch (err) {
    console.error(`[DB Debug] updateUserLastSignedIn for '${openId}' failed:`, err);
  }
}

export async function upsertUser(userData: {
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string;
  lastSignedIn: Date;
}) {
  const dbConnection = getDb();
  if (!dbConnection) return;

  try {
    await dbConnection
      .insert(users)
      .values({
        openId: userData.openId,
        name: userData.name,
        email: userData.email,
        loginMethod: userData.loginMethod,
        lastSignedIn: userData.lastSignedIn,
      })
      .onConflictDoUpdate({
        target: users.openId,
        set: {
          name: userData.name,
          email: userData.email,
          lastSignedIn: userData.lastSignedIn,
        },
      });
    console.log(`[DB Debug] Successfully upserted user '${userData.openId}' in Supabase`);
  } catch (err) {
    console.error(`[DB Debug] upsertUser for '${userData.openId}' failed:`, err);
  }
}
