import { defineConfig } from "drizzle-kit";

// For migrations, use the direct URL (no pgbouncer) if provided,
// otherwise strip pgbouncer param from DATABASE_URL
const rawUrl = process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL;
if (!rawUrl) {
  throw new Error("DATABASE_URL or DATABASE_DIRECT_URL is required to run drizzle commands");
}
// Strip pgbouncer=true as drizzle-kit needs a direct connection
const connectionString = rawUrl.replace(/[?&]pgbouncer=true/, "").replace(/\?$/, "");

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
