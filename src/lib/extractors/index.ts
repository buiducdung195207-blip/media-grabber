/**
 * Router — dispatches to the correct per-platform extractor
 */

import type { MediaInfo } from "@/types/media";
import { detectPlatform } from "@/lib/utils";
import { youtubeGetInfo } from "./youtube";
import { tiktokGetInfo } from "./tiktok";
import { instagramGetInfo } from "./instagram";
import { genericGetInfo } from "./generic";

export async function extractMediaInfo(
  url: string,
  options: { audioOnly?: boolean; removeWatermark?: boolean } = {}
): Promise<MediaInfo> {
  const platform = detectPlatform(url);

  switch (platform) {
    case "youtube":
      return youtubeGetInfo(url);
    case "tiktok":
      return tiktokGetInfo(url, options.removeWatermark);
    case "instagram":
      return instagramGetInfo(url);
    default:
      return genericGetInfo(url);
  }
}
