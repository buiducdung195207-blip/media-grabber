import { successResponse } from "@/lib/utils";

export const runtime = "nodejs";

/**
 * GET /api/health
 * Simple liveness probe used by Vercel and uptime monitors.
 */
export async function GET() {
  return successResponse({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "1.0.0",
  });
}
