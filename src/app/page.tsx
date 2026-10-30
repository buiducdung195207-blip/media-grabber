"use client";

import { useState } from "react";
import type { MediaInfo, DownloadRequest, ApiResponse } from "@/types/media";

// ─── Inline styles (no Tailwind dependency needed) ───────────────────────────
const s = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    padding: "2rem 1rem",
    background: "var(--bg)",
  },
  hero: { textAlign: "center" as const, marginBottom: "2.5rem" },
  h1: { fontSize: "clamp(1.8rem,5vw,2.8rem)", fontWeight: 800, letterSpacing: "-0.02em" },
  accent: { color: "var(--accent)" },
  sub: { color: "var(--muted)", marginTop: "0.5rem", fontSize: "1rem" },
  card: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "1rem",
    padding: "1.5rem",
    width: "100%",
    maxWidth: 680,
  },
  row: { display: "flex", gap: "0.75rem" },
  input: {
    flex: 1,
    background: "var(--bg)",
    border: "1.5px solid var(--border)",
    borderRadius: "0.6rem",
    color: "var(--text)",
    padding: "0.75rem 1rem",
    fontSize: "0.95rem",
    outline: "none",
  },
  btn: (disabled: boolean) => ({
    background: disabled ? "#444" : "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: "0.6rem",
    padding: "0.75rem 1.4rem",
    fontWeight: 700,
    fontSize: "0.95rem",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background 0.15s",
    whiteSpace: "nowrap" as const,
  }),
  opts: { display: "flex", gap: "1rem", marginTop: "0.75rem", flexWrap: "wrap" as const },
  label: { display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.88rem", color: "var(--muted)", cursor: "pointer" },
  section: { marginTop: "1.5rem" },
  sectionTitle: { fontWeight: 700, marginBottom: "0.75rem", fontSize: "0.95rem" },
  thumb: { width: "100%", borderRadius: "0.6rem", objectFit: "cover" as const, maxHeight: 260 },
  meta: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem 1rem", marginTop: "0.75rem", fontSize: "0.88rem", color: "var(--muted)" },
  metaVal: { color: "var(--text)" },
  renditionList: { display: "flex", flexDirection: "column" as const, gap: "0.5rem", marginTop: "0.75rem" },
  rendition: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "0.5rem",
    padding: "0.6rem 0.9rem",
    fontSize: "0.88rem",
  },
  badge: (wm: boolean) => ({
    background: wm ? "#3b1010" : "#103b1a",
    color: wm ? "#ef4444" : "#22c55e",
    borderRadius: "999px",
    padding: "0.15rem 0.5rem",
    fontSize: "0.75rem",
    fontWeight: 600,
  }),
  dlBtn: {
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: "0.4rem",
    padding: "0.35rem 0.75rem",
    cursor: "pointer",
    fontSize: "0.82rem",
    fontWeight: 600,
  },
  error: {
    marginTop: "1rem",
    background: "#1e0a0a",
    border: "1px solid var(--error)",
    borderRadius: "0.5rem",
    padding: "0.75rem 1rem",
    color: "var(--error)",
    fontSize: "0.88rem",
  },
  platforms: {
    display: "flex",
    gap: "0.4rem",
    flexWrap: "wrap" as const,
    justifyContent: "center",
    marginBottom: "1.5rem",
  },
  chip: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "999px",
    padding: "0.25rem 0.75rem",
    fontSize: "0.78rem",
    color: "var(--muted)",
  },
};

const PLATFORMS = ["YouTube", "TikTok", "Instagram", "X/Twitter", "Facebook", "Reddit", "Pinterest"];

function formatDuration(sec?: number) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [audioOnly, setAudioOnly] = useState(false);
  const [removeWatermark, setRemoveWatermark] = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<MediaInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dlLoading, setDlLoading] = useState<string | null>(null);

  async function fetchInfo() {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/info?url=${encodeURIComponent(url)}`);
      const json: ApiResponse<MediaInfo> = await res.json();
      if (!json.success || !json.data) throw new Error(json.error ?? "Unknown error");
      setInfo(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch info");
    } finally {
      setLoading(false);
    }
  }

  async function download(quality: string, renditionFormat: string) {
    setDlLoading(quality);
    const body: DownloadRequest = {
      url,
      quality,
      format: renditionFormat as DownloadRequest["format"],
      audioOnly,
      removeWatermark,
    };
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // YouTube returns a stream — trigger browser save
      const contentType = res.headers.get("Content-Type") ?? "";
      if (contentType.startsWith("video/") || contentType.startsWith("audio/")) {
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ?? "media";
        a.click();
        return;
      }

      // Other platforms return a redirect URL
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Download failed");
      window.open(json.data.downloadUrl, "_blank");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDlLoading(null);
    }
  }

  return (
    <main style={s.page}>
      {/* Hero */}
      <div style={s.hero}>
        <h1 style={s.h1}>
          Media <span style={s.accent}>Grabber</span>
        </h1>
        <p style={s.sub}>Download videos, images &amp; audio from social media — watermark‑free, MP3 export.</p>
      </div>

      {/* Platform chips */}
      <div style={s.platforms}>
        {PLATFORMS.map((p) => (
          <span key={p} style={s.chip}>{p}</span>
        ))}
      </div>

      {/* Input card */}
      <div style={s.card}>
        <div style={s.row}>
          <input
            style={s.input}
            type="url"
            placeholder="Paste a social media link…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && url && fetchInfo()}
          />
          <button style={s.btn(loading || !url)} disabled={loading || !url} onClick={fetchInfo}>
            {loading ? "…" : "Fetch"}
          </button>
        </div>

        {/* Options */}
        <div style={s.opts}>
          <label style={s.label}>
            <input
              type="checkbox"
              checked={audioOnly}
              onChange={(e) => setAudioOnly(e.target.checked)}
            />
            Audio only (MP3)
          </label>
          <label style={s.label}>
            <input
              type="checkbox"
              checked={removeWatermark}
              onChange={(e) => setRemoveWatermark(e.target.checked)}
            />
            Remove watermark
          </label>
        </div>

        {/* Error */}
        {error && <div style={s.error}>⚠ {error}</div>}

        {/* Results */}
        {info && (
          <div style={s.section}>
            {/* Thumbnail */}
            {info.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={info.thumbnail} alt={info.title} style={s.thumb} />
            )}

            {/* Metadata */}
            <div style={s.meta}>
              <span style={s.muted}>Platform</span>
              <span style={s.metaVal}>{info.platform}</span>

              <span style={s.muted}>Title</span>
              <span style={s.metaVal}>{info.title}</span>

              {info.author && (
                <>
                  <span style={s.muted}>Author</span>
                  <span style={s.metaVal}>{info.author}</span>
                </>
              )}
              {info.duration != null && (
                <>
                  <span style={s.muted}>Duration</span>
                  <span style={s.metaVal}>{formatDuration(info.duration)}</span>
                </>
              )}
              <span style={s.muted}>Watermark‑free</span>
              <span style={s.metaVal}>{info.supportsWatermarkFree ? "✅ Supported" : "❌ Not supported"}</span>
            </div>

            {/* Renditions */}
            <div style={s.section}>
              <div style={s.sectionTitle}>Available renditions ({info.renditions.length})</div>
              <div style={s.renditionList}>
                {info.renditions.map((r, i) => (
                  <div key={i} style={s.rendition}>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <code style={{ fontSize: "0.82rem" }}>{r.format}</code>
                      <span>{r.quality}</span>
                      <span style={s.badge(r.hasWatermark)}>
                        {r.hasWatermark ? "watermark" : "clean"}
                      </span>
                    </div>
                    <button
                      style={s.dlBtn}
                      disabled={dlLoading === r.quality}
                      onClick={() => download(r.quality, r.format)}
                    >
                      {dlLoading === r.quality ? "…" : "↓ Download"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <p style={{ marginTop: "2rem", color: "var(--muted)", fontSize: "0.78rem" }}>
        Stateless API · Runs on Vercel Serverless · No data stored
      </p>
    </main>
  );
}
