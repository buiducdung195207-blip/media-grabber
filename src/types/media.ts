// ---------------------------------------------------------------------------
// Shared types used across all API routes
// ---------------------------------------------------------------------------

/** Supported social media platforms */
export type Platform =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "twitter"
  | "facebook"
  | "reddit"
  | "pinterest"
  | "unknown";

/** Media format kinds */
export type MediaType = "video" | "audio" | "image";

/** Requested output format */
export type OutputFormat = "mp4" | "mp3" | "webm" | "jpg" | "png" | "gif";

/** A single rendition available for download */
export interface MediaRendition {
  url: string;
  quality: string; // e.g. "1080p", "720p", "audio-only", "original"
  format: string;  // file extension
  size?: number;   // bytes, if known
  hasWatermark: boolean;
}

/** Top-level response from /api/info */
export interface MediaInfo {
  platform: Platform;
  type: MediaType;
  title: string;
  thumbnail?: string;
  duration?: number; // seconds
  author?: string;
  renditions: MediaRendition[];
  /** Whether the platform natively supports watermark-free download */
  supportsWatermarkFree: boolean;
}

/** Request body for /api/download */
export interface DownloadRequest {
  url: string;
  format?: OutputFormat;
  quality?: string;
  /** Strip watermark when possible */
  removeWatermark?: boolean;
  /** Extract audio only as MP3 */
  audioOnly?: boolean;
}

/** Response envelope for all API routes */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
