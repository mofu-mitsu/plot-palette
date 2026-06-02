import type { Request } from "express";

export function getSessionCookieOptions(req: Request) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || req.secure,
    sameSite: "none" as const,
    path: "/",
  };
}
