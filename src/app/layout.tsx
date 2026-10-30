import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Media Grabber",
  description:
    "Download videos, images & audio from YouTube, TikTok, Instagram, X/Twitter, Facebook, Reddit, and Pinterest — with watermark removal and MP3 export.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
