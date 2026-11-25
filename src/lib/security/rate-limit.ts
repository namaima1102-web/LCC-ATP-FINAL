import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Băm địa chỉ IP bằng SHA-256 (không bao giờ lưu IP thô vào cơ sở dữ liệu).
 */
export function hashIp(ip: string): string {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 16) ?? "lcc-2026-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/**
 * Lấy IP từ request header (Vercel / reverse proxy).
 */
export function extractClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "127.0.0.1";
}

/**
 * Kiểm tra giới hạn số lần gửi trong 1 giờ theo `ip_hash`.
 */
export async function isRateLimited(
  db: SupabaseClient,
  ipHash: string,
  limitPerHour: number
): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count, error } = await db
    .from("score_submissions")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", oneHourAgo);

  if (error) return false;
  return (count ?? 0) >= limitPerHour;
}
