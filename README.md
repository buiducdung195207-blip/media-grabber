# Media Grabber

> Trình tải đa phương tiện từ mạng xã hội — Stateless API trên Vercel Serverless

[![CI/CD](https://github.com/YOUR_USERNAME/media-grabber/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/YOUR_USERNAME/media-grabber/actions)

---

## Tính năng

| Tính năng | Chi tiết |
|---|---|
| 🎬 Tải video | YouTube, TikTok, Instagram Reels, X/Twitter, Facebook, Reddit |
| 🖼️ Tải ảnh | Instagram carousel, Pinterest, Reddit, X/Twitter |
| 🎵 Xuất MP3 | Bất kỳ nền tảng nào hỗ trợ audio |
| 🚫 Xoá watermark | TikTok (native), Instagram (native) |
| ⚡ Stateless | Không cơ sở dữ liệu, xử lý hoàn toàn qua API |
| 🌐 Vercel Serverless | Mỗi route là một serverless function độc lập |

---

## Kiến trúc

```
src/
├── app/
│   ├── page.tsx                    # UI chính (Client Component)
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── health/route.ts         # GET  /api/health
│       ├── platforms/route.ts      # GET  /api/platforms
│       ├── info/route.ts           # GET  /api/info?url=...
│       └── download/route.ts       # POST /api/download
├── lib/
│   ├── utils.ts                    # Helpers dùng chung
│   ├── validation.ts               # Zod schemas
│   └── extractors/
│       ├── index.ts                # Router điều phối
│       ├── cobalt.ts               # Backend chính (Cobalt API)
│       ├── youtube.ts              # YouTube (@distube/ytdl-core)
│       ├── tiktok.ts               # TikTok + watermark removal
│       ├── instagram.ts            # Instagram
│       └── generic.ts              # Twitter, Facebook, Reddit, Pinterest
└── types/
    └── media.ts                    # Shared TypeScript types
```

---

## API Endpoints

### `GET /api/health`
Liveness probe.
```json
{ "success": true, "data": { "status": "ok", "timestamp": "...", "version": "1.0.0" } }
```

---

### `GET /api/platforms`
Danh sách nền tảng hỗ trợ và feature matrix.

```bash
curl https://your-app.vercel.app/api/platforms
```

---

### `GET /api/info?url=<encoded-url>`
Trả về metadata và danh sách renditions.

```bash
curl "https://your-app.vercel.app/api/info?url=https%3A%2F%2Fyoutu.be%2FdQw4w9WgXcQ"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "platform": "youtube",
    "type": "video",
    "title": "Rick Astley - Never Gonna Give You Up",
    "thumbnail": "https://...",
    "duration": 213,
    "author": "Rick Astley",
    "supportsWatermarkFree": true,
    "renditions": [
      { "url": "...", "quality": "1080p", "format": "mp4", "hasWatermark": false },
      { "url": "...", "quality": "720p",  "format": "mp4", "hasWatermark": false },
      { "url": "...", "quality": "audio-320kbps", "format": "webm", "hasWatermark": false }
    ]
  }
}
```

---

### `POST /api/download`
Khởi tạo tải xuống.

```bash
curl -X POST https://your-app.vercel.app/api/download \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.tiktok.com/@user/video/123",
    "audioOnly": false,
    "removeWatermark": true
  }'
```

**Body schema:**
```ts
{
  url: string            // bắt buộc
  format?: "mp4"|"mp3"|"webm"|"jpg"|"png"|"gif"
  quality?: string       // e.g. "1080p"
  removeWatermark?: boolean  // default false
  audioOnly?: boolean        // default false — xuất MP3
}
```

**Response (non-YouTube):**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://...",
    "filename": "video_title.mp4",
    "format": "mp4",
    "quality": "max",
    "hasWatermark": false,
    "platform": "tiktok"
  }
}
```

> **YouTube** trả về binary stream trực tiếp với header `Content-Disposition: attachment`.

---

## Cài đặt & Chạy Local

### Yêu cầu
- Node.js ≥ 18
- pnpm ≥ 9

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/media-grabber
cd media-grabber

# Cài đặt
pnpm install

# Tạo file môi trường
cp .env.example .env.local
# Điền COBALT_API_URL (tuỳ chọn, mặc định dùng public instance)

# Dev server
pnpm dev
# → http://localhost:3000
```

---

## Deploy lên Vercel

### 1. Tự động qua GitHub Actions (khuyên dùng)

Thêm các secrets vào GitHub repo:

| Secret | Mô tả |
|---|---|
| `VERCEL_TOKEN` | Vercel API token (Account Settings → Tokens) |
| `VERCEL_ORG_ID` | Tìm trong `.vercel/project.json` sau khi link project |
| `VERCEL_PROJECT_ID` | Tương tự trên |
| `COBALT_API_URL` | URL instance Cobalt (có thể dùng `https://api.cobalt.tools`) |

Pipeline sẽ tự động:
1. **type-check** → **lint** → **build** trên mỗi PR
2. **Deploy production** khi merge vào `main`

### 2. Thủ công

```bash
pnpm dlx vercel --prod
```

---

## CI/CD Pipeline

```
Pull Request
    │
    ▼
┌─────────────────────┐
│  quality job        │  TypeScript type-check
│  (ubuntu-latest)    │  ESLint
└──────────┬──────────┘
           │ pass
           ▼
┌─────────────────────┐
│  build job          │  next build
│  (ubuntu-latest)    │
└──────────┬──────────┘
           │ pass  (only on push to main)
           ▼
┌─────────────────────┐
│  deploy job         │  vercel deploy --prod
│  (ubuntu-latest)    │
└─────────────────────┘
```

---

## Biến môi trường

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `COBALT_API_URL` | Không | URL Cobalt API. Mặc định: `https://api.cobalt.tools` |
| `RAPIDAPI_KEY` | Không | Fallback scraping API key |
| `NEXT_PUBLIC_APP_URL` | Không | Public URL cho metadata |

---

## Lưu ý pháp lý

Tool này chỉ dùng cho mục đích giáo dục và nghiên cứu. Việc tải nội dung có bản quyền phải tuân thủ điều khoản dịch vụ của từng nền tảng và pháp luật hiện hành.
