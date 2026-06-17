import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import axios, { AxiosError } from "axios";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

async function exchangeGoogleCode(code: string, redirectUri: string) {
  // Google requires application/x-www-form-urlencoded
  const params = new URLSearchParams({
    code,
    client_id: ENV.googleClientId,
    client_secret: ENV.googleClientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  console.log("[OAuth] Exchanging code with redirect_uri:", redirectUri);
  console.log("[OAuth] Using client_id:", ENV.googleClientId ? ENV.googleClientId.slice(0, 20) + "..." : "(not set)");
  console.log("[OAuth] client_secret set:", !!ENV.googleClientSecret);

  const { data } = await axios.post(
    "https://oauth2.googleapis.com/token",
    params.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return data as { access_token: string };
}

async function getGoogleUserInfo(accessToken: string) {
  const { data } = await axios.get(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return data as { sub: string; name?: string; email?: string };
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/auth/sandbox", async (req: Request, res: Response) => {
    try {
      const rawDeviceId = req.query.device_id && typeof req.query.device_id === "string" ? req.query.device_id : "";
      const deviceId = rawDeviceId ? rawDeviceId : `sb-guest-${Math.random().toString(36).substring(2, 9)}`;
      const openId = `google:sandbox-${deviceId}`;
      const name = "プロットクリエイター (ゲスト)";
      const email = `sandbox-${deviceId}@example.com`;

      try {
        await db.upsertUser({
          openId,
          name,
          email,
          loginMethod: "sandbox",
          lastSignedIn: new Date(),
        });
      } catch (dbError) {
        console.error("[Sandbox Auth] DB Upsert Guest Synced Failed, continuing with in-memory fallback:", dbError);
      }

      const sessionToken = await sdk.createSessionToken(openId, {
        name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { 
        ...cookieOptions, 
        secure: true, // Required for SameSite=None
        sameSite: "none",
        maxAge: ONE_YEAR_MS 
      });
      res.redirect(302, "/");
    } catch (error: any) {
      console.error("[Sandbox Auth] Failed:", error);
      res.status(500).json({ error: "Sandbox auth failed", message: error?.message, stack: error?.stack });
    }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const origin = Buffer.from(state, "base64").toString("utf-8");
      const redirectUri = `${origin}/api/oauth/callback`;
      console.log("[OAuth] Decoded redirect_uri:", redirectUri);

      const tokenData = await exchangeGoogleCode(code, redirectUri);
      const userInfo = await getGoogleUserInfo(tokenData.access_token);

      if (!userInfo.sub) {
        res.status(400).json({ error: "Google user id (sub) missing" });
        return;
      }

      const openId = `google:${userInfo.sub}`;

      try {
        await db.upsertUser({
          openId,
          name: userInfo.name ?? null,
          email: userInfo.email ?? null,
          loginMethod: "google",
          lastSignedIn: new Date(),
        });
      } catch (dbError) {
        console.error("[OAuth] DB Upsert Failed, continuing with in-memory fallback:", dbError);
      }

      const sessionToken = await sdk.createSessionToken(openId, {
        name: userInfo.name ?? "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { 
        ...cookieOptions, 
        secure: true, // Required for SameSite=None
        sameSite: "none",
        maxAge: ONE_YEAR_MS 
      });
      res.redirect(302, "/");
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error("[OAuth] Google API error:", error.response?.status, JSON.stringify(error.response?.data));
      } else if (error instanceof Error) {
        console.error("[OAuth] Callback failed:", error.message);
        if ((error as any).cause) {
          console.error("[OAuth] Caused by:", (error as any).cause);
        }
        // Drizzle wraps the original DB error in error.cause
        const cause = (error as any).cause ?? (error as any).originalError;
        if (cause) {
          console.error("[OAuth] DB error code:", (cause as any).code, "message:", (cause as any).message, "sqlMessage:", (cause as any).sqlMessage);
        }
      } else {
        console.error("[OAuth] Unknown error:", error);
      }
      res.status(500).json({ error: "OAuth callback failed", message: (error as any)?.message });
    }
  });
}
