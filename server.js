import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lookup } from 'node:dns/promises';
import net from 'node:net';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const platforms = [
  { id: 'douyin', name: '抖音', hosts: ['douyin.com', 'iesdouyin.com'], shortHosts: ['v.douyin.com'], mode: '官方授权接口或用户授权内容', status: '链接识别可用；媒体能力待授权' },
  { id: 'bilibili', name: '哔哩哔哩', hosts: ['bilibili.com'], shortHosts: ['b23.tv'], mode: '官方 API 或用户导出', status: '链接识别可用；媒体能力待接入' },
  { id: 'youtube', name: 'YouTube', hosts: ['youtube.com', 'youtu.be'], shortHosts: ['youtu.be'], mode: 'YouTube Data API / OAuth', status: '链接识别可用；媒体能力待授权' },
  { id: 'kuaishou', name: '快手', hosts: ['kuaishou.com'], shortHosts: [], mode: '官方开放平台（如获准）', status: '链接识别可用；媒体能力待授权' },
  { id: 'xiaohongshu', name: '小红书', hosts: ['xiaohongshu.com'], shortHosts: ['xhslink.com'], mode: '创作者导出或授权来源', status: '链接识别可用；媒体能力待接入' },
  { id: 'instagram', name: 'Instagram', hosts: ['instagram.com'], shortHosts: [], mode: 'Instagram Graph API / OAuth', status: '链接识别可用；媒体能力待授权' },
  { id: 'facebook', name: 'Facebook', hosts: ['facebook.com', 'fb.watch'], shortHosts: [], mode: 'Meta Graph API / OAuth', status: '链接识别可用；媒体能力待授权' },
  { id: 'tiktok', name: 'TikTok', hosts: ['tiktok.com'], shortHosts: [], mode: '官方授权接口', status: '链接识别可用；媒体能力待授权' },
  { id: 'x', name: 'X', hosts: ['x.com', 'twitter.com', 't.co'], shortHosts: ['t.co'], mode: '官方 API 或用户导出', status: '链接识别可用；媒体能力待授权' },
  { id: 'telegram', name: 'Telegram', hosts: ['t.me', 'telegram.me'], shortHosts: [], mode: 'Bot API 授权访问', status: '链接识别可用；媒体能力待接入' }
];
const shortHosts = new Set(platforms.flatMap(p => p.shortHosts));
const allHosts = platforms.flatMap(p => p.hosts);

function extractUrls(text) {
  const matches = String(text || '').match(/https?:\/\/[^\s<>"'“”]+/gi) || [];
  return matches.map(s => s.replace(/[)\]，。！？；：,!?;]+$/g, '')).filter(Boolean);
}
function normalizeHttpUrl(input) {
  try {
    const u = new URL(input);
    if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) return null;
    if (u.port && !['80', '443'].includes(u.port)) return null;
    return u;
  } catch { return null; }
}
function platformFor(hostname) {
  const host = hostname.toLowerCase();
  return platforms.find(p => [...p.hosts, ...p.shortHosts].some(h => host === h || host.endsWith(`.${h}`))) ||
    { id: 'other', name: '其他网页', mode: '仅处理用户提供且有权使用的文件', status: '未配置平台适配器' };
}
function isPublicIp(ip) {
  if (net.isIPv4(ip)) {
    const [a,b] = ip.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127));
  }
  if (net.isIPv6(ip)) {
    const x = ip.toLowerCase();
    return !(x === '::' || x === '::1' || x.startsWith('fc') || x.startsWith('fd') || x.startsWith('fe8') || x.startsWith('fe9') || x.startsWith('fea') || x.startsWith('feb') || x.startsWith('::ffff:'));
  }
  return false;
}
async function assertPublicHost(hostname) {
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || net.isIP(hostname)) {
    if (!net.isIP(hostname) || !isPublicIp(hostname)) throw new Error('目标地址不是允许访问的公网地址');
    return;
  }
  const records = await lookup(hostname, { all: true, verbatim: true });
  if (!records.length || records.some(r => !isPublicIp(r.address))) throw new Error('目标域名解析到非公网地址，已阻止访问');
}
async function resolveShortLink(startUrl) {
  let current = startUrl;
  for (let i = 0; i < 5; i++) {
    if (!shortHosts.has(current.hostname.toLowerCase())) return { url: current.toString(), resolved: i > 0, hops: i };
    await assertPublicHost(current.hostname);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    let response;
    try {
      response = await fetch(current, { method: 'GET', redirect: 'manual', signal: controller.signal, headers: { 'user-agent': 'VideoSave-LinkInspector/0.9', 'range': 'bytes=0-0' } });
    } finally { clearTimeout(timer); }
    if ([301,302,303,307,308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) break;
      const next = normalizeHttpUrl(new URL(location, current).toString());
      if (!next) throw new Error('短链接跳转目标无效');
      current = next;
      continue;
    }
    return { url: current.toString(), resolved: i > 0, hops: i, note: '目标未返回可识别的跳转响应' };
  }
  return { url: current.toString(), resolved: current.toString() !== startUrl.toString(), hops: 5, note: '已达到最大跳转次数，停止继续解析' };
}


function decodeHtml(value) {
  return String(value || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/gi, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}
function getMeta(html, keys) {
  // HTML attribute order is not fixed; parse each meta tag independently.
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const key of keys) {
    for (const tag of tags) {
      const attrs = {};
      for (const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
        attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
      }
      if ((attrs.property || '').toLowerCase() === key.toLowerCase() || (attrs.name || '').toLowerCase() === key.toLowerCase()) {
        return decodeHtml(attrs.content || '').trim();
      }
    }
  }
  return '';
}
function readJsonLd(html) {
  const scripts = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  for (const script of scripts) {
    const raw = script.replace(/^<script\b[^>]*>/i, '').replace(/<\/script>$/i, '').trim();
    try {
      const parsed = JSON.parse(raw);
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        const item = node?.['@graph'] ? [...(Array.isArray(node['@graph']) ? node['@graph'] : [node['@graph']])] : [node];
        for (const entry of item) {
          if (!entry || typeof entry !== 'object') continue;
          const author = typeof entry.author === 'string' ? entry.author : entry.author?.name;
          const image = typeof entry.image === 'string' ? entry.image : Array.isArray(entry.image) ? (typeof entry.image[0] === 'string' ? entry.image[0] : entry.image[0]?.url) : entry.image?.url;
          if (entry.name || entry.headline || author || image) return { title: entry.name || entry.headline || '', author: author || '', image: image || '' };
        }
      }
    } catch { /* malformed or non-JSON public structured data is ignored */ }
  }
  return {};
}
function allowedPlatformHost(hostname) {
  return allHosts.some(h => hostname === h || hostname.endsWith(`.${h}`));
}

async function fetchPublicMetadata(pageUrl) {
  const allowed = allowedPlatformHost(pageUrl.hostname);
  if (!allowed) return { available: false, reason: '最终页面域名不在已配置的平台范围内，暂不请求页面信息。' };
  let current = pageUrl;
  for (let hop = 0; hop <= 3; hop++) {
    await assertPublicHost(current.hostname);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    let response;
    try {
      response = await fetch(current, { redirect: 'manual', signal: controller.signal, headers: { 'user-agent': 'VideoSave-MetadataPreview/0.9', accept: 'text/html,application/xhtml+xml' } });
    } catch (e) {
      return { available: false, reason: e.name === 'AbortError' ? '页面信息请求超时。' : '暂时无法访问公开页面。' };
    } finally { clearTimeout(timer); }
    if ([301,302,303,307,308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location || hop === 3) return { available: false, reason: '页面继续跳转或跳转次数过多，已停止获取信息。' };
      const next = normalizeHttpUrl(new URL(location, current).toString());
      if (!next) return { available: false, reason: '页面跳转地址无效。' };
      if (!allowedPlatformHost(next.hostname)) return { available: false, reason: '页面跳转到了未配置的平台域名，已停止读取。', status: 'blocked_redirect' };
      current = next; continue;
    }
    const type = response.headers.get('content-type') || '';
    if (!response.ok || !/text\/html|application\/xhtml\+xml/i.test(type)) return { available: false, reason: '平台未提供可读取的公开网页信息。' };
    const reader = response.body?.getReader();
    if (!reader) return { available: false, reason: '无法读取页面内容。' };
    const chunks = []; let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        total += value.length; if (total > 1024 * 1024) { await reader.cancel(); return { available: false, reason: '页面内容超过安全读取上限。' }; }
        chunks.push(value);
      }
    } catch { return { available: false, reason: '读取页面信息时连接中断。' }; }
    const html = new TextDecoder('utf-8').decode(Buffer.concat(chunks));
    const structured = readJsonLd(html);
    const title = getMeta(html, ['og:title', 'twitter:title']) || structured.title || decodeHtml((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [,''])[1].replace(/<[^>]+>/g, '').trim());
    const image = getMeta(html, ['og:image', 'og:image:url', 'twitter:image']) || structured.image || '';
    const author = getMeta(html, ['author', 'article:author', 'og:article:author']) || structured.author || '';
    let cover = '';
    if (image) { try { const u = new URL(image, current); if (['http:', 'https:'].includes(u.protocol) && allowedPlatformHost(u.hostname)) cover = u.toString(); } catch {} }
    const found = Boolean(title || cover || author);
    return { available: found, status: found ? 'partial' : 'not_found', title: title.slice(0, 300), cover, author: author.slice(0, 120), sourceUrl: current.toString(), reason: found ? '已读取页面提供的部分公开信息。' : '页面没有提供可读取的公开标题、封面或作者信息；平台可能要求登录或使用动态加载。' };
  }
  return { available: false, reason: '无法获取公开页面信息。' };
}

app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'VideoSave', version: '0.9.0', timestamp: new Date().toISOString() }));
app.get('/api/platforms', (_req, res) => res.json({ platforms: platforms.map(({ id, name, mode, status }) => ({ id, name, mode, status })) }));
app.get('/api/benefits', (_req, res) => res.json({ version: '0.9.0', free: { enabled: true }, rewardedAd: { enabled: false, reason: '广告 SDK 与平台审核尚未完成' }, vip: { enabled: false, reason: '支付、订单和用户系统尚未接入' } }));
app.post('/api/inspect', async (req, res) => {
  const input = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
  if (!input || input.length > 8000) return res.status(400).json({ error: '请粘贴有效的分享文案或链接（最多 8000 个字符）。' });
  const candidates = extractUrls(input);
  if (!candidates.length) return res.status(400).json({ error: '没有找到 http/https 链接，请检查分享文案。' });
  const original = normalizeHttpUrl(candidates[0]);
  if (!original) return res.status(400).json({ error: '链接格式无效或不受支持。' });
  const originalPlatform = platformFor(original.hostname);
  let resolution = { url: original.toString(), resolved: false, hops: 0, note: '该域名不是当前支持自动解析的短链接域名' };
  let resolutionError = null;
  if (shortHosts.has(original.hostname.toLowerCase())) {
    try { resolution = await resolveShortLink(original); }
    catch (e) { resolutionError = e.name === 'AbortError' ? '短链接解析超时，请直接打开原始链接。' : `短链接解析暂不可用：${e.message}`; }
  }
  const finalUrl = normalizeHttpUrl(resolution.url) || original;
  const finalPlatform = platformFor(finalUrl.hostname);
  const metadata = await fetchPublicMetadata(finalUrl);
  res.json({
    ok: true,
    version: '0.9.0',
    extractedUrl: original.toString(),
    hostname: original.hostname,
    platform: originalPlatform.name,
    platformId: originalPlatform.id,
    status: originalPlatform.status,
    supportedPath: originalPlatform.mode,
    metadata,
    resolution: { attempted: shortHosts.has(original.hostname.toLowerCase()), resolved: resolution.resolved, hops: resolution.hops, finalUrl: finalUrl.toString(), finalHostname: finalUrl.hostname, finalPlatform: finalPlatform.name, note: resolutionError || resolution.note || null },
    message: '链接识别完成。短链接解析仅用于定位公开内容地址，不代表已获得视频下载权限。',
    policy: '仅处理你拥有或获准使用的内容；不会绕过私密权限、DRM、付费墙或作者关闭的下载设置。'
  });
});
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`VideoSave 0.8.0 listening on ${PORT}`));
