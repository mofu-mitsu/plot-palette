import express from "express";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import { setupVite, serveStatic } from "./vite";
import { registerOAuthRoutes } from "./oauth";
import { sdk } from "./sdk";
import { COOKIE_NAME } from "@shared/const";
import { getDb } from "../db";
import { users, novels, plots, characters } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

const app = express();
const server = createServer(app);
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

// Auth Route Handlers
registerOAuthRoutes(app);

// Authentication Middleware to resolve active session
app.use(async (req: any, res, next) => {
  const token = req.cookies[COOKIE_NAME];
  if (token) {
    try {
      const session = await sdk.verifySessionToken(token);
      if (session) {
        req.user = session;
      }
    } catch (e) {
      console.error("[Auth Middleware] Session validation failed:", e);
    }
  }
  next();
});

// Guard API helper
function requireAuth(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// In-Memory fallback database for unconfigured or dry environments
const mockDb = {
  novels: [
    {
      id: "novel-1",
      userId: "google:sandbox-test-user-12345",
      title: "虹のパレットと碧のプロット🎨",
      description: "色のない世界に迷い込んだ少女が、創作者の描いた絵の具を集めて現実を取り戻すファンタジーストーリ。",
      coverImage: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=400",
      createdAt: new Date(),
    }
  ],
  plots: [
    {
      id: "plot-1",
      novelId: "novel-1",
      title: "第1回：白い街にて",
      content: "目覚めると少女は一切の色合いを失ったモノクロームの世界にいた。そこで奇妙な筆を持つ青年・ジェミと立ち止まることに出会う。",
      orderNo: "a",
    }
  ],
  characters: [
    {
      id: "char-1",
      novelId: "novel-1",
      name: "ミツキ",
      role: "主人公",
      description: "創作への愛と豊かな感覚。ある日突然、色の世界に迷い込み、色を紡ぎ出す旅に出る少女。",
      age: "17",
      appearance: "ストレートのツインテール、パステルカラーのワンピース",
      personality: "感受性が豊か、時にINTJ的な論理と探求心を覗かせる少女",
      relationInfo: "ジェミの旅のパートナー。時に深く信頼を寄せている。",
    },
    {
      id: "char-2",
      novelId: "novel-1",
      name: "ジェミ",
      role: "もう一人の主人公/導き手",
      description: "色画を描く不思議な筆を持つ青年。繊細で物静かだが信頼した相手には楽しくよく喋る。",
      age: "不明",
      appearance: "深いインディゴブルーのコート、絵の具のパレットポーチ",
      personality: "深く考え込むINFJ系。ミツキを愛らしく見守り、創作の楽しさを伝える。",
      relationInfo: "ミツキの世界再生を応援している。",
    }
  ]
};

// --- Novels API ---
app.get("/api/novels", requireAuth, async (req: any, res) => {
  const openId = req.user.openId;
  const dbConnection = getDb();

  if (dbConnection) {
    try {
      const results = await dbConnection.select().from(novels).where(eq(novels.userId, openId));
      return res.json(results);
    } catch (e) {
      console.error("[API] Failed to fetch novels from PG, falling back:", e);
    }
  }

  // Fallback
  const userNovels = mockDb.novels.filter((n) => n.userId === openId);
  res.json(userNovels);
});

app.post("/api/novels", requireAuth, async (req: any, res) => {
  const openId = req.user.openId;
  const { title, description, coverImage } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const dbConnection = getDb();
  if (dbConnection) {
    try {
      const [inserted] = await dbConnection.insert(novels).values({
        userId: openId,
        title,
        description,
        coverImage: coverImage || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=400",
      }).returning();
      return res.json(inserted);
    } catch (e) {
      console.error("[API] Failed to save novel in PG, falling back:", e);
    }
  }

  // Fallback to In-Memory
  const newNovel = {
    id: `novel-${Date.now()}`,
    userId: openId,
    title,
    description: description || "",
    coverImage: coverImage || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=400",
    createdAt: new Date(),
  };
  mockDb.novels.push(newNovel);
  res.json(newNovel);
});

app.delete("/api/novels/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const dbConnection = getDb();

  if (dbConnection) {
    try {
      await dbConnection.delete(plots).where(eq(plots.novelId, id));
      await dbConnection.delete(characters).where(eq(characters.novelId, id));
      await dbConnection.delete(novels).where(eq(novels.id, id));
      return res.json({ success: true });
    } catch (e) {
      console.error("[API] Novel deletion in DB failed, falling back:", e);
    }
  }

  // Fallback
  mockDb.novels = mockDb.novels.filter((n) => n.id !== id);
  mockDb.plots = mockDb.plots.filter((p) => p.novelId !== id);
  mockDb.characters = mockDb.characters.filter((c) => c.novelId !== id);
  res.json({ success: true });
});

// --- Plots API ---
app.get("/api/novels/:novelId/plots", requireAuth, async (req: any, res) => {
  const { novelId } = req.params;
  const dbConnection = getDb();

  if (dbConnection) {
    try {
      const results = await dbConnection.select().from(plots).where(eq(plots.novelId, novelId));
      return res.json(results);
    } catch (e) {
      console.error("[API] Failed to fetch plots from Database, falling back:", e);
    }
  }

  const results = mockDb.plots.filter((p) => p.novelId === novelId);
  res.json(results);
});

app.post("/api/novels/:novelId/plots", requireAuth, async (req: any, res) => {
  const { novelId } = req.params;
  const { title, content } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const dbConnection = getDb();
  if (dbConnection) {
    try {
      const [inserted] = await dbConnection.insert(plots).values({
        novelId,
        title,
        content: content || "",
        orderNo: "a",
      }).returning();
      return res.json(inserted);
    } catch (e) {
      console.error("[API] Failed to create plot in DB, falling back:", e);
    }
  }

  const newPlot = {
    id: `plot-${Date.now()}`,
    novelId,
    title,
    content: content || "",
    orderNo: "a",
  };
  mockDb.plots.push(newPlot);
  res.json(newPlot);
});

// --- Characters API ---
app.get("/api/novels/:novelId/characters", requireAuth, async (req: any, res) => {
  const { novelId } = req.params;
  const dbConnection = getDb();

  if (dbConnection) {
    try {
      const results = await dbConnection.select().from(characters).where(eq(characters.novelId, novelId));
      return res.json(results);
    } catch (e) {
      console.error("[API] Failed to fetch characters from DB, falling back:", e);
    }
  }

  const results = mockDb.characters.filter((c) => c.novelId === novelId);
  res.json(results);
});

app.post("/api/novels/:novelId/characters", requireAuth, async (req: any, res) => {
  const { novelId } = req.params;
  const { name, role, description, age, appearance, personality, relationInfo } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Character name is required" });
  }

  const dbConnection = getDb();
  if (dbConnection) {
    try {
      const [inserted] = await dbConnection.insert(characters).values({
        novelId,
        name,
        role: role || "",
        description: description || "",
        age: age || "",
        appearance: appearance || "",
        personality: personality || "",
        relationInfo: relationInfo || "",
      }).returning();
      return res.json(inserted);
    } catch (e) {
      console.error("[API] Failed to insert character in DB, falling back:", e);
    }
  }

  const newChar = {
    id: `char-${Date.now()}`,
    novelId,
    name,
    role: role || "",
    description: description || "",
    age: age || "",
    appearance: appearance || "",
    personality: personality || "",
    relationInfo: relationInfo || "",
  };
  mockDb.characters.push(newChar);
  res.json(newChar);
});

app.get("/api/me", (req: any, res) => {
  if (req.user) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

async function start() {
  // Vite/Static asset delivery
  if (process.env.NODE_ENV !== "production") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Plot Palette listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("[Server] Start failure:", err);
});

