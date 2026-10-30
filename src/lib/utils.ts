import type { Platform } from "@/types/media";

/** Detect which social platform a URL belongs to */
export function detectPlatform(url: string): Platform {
  try {
    const { hostname } = new URL(url);
    const host = hostname.replace(/^www\./, "").toLowerCase();

    if (host.includes("youtube.com") || host === "youtu.be") return "youtube";
    if (host.includes("tiktok.com")) return "tiktok";
    if (host.includes("instagram.com")) return "instagram";
    if (host.includes("twitter.com") || host.includes("x.com")) return "twitter";
    if (host.includes("facebook.com") || host === "fb.watch") return "facebook";
    if (host.includes("reddit.com") || host === "redd.it") return "reddit";
    if (host.includes("pinterest.com") || host === "pin.it") return "pinterest";
    return "unknown";
  } catch {
    return "unknown";
  }
}

/** Build a safe filename from a title string */
export function sanitiseFilename(title: string, ext: string): string {
  const safe = title
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80);
  return `${safe || "media"}.${ext}`;
}

/** Format bytes to a human-readable string */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

/** Return a standard JSON error response */
export function errorResponse(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

/** Return a standard JSON success response */
export function successResponse<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status });
}
