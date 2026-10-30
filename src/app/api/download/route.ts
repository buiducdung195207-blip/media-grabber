import { type NextRequest } from "next/server";
import { downloadBodySchema } from "@/lib/validation";
import { extractMediaInfo } from "@/lib/extractors";
import { youtubeStream } from "@/lib/extractors/youtube";
import { detectPlatform, sanitiseFilename, errorResponse } from "@/lib/utils";

// Vercel: allow up to 60s (Pro plan) for download proxying
export const maxDuration = 60;
export const runtime = "nodejs";

/**
 * POST /api/download
 *
 * Body (JSON):
 * {
 *   "url": "https://...",
 *   "format": "mp4" | "mp3" | ...,   // optional
 *   "quality": "1080p",               // optional
 *   "removeWatermark": true,          // optional
 *   "audioOnly": true                 // optional — forces MP3 output
 * }
 *
 * Behaviour:
 * - For YouTube: streams directly through the serverless function as a
 *   proxy so the browser receives a proper Content-Disposition download.
 * - For other platforms: resolves the best rendition URL and returns a
 *   JSON redirect URL (the client performs the final fetch itself).
 *
 * Stateless — no DB required.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Request body must be valid JSON");
  }

  const parsed = downloadBodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.errors[0].message);
  }

  const { url, format, quality, removeWatermark, audioOnly } = parsed.data;
  const platform = detectPlatform(url);

  // -----------------------------------------------------------------------
  // YouTube: proxy the stream so we can set Content-Disposition
  // -----------------------------------------------------------------------
  if (platform === "youtube") {
    try {
      const info = await extractMediaInfo(url, { audioOnly, removeWatermark });
      const title = info.title ?? "video";
      const ext = audioOnly ? "mp3" : "mp4";
      const filename = sanitiseFilename(title, ext);

      const stream = youtubeStream(url, !!audioOnly);

      // Convert Node.js Readable to Web ReadableStream
      const webStream = new ReadableStream({
        start(controller) {
          stream.on("data", (chunk: Buffer) => controller.enqueue(chunk));
          stream.on("end", () => controller.close());
          stream.on("error", (e: Error) => controller.error(e));
        },
        cancel() {
          stream.destroy();
        },
      });

      return new Response(webStream, {
        headers: {
          "Content-Type": audioOnly ? "audio/mpeg" : "video/mp4",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Transfer-Encoding": "chunked",
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "YouTube extraction failed";
      console.error("[/api/download youtube]", message);
      return errorResponse(message, 502);
    }
  }

  // -----------------------------------------------------------------------
  // All other platforms: resolve best rendition and return redirect JSON
  // -----------------------------------------------------------------------
  try {
    const info = await extractMediaInfo(url, { audioOnly, removeWatermark });

    if (info.renditions.length === 0) {
      return errorResponse("No downloadable renditions found for this URL", 404);
    }

    // Pick the best rendition matching requested quality/format
    let chosen = info.renditions[0];

    if (audioOnly || format === "mp3") {
      const audio = info.renditions.find((r) => r.quality === "audio-only" || r.format === "mp3");
      if (audio) chosen = audio;
    } else if (quality) {
      const match = info.renditions.find((r) => r.quality === quality);
      if (match) chosen = match;
    }

    const ext = chosen.format;
    const filename = sanitiseFilename(info.title, ext);

    return Response.json({
      success: true,
      data: {
        downloadUrl: chosen.url,
        filename,
        format: ext,
        quality: chosen.quality,
        hasWatermark: chosen.hasWatermark,
        platform,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Download resolution failed";
    console.error("[/api/download]", message);
    return errorResponse(message, 502);
  }
}

/** Handle CORS preflight */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
