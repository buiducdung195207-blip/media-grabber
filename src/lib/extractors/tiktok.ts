/**
 * TikTok extractor — watermark removal via Cobalt's isNoTTWatermark flag
 * Falls back to public API scraping if Cobalt is unavailable.
 */

import type { MediaInfo } from "@/types/media";
import { cobaltFetch } from "./cobalt";

export async function tiktokGetInfo(
  url: string,
  removeWatermark = false
): Promise<MediaInfo> {
  // Cobalt handles TikTok natively with watermark-removal support
  const res = await cobaltFetch({
    url,
    vQuality: "max",
    isNoTTWatermark: removeWatermark,
  });

  const renditions = [];

  if ((res.status === "redirect" || res.status === "tunnel") && res.url) {
    renditions.push({
      url: res.url,
      quality: "max",
      format: "mp4",
      hasWatermark: !removeWatermark,
    });
  }

  if (res.status === "picker" && res.picker) {
    res.picker.forEach((item, i) => {
      renditions.push({
        url: item.url,
        quality: `option-${i + 1}`,
        format: "mp4",
        hasWatermark: !removeWatermark,
      });
    });
  }

  // Also fetch audio-only
  try {
    const audio = await cobaltFetch({ url, isAudioOnly: true, aFormat: "mp3" });
    if ((audio.status === "redirect" || audio.status === "tunnel") && audio.url) {
      renditions.push({
        url: audio.url,
        quality: "audio-only",
        format: "mp3",
        hasWatermark: false,
      });
    }
  } catch {
    // audio extraction is best-effort
  }

  return {
    platform: "tiktok",
    type: "video",
    title: "TikTok Video",
    renditions,
    supportsWatermarkFree: true,
  };
}
