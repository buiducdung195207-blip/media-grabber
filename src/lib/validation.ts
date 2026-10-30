import { z } from "zod";

/** Validate and sanitise any URL submitted by the user */
export const urlSchema = z
  .string()
  .min(1, "URL is required")
  .url("Must be a valid URL")
  .refine(
    (url) => url.startsWith("http://") || url.startsWith("https://"),
    "Only HTTP/HTTPS URLs are supported"
  );

/** Schema for /api/download POST body */
export const downloadBodySchema = z.object({
  url: urlSchema,
  format: z.enum(["mp4", "mp3", "webm", "jpg", "png", "gif"]).optional(),
  quality: z.string().optional(),
  removeWatermark: z.boolean().optional().default(false),
  audioOnly: z.boolean().optional().default(false),
});

/** Schema for /api/info query params */
export const infoQuerySchema = z.object({
  url: urlSchema,
});
