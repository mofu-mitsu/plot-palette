import express from "express";
import { createServer } from "http";
import { setupVite, serveStatic } from "./vite";
import { registerOAuthRoutes } from "./oauth";
import { sdk } from "./sdk";
import { COOKIE_NAME } from "../../shared/const";
import { getDb, initLogs } from "../db";
import { users, novels, plots, characters, episodes, settings, mementos } from "../../drizzle/schema";
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

// DB Status Debug Route
app.get("/api/debug/db-status", (req: any, res) => {
  const dbUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DATABASE_DIRECT_URL;
  let maskedUrl = "Not defined";
  let maskedDirectUrl = "Not defined";
  if (dbUrl) {
    maskedUrl = dbUrl.substring(0, Math.min(15, dbUrl.length)) + "..." + dbUrl.substring(Math.max(0, dbUrl.length - 15));
  }
  if (directUrl) {
    maskedDirectUrl = directUrl.substring(0, Math.min(15, directUrl.length)) + "..." + directUrl.substring(Math.max(0, directUrl.length - 15));
  }
  res.json({
    status: "ok",
    hasDatabaseUrl: !!dbUrl,
    hasDirectUrl: !!directUrl,
    maskedUrl,
    maskedDirectUrl,
    logs: initLogs,
  });
});

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

// UUID validation helper to prevent syntax errors in Postgres queries
function isValidUuid(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// In-Memory fallback database for unconfigured or dry environments
interface MockDb {
  novels: any[];
  plots: any[];
  characters: any[];
  episodes: any[];
  settings: any[];
  memos: any[];
}

const mockDb: MockDb = {
  novels: [
    {
      id: "novel-1",
      userId: "google:sandbox-test-user-12345",
      title: "星屑のオルゴールと時の歯車⚙️",
      description: "時間が静止した奇妙なスチームパンクの世界を舞台に、孤独な時計職人の少年レオが、空から落ちてきた記憶喪失の少女シエラと出会い、世界のすべての時間を再び動かすため「時の歯車」を探す旅に出る壮大なファンタジーロードムービー。",
      coverImage: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=400",
      themeDoc: "大切な人との記憶、失われた時間を取り戻す旅",
      targetAudience: "少年少女、ファンタジー・スチームパンクが好きな読者層",
      endingDoc: "時の歯車がすべてはまり、レオとシエラは新たな時間を生き始める。",
      wordGoal: 50000,
      writeDays: 30,
      createdAt: new Date(),
    }
  ],
  plots: [
    {
      id: "plot-1",
      novelId: "novel-1",
      title: "第1章：歯車が動き出す日",
      content: "巨大な歯車の時計塔が街の象徴であるクロノプレイス。時計職人の見習い・レオは、ある日、時間を一切刻まない星屑の装飾が施されたオルゴールを抱えて眠る少女シエラと遭遇する。",
      phase: "起",
      timelineDate: "第1話・出発前"
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
      appearance: "煤まみれのブラウン of 作業用エプロン、ブラス製ゴーグル、小さな懐中時計",
      personality: "冷静沈着で手先が器用、少し皮肉屋だが誠実なISTPタイプ",
      relationInfo: "シエラのオルゴールを修理することをきっかけに、彼女の記憶を追う相棒役となる。",
    },
    {
      id: "char-2",
      novelId: "novel-1",
      name: "シエラ",
      role: "ヒロイン",
      description: "大きな時計塔の最上階で発見された、記憶の大部分を失っている神秘的な少女。抱えている星屑 of オルゴールだけが、彼女の正体を知る唯一 of 鍵。",
      age: "15",
      appearance: "星が散りばめられたような薄手のネイビーのドレス、エメラルドグリーンの大きな瞳",
      personality: "優しくおっとりしているが、時折芯の強さと深い感受性を見せるINFPタイプ",
      relationInfo: "自分を受け入れて優しく支えてくれるレオを、絶大に信頼しているパートナー。",
    }
  ],
  episodes: [
    {
      id: "epi-1",
      novelId: "novel-1",
      title: "プロローグ：眠れる星のオルゴール",
      body: "クロノプレイスの夜は、いつも冷え切ったブラスの匂いがする。\nカチ、コチ、と規則正しい音だけが、霧の立ち込める石畳の通りに響いていた。\n機械が支配するこの街で、不規則な心音を持つ人間は、時にそれ自体が精密なゼンマイのようだった──。",
      status: "完成",
      tag: "プロローグ",
      wordCount: 120,
      createdAt: new Date(),
    }
  ],
  settings: [
    {
      id: "set-1",
      novelId: "novel-1",
      title: "クロノプレイス（工芸都市）",
      category: "世界観",
      detail: "世界の巨大な歯車機関が集中する、青き真鍮と巨大煙突に囲まれた蒸気と歯車の都市。数年前の「大沈黙」以来、街の一部で時間の流れが静止、あるいは急加速する異常現象が起きている。",
      isFusen: false,
    },
    {
      id: "set-2",
      novelId: "novel-1",
      title: "星屑のオルゴールの出自",
      category: "用語",
      detail: "星屑をあしらった真鍮製のオルゴール。ねじを回しても一切音が出ないが、静止した時間の境界点に近づくと微かに宇宙の音色を奏でる。これは古代の時計塔のシステムキーという伏線。",
      isFusen: true,
      fusenStatus: "未回収",
    }
  ],
  memos: [
    {
      id: "mem-1",
      novelId: "novel-1",
      title: "中盤のセリフ案",
      content: "「頼むから、僕の時間を勝手に止めるなよ。君のせいで、僕の心臓の振り子が狂いっぱなしなんだ」\n- レオが、自分のために無理をするシエラに対して言うセリフのアイデア。",
      color: "#fdf2f8", // pink
      createdAt: new Date(),
    }
  ]
};

// --- Novels API ---
app.get("/api/novels", requireAuth, async (req: any, res) => {
  const openId = req.user.openId;
  const dbConnection = getDb();

  if (dbConnection) {
    try {
      console.log(`[API Debug] Fetching novels from Supabase for user '${openId}'`);
      const results = await dbConnection.select().from(novels).where(eq(novels.userId, openId));
      return res.json(results);
    } catch (e: any) {
      console.error("[API Debug] ❌ Failed to fetch novels from PG:", e);
      return res.status(500).json({ error: "Database fetch failed", message: e.message || e });
    }
  }

  // Fallback
  const userNovels = mockDb.novels.filter((n) => n.userId === openId);
  res.json(userNovels);
});

app.post("/api/novels", requireAuth, async (req: any, res) => {
  const openId = req.user.openId;
  const { 
    title, description, coverImage, themeDoc, targetAudience, 
    endingDoc, wordGoal, writeDays, chartImage, chartMemo, referenceLinks 
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const dbConnection = getDb();
  if (dbConnection) {
    try {
      console.log(`[API Debug] Creating new novel into Supabase: '${title}'`);
      const [inserted] = await dbConnection.insert(novels).values({
        userId: openId,
        title,
        description: description || "",
        coverImage: coverImage || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=400",
        themeDoc: themeDoc || "",
        targetAudience: targetAudience || "",
        endingDoc: endingDoc || "",
        wordGoal: Number(wordGoal) || 50000,
        writeDays: Number(writeDays) || 30,
        chartImage: chartImage || "",
        chartMemo: chartMemo || "",
        referenceLinks: referenceLinks || [],
      }).returning();

      if (inserted) {
        console.log(`[API Debug] ✔ Successfully created novel '${inserted.id}'`);
        return res.json(inserted);
      }
    } catch (e: any) {
      console.error("[API Debug] ❌ Failed to save novel in SQL database:", e);
      return res.status(500).json({ error: "Database save failed", message: e.message || e });
    }
  }

  // Purely in-memory mock fallback
  const generatedId = `novel-${Date.now()}`;
  const newNovel = {
    id: generatedId,
    userId: openId,
    title,
    description: description || "",
    coverImage: coverImage || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=400",
    themeDoc: themeDoc || "",
    targetAudience: targetAudience || "",
    endingDoc: endingDoc || "",
    wordGoal: Number(wordGoal) || 50000,
    writeDays: Number(writeDays) || 30,
    chartImage: chartImage || "",
    chartMemo: chartMemo || "",
    referenceLinks: referenceLinks || [],
    createdAt: new Date(),
  };

  mockDb.novels.push(newNovel);
  res.json(newNovel);
});

app.put("/api/novels/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const { 
    title, description, coverImage, themeDoc, targetAudience, 
    endingDoc, wordGoal, writeDays, chartImage, chartMemo, referenceLinks 
  } = req.body;

  const dbConnection = getDb();
  if (dbConnection) {
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid novel ID format for saving in cloud database" });
    }
    try {
      console.log(`[API Debug] Updating novel in Supabase: '${id}'`);
      const [updated] = await dbConnection.update(novels).set({
        title,
        description: description || "",
        coverImage,
        themeDoc: themeDoc || "",
        targetAudience: targetAudience || "",
        endingDoc: endingDoc || "",
        wordGoal: Number(wordGoal) || 50000,
        writeDays: Number(writeDays) || 30,
        chartImage: chartImage || "",
        chartMemo: chartMemo || "",
        referenceLinks: referenceLinks || [],
        updatedAt: new Date(),
      }).where(eq(novels.id, id)).returning();

      if (updated) {
        console.log(`[API Debug] ✔ Novel '${id}' updated successfully in PG`);
        return res.json(updated);
      }
    } catch (e: any) {
      console.error(`[API Debug] ❌ Failed to update Supabase novel for '${id}':`, e);
      return res.status(500).json({ error: "Database update failed", message: e.message || e });
    }
  }

  // Memory fallback
  const idx = mockDb.novels.findIndex((n) => n.id === id);
  if (idx !== -1) {
    mockDb.novels[idx] = {
      ...mockDb.novels[idx],
      title,
      description: description || "",
      coverImage: coverImage || mockDb.novels[idx].coverImage,
      themeDoc: themeDoc !== undefined ? themeDoc : mockDb.novels[idx].themeDoc,
      targetAudience: targetAudience !== undefined ? targetAudience : mockDb.novels[idx].targetAudience,
      endingDoc: endingDoc !== undefined ? endingDoc : mockDb.novels[idx].endingDoc,
      wordGoal: wordGoal !== undefined ? Number(wordGoal) : mockDb.novels[idx].wordGoal,
      writeDays: writeDays !== undefined ? Number(writeDays) : mockDb.novels[idx].writeDays,
      chartImage: chartImage !== undefined ? chartImage : mockDb.novels[idx].chartImage,
      chartMemo: chartMemo !== undefined ? chartMemo : mockDb.novels[idx].chartMemo,
      referenceLinks: referenceLinks !== undefined ? referenceLinks : mockDb.novels[idx].referenceLinks,
    };
    return res.json(mockDb.novels[idx]);
  }

  res.status(404).json({ error: "Novel not found" });
});

app.delete("/api/novels/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const dbConnection = getDb();

  if (dbConnection) {
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid novel ID format for deletion from database" });
    }
    try {
      console.log(`[API Debug] Deleting novel '${id}' and cascades from Supabase`);
      await dbConnection.delete(novels).where(eq(novels.id, id));
      console.log(`[API Debug] ✔ Novel and cascades successfully deleted in DB`);
      return res.json({ success: true });
    } catch (e: any) {
      console.error(`[API Debug] ❌ Supabase novel deletion failed for '${id}':`, e);
      return res.status(500).json({ error: "Database deletion failed", message: e.message || e });
    }
  }

  // Fallback deletion
  mockDb.novels = mockDb.novels.filter((n) => n.id !== id);
  mockDb.plots = mockDb.plots.filter((p) => p.novelId !== id);
  mockDb.characters = mockDb.characters.filter((c) => c.novelId !== id);
  mockDb.episodes = mockDb.episodes.filter((e) => e.novelId !== id);
  mockDb.settings = mockDb.settings.filter((s) => s.novelId !== id);
  mockDb.memos = mockDb.memos.filter((m) => m.novelId !== id);
  res.json({ success: true });
});

// --- Plots API ---
app.get("/api/novels/:novelId/plots", requireAuth, async (req: any, res) => {
  const { novelId } = req.params;
  const dbConnection = getDb();

  if (dbConnection) {
    if (!isValidUuid(novelId)) {
      return res.status(400).json({ error: "Invalid novel ID format for routing to cloud database plots" });
    }
    try {
      console.log(`[API Debug] Fetching plots from Supabase or world state for novel '${novelId}'`);
      const results = await dbConnection.select().from(plots).where(eq(plots.novelId, novelId));
      return res.json(results);
    } catch (e: any) {
      console.error("[API Debug] ❌ Failed to fetch plots from Database:", e);
      return res.status(500).json({ error: "Database fetch failed", message: e.message || e });
    }
  }

  const results = mockDb.plots.filter((p) => p.novelId === novelId);
  res.json(results);
});

app.post("/api/novels/:novelId/plots", requireAuth, async (req: any, res) => {
  const { novelId } = req.params;
  const { title, content, phase, timelineDate } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const dbConnection = getDb();
  if (dbConnection) {
    if (!isValidUuid(novelId)) {
      return res.status(400).json({ error: "Invalid novel ID format for saving plots to database" });
    }
    try {
      console.log(`[API Debug] Saving plot into PG for novel ID: '${novelId}'`);
      const [inserted] = await dbConnection.insert(plots).values({
        novelId,
        title,
        content: content || "",
        phase: phase || "起",
        timelineDate: timelineDate || "",
        orderNo: "a",
      }).returning();

      if (inserted) {
        console.log(`[API Debug] ✔ Plot '${inserted.id}' saved in Supabase`);
        return res.json(inserted);
      }
    } catch (e: any) {
      console.error("[API Debug] ❌ Failed to create plot in DB:", e);
      return res.status(500).json({ error: "Database save failed", message: e.message || e });
    }
  }

  // Fallback
  const generatedId = `plot-${Date.now()}`;
  const newPlot = {
    id: generatedId,
    novelId,
    title,
    content: content || "",
    phase: phase || "起",
    timelineDate: timelineDate || "",
    orderNo: "a",
  };
  mockDb.plots.push(newPlot);
  res.json(newPlot);
});

app.put("/api/novels/:novelId/plots/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const { title, content, phase, timelineDate } = req.body;

  const dbConnection = getDb();
  if (dbConnection) {
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid plot ID format for update in database" });
    }
    try {
      console.log(`[API Debug] Updating plot: '${id}'`);
      const [updated] = await dbConnection.update(plots).set({ 
        title, 
        content,
        phase: phase || "起",
        timelineDate: timelineDate || ""
      }).where(eq(plots.id, id)).returning();

      if (updated) {
        console.log(`[API Debug] ✔ Plot '${id}' updated in PG`);
        return res.json(updated);
      }
    } catch (e: any) {
      console.error("[API Debug] ❌ Failed to update plot in DB:", e);
      return res.status(500).json({ error: "Database update failed", message: e.message || e });
    }
  }

  const idx = mockDb.plots.findIndex((p) => p.id === id);
  if (idx !== -1) {
    mockDb.plots[idx] = {
      ...mockDb.plots[idx],
      title: title || mockDb.plots[idx].title,
      content: content !== undefined ? content : mockDb.plots[idx].content,
      phase: phase !== undefined ? phase : mockDb.plots[idx].phase,
      timelineDate: timelineDate !== undefined ? timelineDate : mockDb.plots[idx].timelineDate,
    };
    return res.json(mockDb.plots[idx]);
  }
  res.status(404).json({ error: "Plot not found" });
});

app.delete("/api/novels/:novelId/plots/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const dbConnection = getDb();
  if (dbConnection) {
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid plot ID format for deleting from database" });
    }
    try {
      console.log(`[API Debug] Deleting plot '${id}'`);
      await dbConnection.delete(plots).where(eq(plots.id, id));
      return res.json({ success: true });
    } catch (e: any) {
      console.error("[API Debug] ❌ Failed to delete plot in DB:", e);
      return res.status(500).json({ error: "Database deletion failed", message: e.message || e });
    }
  }
  mockDb.plots = mockDb.plots.filter(p => p.id !== id);
  res.json({ success: true });
});

// --- Characters API ---
app.get("/api/novels/:novelId/characters", requireAuth, async (req: any, res) => {
  const { novelId } = req.params;
  const dbConnection = getDb();

  if (dbConnection) {
    if (!isValidUuid(novelId)) {
      return res.status(400).json({ error: "Invalid novel ID format for fetching characters from database" });
    }
    try {
      console.log(`[API Debug] Fetching characters for novel '${novelId}' from PG`);
      const results = await dbConnection.select().from(characters).where(eq(characters.novelId, novelId));
      return res.json(results);
    } catch (e: any) {
      console.error("[API Debug] ❌ Failed to fetch characters from DB:", e);
      return res.status(500).json({ error: "Database fetch failed", message: e.message || e });
    }
  }

  const results = mockDb.characters.filter((c) => c.novelId === novelId);
  res.json(results);
});

app.post("/api/novels/:novelId/characters", requireAuth, async (req: any, res) => {
  const { novelId } = req.params;
  const { name, role, description, age, appearance, personality, relationInfo, imageUrl, customFields } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Character name is required" });
  }

  const dbConnection = getDb();
  if (dbConnection) {
    if (!isValidUuid(novelId)) {
      return res.status(400).json({ error: "Invalid novel ID format for creating character in database" });
    }
    try {
      console.log(`[API Debug] Inserting character for novel: '${novelId}' into PG`);
      const [inserted] = await dbConnection.insert(characters).values({
        novelId,
        name,
        role: role || "",
        description: description || "",
        age: age || "",
        appearance: appearance || "",
        personality: personality || "",
        relationInfo: relationInfo || "",
        imageUrl: imageUrl || "",
        customFields: customFields || [],
      }).returning();

      if (inserted) {
        console.log(`[API Debug] ✔ Character '${inserted.id}' inserted into PG`);
        return res.json(inserted);
      }
    } catch (e: any) {
      console.error("[API Debug] ❌ Failed to insert character in DB:", e);
      return res.status(500).json({ error: "Database save failed", message: e.message || e });
    }
  }

  const generatedId = `char-${Date.now()}`;
  const newChar = {
    id: generatedId,
    novelId,
    name,
    role: role || "",
    description: description || "",
    age: age || "",
    appearance: appearance || "",
    personality: personality || "",
    relationInfo: relationInfo || "",
    imageUrl: imageUrl || "",
    customFields: customFields || [],
  };
  mockDb.characters.push(newChar);
  res.json(newChar);
});

app.put("/api/novels/:novelId/characters/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const { name, role, description, age, appearance, personality, relationInfo, imageUrl, customFields } = req.body;

  const dbConnection = getDb();
  if (dbConnection) {
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid character ID format for database update" });
    }
    try {
      console.log(`[API Debug] Updating character: '${id}'`);
      const [updated] = await dbConnection.update(characters).set({
        name, 
        role: role || "", 
        description: description || "", 
        age: age || "", 
        appearance: appearance || "", 
        personality: personality || "", 
        relationInfo: relationInfo || "",
        imageUrl: imageUrl || "",
        customFields: customFields || [],
      }).where(eq(characters.id, id)).returning();

      if (updated) {
        console.log(`[API Debug] ✔ Character '${id}' updated successfully`);
        return res.json(updated);
      }
    } catch (e: any) {
      console.error("[API Debug] ❌ Failed to update character in DB:", e);
      return res.status(500).json({ error: "Database update failed", message: e.message || e });
    }
  }

  const idx = mockDb.characters.findIndex((c) => c.id === id);
  if (idx !== -1) {
    mockDb.characters[idx] = {
      ...mockDb.characters[idx],
      name: name || mockDb.characters[idx].name,
      role: role !== undefined ? role : mockDb.characters[idx].role,
      description: description !== undefined ? description : mockDb.characters[idx].description,
      age: age !== undefined ? age : mockDb.characters[idx].age,
      appearance: appearance !== undefined ? appearance : mockDb.characters[idx].appearance,
      personality: personality !== undefined ? personality : mockDb.characters[idx].personality,
      relationInfo: relationInfo !== undefined ? relationInfo : mockDb.characters[idx].relationInfo,
      imageUrl: imageUrl !== undefined ? imageUrl : mockDb.characters[idx].imageUrl,
      customFields: customFields !== undefined ? customFields : mockDb.characters[idx].customFields,
    };
    return res.json(mockDb.characters[idx]);
  }
  res.status(404).json({ error: "Character not found" });
});

app.delete("/api/novels/:novelId/characters/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const dbConnection = getDb();
  if (dbConnection) {
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid character ID format for database deletion" });
    }
    try {
      console.log(`[API Debug] Deleting character '${id}' from PG`);
      await dbConnection.delete(characters).where(eq(characters.id, id));
      return res.json({ success: true });
    } catch (e: any) {
      console.error("[API Debug] ❌ Failed to delete character in DB:", e);
      return res.status(500).json({ error: "Database deletion failed", message: e.message || e });
    }
  }
  mockDb.characters = mockDb.characters.filter(c => c.id !== id);
  res.json({ success: true });
});

// --- Episodes API ---
app.get("/api/novels/:novelId/episodes", requireAuth, async (req: any, res) => {
  const { novelId } = req.params;
  const dbConnection = getDb();

  if (dbConnection) {
    if (!isValidUuid(novelId)) {
      return res.status(400).json({ error: "Invalid novel ID format for fetching episodes from database" });
    }
    try {
      console.log(`[API Debug] Fetching episodes for novel '${novelId}' from PG`);
      const results = await dbConnection.select().from(episodes).where(eq(episodes.novelId, novelId));
      return res.json(results);
    } catch (e: any) {
      console.error("[API Debug] ❌ Failed to fetch episodes from SQL database:", e);
      return res.status(500).json({ error: "Database fetch failed", message: e.message || e });
    }
  }

  const results = mockDb.episodes.filter((e) => e.novelId === novelId);
  res.json(results);
});

app.post("/api/novels/:novelId/episodes", requireAuth, async (req: any, res) => {
  const { novelId } = req.params;
  const { title, body, status, tag, wordCount } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const dbConnection = getDb();
  if (dbConnection) {
    if (!isValidUuid(novelId)) {
      return res.status(400).json({ error: "Invalid novel ID format for saving episode to database" });
    }
    try {
      console.log(`[API Debug] Inserting episode for novel '${novelId}' into PG`);
      const [inserted] = await dbConnection.insert(episodes).values({
        novelId,
        title,
        body: body || "",
        status: status || "下書き",
        tag: tag || "本編",
        wordCount: Number(wordCount) || 0,
      }).returning();

      if (inserted) {
        console.log(`[API Debug] ✔ Episode '${inserted.id}' saved in Supabase`);
        return res.json(inserted);
      }
    } catch (e: any) {
      console.error("[API Debug] ❌ Failed to save episode in SQL database:", e);
      return res.status(500).json({ error: "Database save failed", message: e.message || e });
    }
  }

  const newEpisode = {
    id: `epi-${Date.now()}`,
    novelId,
    title,
    body: body || "",
    status: status || "下書き",
    tag: tag || "本編",
    wordCount: Number(wordCount) || 0,
    createdAt: new Date(),
  };

  mockDb.episodes.push(newEpisode);
  res.json(newEpisode);
});

app.put("/api/novels/:novelId/episodes/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const { title, body, status, tag, wordCount } = req.body;

  const dbConnection = getDb();
  if (dbConnection) {
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid episode ID format for database update" });
    }
    try {
      console.log(`[API Debug] Updating episode: '${id}'`);
      const [updated] = await dbConnection.update(episodes).set({
        title,
        body: body || "",
        status: status || "下書き",
        tag: tag || "本編",
        wordCount: Number(wordCount) || 0,
      }).where(eq(episodes.id, id)).returning();

      if (updated) {
        console.log(`[API Debug] ✔ Episode '${id}' updated in PG`);
        return res.json(updated);
      }
    } catch (e: any) {
      console.error("[API Debug] ❌ Failed to update episode in DB:", e);
      return res.status(500).json({ error: "Database update failed", message: e.message || e });
    }
  }

  const idx = mockDb.episodes.findIndex((e) => e.id === id);
  if (idx !== -1) {
    mockDb.episodes[idx] = {
      ...mockDb.episodes[idx],
      title: title || mockDb.episodes[idx].title,
      body: body !== undefined ? body : mockDb.episodes[idx].body,
      status: status || mockDb.episodes[idx].status,
      tag: tag || mockDb.episodes[idx].tag,
      wordCount: wordCount !== undefined ? Number(wordCount) : mockDb.episodes[idx].wordCount,
    };
    return res.json(mockDb.episodes[idx]);
  }
  res.status(404).json({ error: "Episode not found" });
});

app.delete("/api/novels/:novelId/episodes/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const dbConnection = getDb();
  if (dbConnection) {
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid episode ID format for database deletion" });
    }
    try {
      console.log(`[API Debug] Deleting episode: '${id}'`);
      await dbConnection.delete(episodes).where(eq(episodes.id, id));
      return res.json({ success: true });
    } catch (e: any) {
      console.error("[API Debug] ❌ Failed to delete episode in DB:", e);
      return res.status(500).json({ error: "Database deletion failed", message: e.message || e });
    }
  }
  mockDb.episodes = mockDb.episodes.filter((e) => e.id !== id);
  res.json({ success: true });
});

// --- SettingWorld API ---
app.get("/api/novels/:novelId/settings", requireAuth, async (req: any, res) => {
  const { novelId } = req.params;
  const dbConnection = getDb();

  if (dbConnection) {
    if (!isValidUuid(novelId)) {
      return res.status(400).json({ error: "Invalid novel ID format for fetching settings" });
    }
    try {
      console.log(`[API Debug] Fetching settings for novel '${novelId}' from PG`);
      const results = await dbConnection.select().from(settings).where(eq(settings.novelId, novelId));
      return res.json(results);
    } catch (e: any) {
      console.error("[API Debug] ❌ Failed to fetch settings from PG:", e);
      return res.status(500).json({ error: "Database fetch failed", message: e.message || e });
    }
  }

  const results = mockDb.settings.filter((s) => s.novelId === novelId);
  res.json(results);
});

app.post("/api/novels/:novelId/settings", requireAuth, async (req: any, res) => {
  const { novelId } = req.params;
  const { title, category, detail, isFusen, fusenStatus } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const dbConnection = getDb();
  if (dbConnection) {
    if (!isValidUuid(novelId)) {
      return res.status(400).json({ error: "Invalid novel ID format for saving settings" });
    }
    try {
      console.log(`[API Debug] Saving setting for novel '${novelId}' in PG`);
      const [inserted] = await dbConnection.insert(settings).values({
        novelId,
        title,
        category: category || "世界観",
        detail: detail || "",
        isFusen: !!isFusen,
        fusenStatus: fusenStatus || "未回収",
      }).returning();

      if (inserted) {
        console.log(`[API Debug] ✔ Setting '${inserted.id}' saved successfully`);
        return res.json(inserted);
      }
    } catch (e: any) {
      console.error("[API Debug] ❌ Failed to save setting in PG:", e);
      return res.status(500).json({ error: "Database save failed", message: e.message || e });
    }
  }

  const newSetting = {
    id: `set-${Date.now()}`,
    novelId,
    title,
    category: category || "世界観",
    detail: detail || "",
    isFusen: !!isFusen,
    fusenStatus: fusenStatus || "未回収",
  };

  mockDb.settings.push(newSetting);
  res.json(newSetting);
});

app.put("/api/novels/:novelId/settings/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const { title, category, detail, isFusen, fusenStatus } = req.body;

  const dbConnection = getDb();
  if (dbConnection) {
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid setting ID format for database update" });
    }
    try {
      console.log(`[API Debug] Updating setting: '${id}'`);
      const [updated] = await dbConnection.update(settings).set({
        title,
        category: category || "世界観",
        detail: detail || "",
        isFusen: !!isFusen,
        fusenStatus: fusenStatus || "未回収",
      }).where(eq(settings.id, id)).returning();

      if (updated) {
        console.log(`[API Debug] ✔ Setting '${id}' updated in PG`);
        return res.json(updated);
      }
    } catch (e: any) {
      console.error("[API Debug] ❌ Failed to update setting in DB:", e);
      return res.status(500).json({ error: "Database update failed", message: e.message || e });
    }
  }

  const idx = mockDb.settings.findIndex((s) => s.id === id);
  if (idx !== -1) {
    mockDb.settings[idx] = {
      ...mockDb.settings[idx],
      title: title || mockDb.settings[idx].title,
      category: category || mockDb.settings[idx].category,
      detail: detail !== undefined ? detail : mockDb.settings[idx].detail,
      isFusen: isFusen !== undefined ? !!isFusen : mockDb.settings[idx].isFusen,
      fusenStatus: fusenStatus || mockDb.settings[idx].fusenStatus,
    };
    return res.json(mockDb.settings[idx]);
  }
  res.status(404).json({ error: "Setting not found" });
});

app.delete("/api/novels/:novelId/settings/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const dbConnection = getDb();
  if (dbConnection) {
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid setting ID format for deletion" });
    }
    try {
      console.log(`[API Debug] Deleting setting: '${id}'`);
      await dbConnection.delete(settings).where(eq(settings.id, id));
      return res.json({ success: true });
    } catch (e: any) {
      console.error("[API Debug] ❌ Failed to delete setting from DB:", e);
      return res.status(500).json({ error: "Database deletion failed", message: e.message || e });
    }
  }
  mockDb.settings = mockDb.settings.filter((s) => s.id !== id);
  res.json({ success: true });
});

// --- MemoIdea API ---
app.get("/api/novels/:novelId/memos", requireAuth, async (req: any, res) => {
  const { novelId } = req.params;
  const dbConnection = getDb();

  if (dbConnection) {
    if (!isValidUuid(novelId)) {
      return res.status(400).json({ error: "Invalid novel ID format for fetching memos" });
    }
    try {
      console.log(`[API Debug] Fetching memos for novel '${novelId}' from PG`);
      const results = await dbConnection.select().from(mementos).where(eq(mementos.novelId, novelId));
      return res.json(results);
    } catch (e: any) {
      console.error("[API Debug] ❌ Failed to fetch memos from SQL:", e);
      return res.status(500).json({ error: "Database fetch failed", message: e.message || e });
    }
  }

  const results = mockDb.memos.filter((m) => m.novelId === novelId);
  res.json(results);
});

app.post("/api/novels/:novelId/memos", requireAuth, async (req: any, res) => {
  const { novelId } = req.params;
  const { title, content, color } = req.body;

  if (!title && !content) {
    return res.status(400).json({ error: "Title or content is required" });
  }

  const dbConnection = getDb();
  if (dbConnection) {
    if (!isValidUuid(novelId)) {
      return res.status(400).json({ error: "Invalid novel ID format for saving memos" });
    }
    try {
      console.log(`[API Debug] Saving memo for novel '${novelId}' in PG`);
      const [inserted] = await dbConnection.insert(mementos).values({
        novelId,
        title: title || "無題のメモ",
        content: content || "",
        color: color || "#fffbeb",
      }).returning();

      if (inserted) {
        console.log(`[API Debug] ✔ Memo '${inserted.id}' saved successfully`);
        return res.json(inserted);
      }
    } catch (e: any) {
      console.error("[API Debug] ❌ Failed to save memo in PG:", e);
      return res.status(500).json({ error: "Database save failed", message: e.message || e });
    }
  }

  const newMemo = {
    id: `mem-${Date.now()}`,
    novelId,
    title: title || "無題のメモ",
    content: content || "",
    color: color || "#fffbeb",
    createdAt: new Date(),
  };

  mockDb.memos.push(newMemo);
  res.json(newMemo);
});

app.put("/api/novels/:novelId/memos/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const { title, content, color } = req.body;

  const dbConnection = getDb();
  if (dbConnection) {
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid memo ID format for database update" });
    }
    try {
      console.log(`[API Debug] Updating memo: '${id}'`);
      const [updated] = await dbConnection.update(mementos).set({
        title,
        content: content || "",
        color: color || "#fffbeb",
      }).where(eq(mementos.id, id)).returning();

      if (updated) {
        console.log(`[API Debug] ✔ Memo '${id}' updated in PG`);
        return res.json(updated);
      }
    } catch (e: any) {
      console.error("[API Debug] ❌ Failed to update memo in DB:", e);
      return res.status(500).json({ error: "Database update failed", message: e.message || e });
    }
  }

  const idx = mockDb.memos.findIndex((m) => m.id === id);
  if (idx !== -1) {
    mockDb.memos[idx] = {
      ...mockDb.memos[idx],
      title: title || mockDb.memos[idx].title,
      content: content !== undefined ? content : mockDb.memos[idx].content,
      color: color || mockDb.memos[idx].color,
    };
    return res.json(mockDb.memos[idx]);
  }
  res.status(404).json({ error: "Memo not found" });
});

app.delete("/api/novels/:novelId/memos/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const dbConnection = getDb();
  if (dbConnection && isValidUuid(id)) {
    try {
      console.log(`[API Debug] Deleting memo: '${id}'`);
      await dbConnection.delete(mementos).where(eq(mementos.id, id));
      return res.json({ success: true });
    } catch (e) {
      console.error("[API Debug] ❌ Failed to delete memo in DB:", e);
    }
  }
  mockDb.memos = mockDb.memos.filter((m) => m.id !== id);
  res.json({ success: true });
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

// --- Export for Vercel Serverless ---
export default app;

async function start() {
  // Vite/Static asset delivery
  if (process.env.NODE_ENV !== "production") {
    await setupVite(app, server);
  } else if (!process.env.VERCEL) {
    serveStatic(app);
  }

  if (!process.env.VERCEL) {
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`[Server] Plot Palette listening on port ${PORT}`);
    });
  }
}

start().catch((err) => {
  console.error("[Server] Start failure:", err);
});
