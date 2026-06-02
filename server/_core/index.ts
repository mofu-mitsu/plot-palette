import express from "express";
import { createServer } from "http";
import { setupVite, serveStatic } from "./vite";
import { registerOAuthRoutes } from "./oauth";
import { sdk } from "./sdk";
import { COOKIE_NAME } from "../../shared/const";
import { getDb } from "../db";
import { users, novels, plots, characters } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

const app = express();
const server = createServer(app);
const PORT = 3000;

app.use(express.json());

// Custom simple cookie parsing middleware
app.use((req: any, res, next) => {
  const cookies: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie: string) => {
      const parts = cookie.split("=");
      const name = parts[0].trim();
      const value = parts.slice(1).join("=").trim();
      if (name) {
        cookies[name] = decodeURIComponent(value);
      }
    });
  }
  req.cookies = cookies;
  next();
});

// Auth Route Handlers
registerOAuthRoutes(app);

// Authentication Middleware to resolve active session
app.use(async (req: any, res, next) => {
  const token = req.cookies[COOKIE_NAME];
  if (token) {
    try {
      const session = await sdk.verifySession(token);
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
      title: "星屑のオルゴールと時の歯車⚙️",
      description: "時間が静止した奇妙なスチームパンクの世界を舞台に、孤独な時計職人の少年レオが、空から落ちてきた記憶喪失の少女シエラと出会い、世界のすべての時間を再び動かすため「時の歯車」を探す旅に出る壮大なファンタジーロードムービー。",
      coverImage: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=400",
      createdAt: new Date(),
    }
  ],
  plots: [
    {
      id: "plot-1",
      novelId: "novel-1",
      title: "第1章：歯車が動き出す日",
      content: "巨大な歯車の時計塔が街の象徴であるクロノプレイス。時計職人の見習い・レオは、ある日、時間を一切刻まない星屑の装飾が施されたオルゴールを抱えて眠る少女シエラと遭遇する。",
      orderNo: "a",
    }
  ],
  characters: [
    {
      id: "char-1",
      novelId: "novel-1",
      name: "レオ",
      role: "主人公",
      description: "工芸都市クロノプレイス chimneys の時計職人の見習い少年。無茶な無愛想さを見せるが、困っている人や壊れた機械を放っておけない心優しい性格。",
      age: "16",
      appearance: "煤まみれのブラウンの作業用エプロン、ブラス製ゴーグル、小さな懐中時計",
      personality: "冷静沈着で手先が器用、少し皮肉屋だが誠実なISTPタイプ",
      relationInfo: "シエラのオルゴールを修理することをきっかけに、彼女の記憶を追う相棒役となる。",
    },
    {
      id: "char-2",
      novelId: "novel-1",
      name: "シエラ",
      role: "ヒロイン",
      description: "大きな時計塔の最上階で発見された、記憶の大部分を失っている神秘的な少女。抱えている星屑 of オルゴールだけが、彼女の正体を知る唯一の鍵。",
      age: "15",
      appearance: "星が散りばめられたような薄手のネイビーのドレス、エメラルドグリーンの大きな瞳",
      personality: "優しくおっとりしているが、時折芯の強さと深い感受性を見せるINFPタイプ",
      relationInfo: "自分を受け入れて優しく支えてくれるレオを、絶大に信頼しているパートナー。",
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

app.post("/api/logout", (req: any, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || req.secure,
    sameSite: "none",
    path: "/",
  });
  res.json({ success: true });
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

