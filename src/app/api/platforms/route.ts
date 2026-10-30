import { type NextRequest } from "next/server";
import { errorResponse, successResponse, detectPlatform } from "@/lib/utils";
import { urlSchema } from "@/lib/validation";

export const maxDuration = 10;
export const runtime = "nodejs";

/**
 * GET /api/platforms
 *
 * Returns the list of supported platforms + feature matrix.
 * No input required.
 *
 * GET /api/platforms?url=<encoded-url>
 * Returns detection result for a specific URL.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get("url");

  if (rawUrl) {
    const parsed = urlSchema.safeParse(rawUrl);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);
    return successResponse({ platform: detectPlatform(parsed.data) });
  }

  return successResponse({
    platforms: [
      { id: "youtube",   name: "YouTube",   watermarkFree: true,  audioExport: true,  imageDownload: false },
      { id: "tiktok",    name: "TikTok",    watermarkFree: true,  audioExport: true,  imageDownload: false },
      { id: "instagram", name: "Instagram", watermarkFree: true,  audioExport: false, imageDownload: true  },
      { id: "twitter",   name: "X/Twitter", watermarkFree: false, audioExport: false, imageDownload: true  },
      { id: "facebook",  name: "Facebook",  watermarkFree: false, audioExport: false, imageDownload: false },
      { id: "reddit",    name: "Reddit",    watermarkFree: false, audioExport: false, imageDownload: true  },
      { id: "pinterest", name: "Pinterest", watermarkFree: false, audioExport: false, imageDownload: true  },
    ],
  });
}
