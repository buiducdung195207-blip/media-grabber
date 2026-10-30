import { type NextRequest } from "next/server";
import { infoQuerySchema } from "@/lib/validation";
import { extractMediaInfo } from "@/lib/extractors";
import { errorResponse, successResponse } from "@/lib/utils";

// Vercel: allow up to 30s on this route
export const maxDuration = 30;
export const runtime = "nodejs";

/**
 * GET /api/info?url=<encoded-url>
 *
 * Returns metadata and available renditions for any supported link.
 * Stateless — no DB required.
 *
 * @example
 * curl "https://your-app.vercel.app/api/info?url=https%3A%2F%2Fyoutu.be%2FdQw4w9WgXcQ"
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("url");

  // Validate input
  const parsed = infoQuerySchema.safeParse({ url: raw });
  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0].message);
  }

  try {
    const info = await extractMediaInfo(parsed.data.url);
    return successResponse(info);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to extract media info";
    console.error("[/api/info]", message);
    return errorResponse(message, 502);
  }
}

/** Handle CORS preflight */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
