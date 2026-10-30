/**
 * Instagram extractor — images, Reels, Stories via Cobalt
 */

import type { MediaInfo, MediaRendition } from "@/types/media";
import { cobaltFetch } from "./cobalt";

export async function instagramGetInfo(url: string): Promise<MediaInfo> {
  const res = await cobaltFetch({ url, vQuality: "max" });

  const renditions: MediaRendition[] = [];

  if ((res.status === "redirect" || res.status === "tunnel") && res.url) {
    const isImage = res.url.match(/\.(jpg|jpeg|png|webp)/i);
    renditions.push({
      url: res.url,
      quality: "original",
      format: isImage ? "jpg" : "mp4",
      hasWatermark: false,
    });
  }

  if (res.status === "picker" && res.picker) {
    res.picker.forEach((item, i) => {
      const isImage = item.url.match(/\.(jpg|jpeg|png|webp)/i);
      renditions.push({
        url: item.url,
        quality: `slide-${i + 1}`,
        format: isImage ? "jpg" : "mp4",
        hasWatermark: false,
      });
    });
  }

  const hasVideo = renditions.some((r) => r.format === "mp4");

  return {
    platform: "instagram",
    type: hasVideo ? "video" : "image",
    title: "Instagram Post",
    renditions,
    supportsWatermarkFree: true,
  };
}
