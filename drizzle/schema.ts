import { pgTable, text, timestamp, uuid, integer, boolean, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("palette_users", {
  openId: text("open_id").primaryKey(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("login_method"), // google or sandbox
  isPremium: boolean("is_premium").default(false),
  lastSignedIn: timestamp("last_signed_in"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const novels = pgTable("palette_novels", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.openId, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  themeDoc: text("theme_doc"),
  targetAudience: text("target_audience"),
  endingDoc: text("ending_doc"),
  wordGoal: integer("word_goal").default(50000),
  writeDays: integer("write_days").default(30),
  chartImage: text("chart_image"),
  chartMemo: text("chart_memo"),
  referenceLinks: jsonb("reference_links").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const plots = pgTable("palette_plots", {
  id: uuid("id").primaryKey().defaultRandom(),
  novelId: uuid("novel_id").references(() => novels.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content"),
  orderNo: text("order_no"), // Order representation
  phase: text("phase").default("起"),
  timelineDate: text("timeline_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const characters = pgTable("palette_characters", {
  id: uuid("id").primaryKey().defaultRandom(),
  novelId: uuid("novel_id").references(() => novels.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role"), // protag, antagonist, sub
  description: text("description"),
  age: text("age"),
  appearance: text("appearance"),
  personality: text("personality"),
  relationInfo: text("relation_info"),
  imageUrl: text("image_url"),
  customFields: jsonb("custom_fields").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const episodes = pgTable("palette_episodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  novelId: uuid("novel_id").references(() => novels.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").default(""),
  status: text("status").default("下書き"),
  tag: text("tag").default("本編"),
  wordCount: integer("word_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const settings = pgTable("palette_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  novelId: uuid("novel_id").references(() => novels.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  category: text("category").default("世界観"),
  detail: text("detail").default(""),
  isFusen: boolean("is_fusen").default(false),
  fusenStatus: text("fusen_status").default("未回収"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mementos = pgTable("palette_memos", {
  id: uuid("id").primaryKey().defaultRandom(),
  novelId: uuid("novel_id").references(() => novels.id, { onDelete: "cascade" }),
  title: text("title").default("無題のメモ"),
  content: text("content").default(""),
  color: text("color").default("#fffbeb"),
  createdAt: timestamp("created_at").defaultNow(),
});
