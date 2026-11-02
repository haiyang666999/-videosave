import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const PORT = Number(process.env.PORT || 3000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: "32kb" }));
app.use(express.static(path.join(__dirname, "public")));

const platforms = [
  { id: "x", name: "X", hosts: ["x.com", "twitter.com", "t.co"], mode: "official-api-or-user-export", status: "adapter-pending" },
  { id: "youtube", name: "YouTube", hosts: ["youtube.com", "youtu.be"], mode: "youtube-data-api-oauth", status: "adapter-pending" },
  { id: "tiktok", name: "TikTok", hosts: ["tiktok.com"], mode: "official-display-or-content-api", status: "adapter-pending" },
  { id: "telegram", name: "Telegram", hosts: ["t.me", "telegram.me"], mode: "bot-api-for-authorized-bot-access", status: "adapter-pending" },
  { id: "instagram", name: "Instagram", hosts: ["instagram.com"], mode: "instagram-graph-api-oauth", status: "adapter-pending" },
  { id: "facebook", name: "Facebook", hosts: ["facebook.com", "fb.watch"], mode: "meta-graph-api-oauth", status: "adapter-pending" },
  { id: "douyin", name: "抖音", hosts: ["douyin.com", "iesdouyin.com"], mode: "official-open-platform-if-eligible", status: "adapter-pending" },
  { id: "kuaishou", name: "快手", hosts: ["kuaishou.com"], mode: "official-open-platform-if-eligible", status: "adapter-pending" },
  { id: "xiaohongshu", name: "小红书", hosts: ["xiaohongshu.com", "xhslink.com"], mode: "creator-export-or-authorized-source", status: "adapter-pending" },
  { id: "bilibili", name: "哔哩哔哩", hosts: ["bilibili.com", "b23.tv"], mode: "official-api-or-user-export", status: "adapter-pending" },
  { id: "vimeo", name: "Vimeo", hosts: ["vimeo.com"], mode: "official-api-oauth", status: "adapter-pending" },
  { id: "twitch", name: "Twitch", hosts: ["twitch.tv"], mode: "official-api-oauth", status: "adapter-pending" },
  { id: "reddit", name: "Reddit", hosts: ["reddit.com", "redd.it"], mode: "official-api-oauth", status: "adapter-pending" }
];

function platformFor(hostname) {
  const host = hostname.toLowerCase();
  return platforms.find(p => p.hosts.some(h => host === h || host.endsWith(`.${h}`))) ?? {
    id: "other", name: "其他网页", hosts: [], mode: "direct-user-provided-file-only", status: "no-adapter"
  };
}

function normalizeHttpUrl(input) {
  let parsed;
  try { parsed = new URL(input); } catch { return null; }
  if (!["http:", "https:"].includes(parsed.protocol)) return null;
  if (parsed.username || parsed.password) return null;
  return parsed;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, name: "VideoSave", version: "0.5.0", timestamp: new Date().toISOString() });
});

app.get("/api/platforms", (_req, res) => {
  res.json({ platforms });
});

app.post("/api/inspect", (req, res) => {
  const input = typeof req.body?.url === "string" ? req.body.url.trim() : "";
  const url = normalizeHttpUrl(input);
  if (!url) return res.status(400).json({ error: "请提供有效的 http/https 链接。" });

  const platform = platformFor(url.hostname);
  res.json({
    inputUrl: url.toString(),
    hostname: url.hostname,
    platform: platform.name,
    platformId: platform.id,
    integrationStatus: platform.status,
    supportedPath: platform.mode,
    message: platform.status === "adapter-pending"
      ? "已识别平台；官方 API / 授权适配器尚未配置。"
      : "已识别为普通网页；请使用权利人提供的媒体文件或平台官方下载功能。",
    policy: "不会绕过私密内容权限、DRM、付费墙、作者关闭的下载权限或其他访问控制。"
  });
});

// OAuth routes are intentionally not implemented until a real developer app,
// redirect URI, scopes, privacy policy and secret storage are configured.
app.get("/api/auth/:platform/start", (req, res) => {
  const p = platforms.find(x => x.id === req.params.platform);
  if (!p) return res.status(404).json({ error: "未知平台。" });
  return res.status(501).json({
    error: "官方 OAuth 尚未配置。",
    platform: p.name,
    nextSteps: [
      "在该平台开发者后台创建应用",
      "配置准确的回调地址与最小必要权限范围",
      "在服务器环境变量中配置 client ID / secret",
      "实现 state 校验、PKCE（平台支持时）和服务端令牌存储"
    ]
  });
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => {
  console.log(`VideoSave 0.5 running at http://localhost:${PORT}`);
});
