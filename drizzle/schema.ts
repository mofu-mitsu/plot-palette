import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  openId: text("open_id").primaryKey(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("login_method"), // google or sandbox
  lastSignedIn: timestamp("last_signed_in"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const novels = pgTable("novels", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.openId),
  title: text("title").notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const plots = pgTable("plots", {
  id: uuid("id").primaryKey().defaultRandom(),
  novelId: uuid("novel_id").references(() => novels.id),
  title: text("title").notNull(),
  content: text("content"),
  orderNo: text("order_no"), // Order representation
  createdAt: timestamp("created_at").defaultNow(),
});

export const characters = pgTable("characters", {
  id: uuid("id").primaryKey().defaultRandom(),
  novelId: uuid("novel_id").references(() => novels.id),
  name: text("name").notNull(),
  role: text("role"), // protag, antagonist, sub
  description: text("description"),
  age: text("age"),
  appearance: text("appearance"),
  personality: text("personality"),
  relationInfo: text("relation_info"),
  createdAt: timestamp("created_at").defaultNow(),
});
