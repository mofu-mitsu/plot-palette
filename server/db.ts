import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, novels, plots, characters } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

let dbInstance: any = null;

export function getDb() {
  if (!dbInstance) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      console.warn("DATABASE_URL is not set. Database commands will not execute.");
      return null;
    }
    const queryClient = postgres(url);
    dbInstance = drizzle(queryClient);
  }
  return dbInstance;
}

// User Actions
export async function getUserByOpenId(openId: string) {
  const dbConnection = getDb();
  if (!dbConnection) return null;
  const result = await dbConnection.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0] || null;
}

export async function updateUserLastSignedIn(openId: string, lastSignedIn: Date) {
  const dbConnection = getDb();
  if (!dbConnection) return;
  await dbConnection.update(users).set({ lastSignedIn }).where(eq(users.openId, openId));
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
}
