/**
 * YouTube extractor — uses @distube/ytdl-core (maintained fork of ytdl-core)
 * Provides rich metadata: title, thumbnail, duration, author, all renditions.
 */

import ytdl from "@distube/ytdl-core";
import type { MediaInfo, MediaRendition } from "@/types/media";

export async function youtubeGetInfo(url: string): Promise<MediaInfo> {
  const info = await ytdl.getInfo(url);
  const details = info.videoDetails;

  const renditions: MediaRendition[] = [];

  // Video + audio formats
  const videoFormats = ytdl
    .filterFormats(info.formats, "videoandaudio")
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0));

  videoFormats.forEach((f) => {
    renditions.push({
      url: f.url,
      quality: f.qualityLabel ?? f.quality,
      format: f.container ?? "mp4",
      size: Number(f.contentLength) || undefined,
      hasWatermark: false,
    });
  });

  // Audio-only formats
  const audioFormats = ytdl
    .filterFormats(info.formats, "audioonly")
    .sort((a, b) => (b.audioBitrate ?? 0) - (a.audioBitrate ?? 0));

  audioFormats.slice(0, 3).forEach((f) => {
    renditions.push({
      url: f.url,
      quality: `audio-${f.audioBitrate ?? "best"}kbps`,
      format: f.container ?? "webm",
      size: Number(f.contentLength) || undefined,
      hasWatermark: false,
    });
  });

  return {
    platform: "youtube",
    type: "video",
    title: details.title,
    thumbnail: details.thumbnails?.at(-1)?.url,
    duration: Number(details.lengthSeconds),
    author: details.author?.name,
    renditions,
    supportsWatermarkFree: true,
  };
}

/** Get a readable stream for a specific YouTube URL + format */
export function youtubeStream(url: string, audioOnly: boolean) {
  const filter = audioOnly ? "audioonly" : "videoandaudio";
  return ytdl(url, { filter, quality: audioOnly ? "highestaudio" : "highest" });
}
