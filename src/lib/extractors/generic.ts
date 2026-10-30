/**
 * Generic extractor — delegates to Cobalt for Twitter, Facebook, Reddit, Pinterest, etc.
 */

import type { MediaInfo, MediaRendition } from "@/types/media";
import { cobaltFetch } from "./cobalt";
import { detectPlatform } from "@/lib/utils";

export async function genericGetInfo(url: string): Promise<MediaInfo> {
  const platform = detectPlatform(url);
  const res = await cobaltFetch({ url, vQuality: "max" });

  const renditions: MediaRendition[] = [];

  if ((res.status === "redirect" || res.status === "tunnel") && res.url) {
    renditions.push({
      url: res.url,
      quality: "max",
      format: "mp4",
      hasWatermark: false,
    });
  }

  if (res.status === "picker" && res.picker) {
    res.picker.forEach((item, i) => {
      const isImage = item.url.match(/\.(jpg|jpeg|png|webp|gif)/i);
      renditions.push({
        url: item.url,
        quality: `item-${i + 1}`,
        format: isImage ? (item.url.match(/\.gif/i) ? "gif" : "jpg") : "mp4",
        hasWatermark: false,
      });
    });
  }

  return {
    platform,
    type: "video",
    title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Media`,
    renditions,
    supportsWatermarkFree: false,
  };
}
