/**
 * Cobalt API adapter
 * Cobalt (https://cobalt.tools) is an open-source, privacy-respecting
 * social media downloader. We use its public or self-hosted API as a
 * primary extraction backend for most platforms.
 *
 * API docs: https://github.com/imputnet/cobalt
 */

import type { MediaInfo, MediaRendition, Platform } from "@/types/media";
import { detectPlatform } from "@/lib/utils";

const COBALT_BASE = process.env.COBALT_API_URL ?? "https://api.cobalt.tools";

interface CobaltRequest {
  url: string;
  vQuality?: "max" | "4320" | "2160" | "1440" | "1080" | "720" | "480" | "360" | "240" | "144";
  aFormat?: "best" | "mp3" | "ogg" | "wav" | "opus";
  isAudioOnly?: boolean;
  isNoTTWatermark?: boolean; // TikTok: remove watermark
  isTTFullAudio?: boolean;
  isAudioMuted?: boolean;
  dubLang?: boolean;
  disableMetadata?: boolean;
  twitterGif?: boolean;
  tiktokH265?: boolean;
}

interface CobaltSuccess {
  status: "redirect" | "tunnel" | "picker" | "error";
  url?: string;
  urls?: string[];
  filename?: string;
  audio?: string;
  pickerType?: string;
  picker?: Array<{ url: string; thumb?: string; type?: string }>;
}

/** Call the Cobalt API and return raw response */
export async function cobaltFetch(req: CobaltRequest): Promise<CobaltSuccess> {
  const res = await fetch(`${COBALT_BASE}/api/json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cobalt API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<CobaltSuccess>;
}

/** Map a Cobalt response to our canonical MediaInfo shape */
export async function cobaltGetInfo(
  url: string,
  audioOnly = false,
  removeWatermark = false
): Promise<MediaInfo> {
  const platform: Platform = detectPlatform(url);

  // Fetch both max-quality video and audio renditions in parallel
  const [videoRes, audioRes] = await Promise.allSettled([
    audioOnly
      ? null
      : cobaltFetch({
          url,
          vQuality: "max",
          isNoTTWatermark: removeWatermark && platform === "tiktok",
          isAudioMuted: false,
        }),
    cobaltFetch({
      url,
      isAudioOnly: true,
      aFormat: "mp3",
    }),
  ]);

  const renditions: MediaRendition[] = [];

  if (videoRes.status === "fulfilled" && videoRes.value) {
    const v = videoRes.value;
    if (v.status === "redirect" || v.status === "tunnel") {
      renditions.push({
        url: v.url!,
        quality: "max",
        format: "mp4",
        hasWatermark: !(removeWatermark && platform === "tiktok"),
      });
    } else if (v.status === "picker" && v.picker) {
      v.picker.forEach((item, i) => {
        renditions.push({
          url: item.url,
          quality: `option-${i + 1}`,
          format: item.type ?? "mp4",
          hasWatermark: false,
        });
      });
    }
  }

  if (audioRes.status === "fulfilled" && audioRes.value) {
    const a = audioRes.value;
    if (a.status === "redirect" || a.status === "tunnel") {
      renditions.push({
        url: a.url!,
        quality: "audio-only",
        format: "mp3",
        hasWatermark: false,
      });
    }
  }

  return {
    platform,
    type: audioOnly ? "audio" : "video",
    title: "Media from " + platform,
    renditions,
    supportsWatermarkFree: platform === "tiktok" || platform === "instagram",
  };
}
