import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const root = path.dirname(fileURLToPath(import.meta.url));
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(root, 'public')));

const platforms = [
  { id:'douyin', name:'抖音', hosts:['douyin.com','iesdouyin.com','v.douyin.com'], route:'官方授权接口/用户授权内容', status:'识别可用，媒体能力待授权' },
  { id:'bilibili', name:'哔哩哔哩', hosts:['bilibili.com','b23.tv'], route:'官方 API/用户授权内容', status:'识别可用，媒体能力待接入' },
  { id:'youtube', name:'YouTube', hosts:['youtube.com','youtu.be'], route:'YouTube 官方 API/OAuth', status:'识别可用，媒体能力待授权' },
  { id:'kuaishou', name:'快手', hosts:['kuaishou.com'], route:'官方开放平台/授权内容', status:'识别可用，媒体能力待授权' },
  { id:'xiaohongshu', name:'小红书', hosts:['xiaohongshu.com','xhslink.com'], route:'创作者导出/授权来源', status:'识别可用，媒体能力待接入' },
  { id:'instagram', name:'Instagram', hosts:['instagram.com'], route:'Instagram Graph API/OAuth', status:'识别可用，媒体能力待授权' },
  { id:'facebook', name:'Facebook', hosts:['facebook.com','fb.watch'], route:'Meta Graph API/OAuth', status:'识别可用，媒体能力待授权' },
  { id:'tiktok', name:'TikTok', hosts:['tiktok.com'], route:'官方 API/授权内容', status:'识别可用，媒体能力待授权' },
  { id:'x', name:'X', hosts:['x.com','twitter.com','t.co'], route:'官方 API/用户导出', status:'识别可用，媒体能力待授权' },
  { id:'telegram', name:'Telegram', hosts:['t.me','telegram.me'], route:'Bot API/授权访问', status:'识别可用，媒体能力待授权' }
];
function extractUrl(value) {
  const text = String(value || '').trim();
  const match = text.match(/https?:\/\/[^\s<>"“”‘’]+/i) || text.match(/(?:^|\s)((?:www\.)?[a-z0-9.-]+\.[a-z]{2,}\/[^\s<>"“”‘’]*)/i);
  if (!match) return null;
  let candidate = (match[1] || match[0]).replace(/[，。！？、；;,.!?)）〗》]+$/u, '');
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
  try { const u = new URL(candidate); if (!['http:','https:'].includes(u.protocol) || u.username || u.password) return null; return u; } catch { return null; }
}
function findPlatform(host) {
  const h = host.toLowerCase();
  return platforms.find(p => p.hosts.some(x => h === x || h.endsWith(`.${x}`))) || { id:'other', name:'其他网页', route:'仅支持权利人提供或明确授权的媒体文件', status:'未配置平台适配' };
}
app.get('/api/health', (_req,res) => res.json({ ok:true, name:'VideoSave', version:'0.6.0', timestamp:new Date().toISOString() }));
app.get('/api/platforms', (_req,res) => res.json({ platforms }));
app.post('/api/inspect', (req,res) => {
  const u = extractUrl(req.body?.url);
  if (!u) return res.status(400).json({ error:'没有识别到有效的 http/https 链接，请检查分享文案。' });
  const p = findPlatform(u.hostname);
  res.json({ inputUrl:u.toString(), hostname:u.hostname, platform:p.name, platformId:p.id, status:p.status, supportedPath:p.route,
    message:'链接识别成功。当前版本提供链接识别，不代表已获得该平台的视频下载权限。',
    policy:'仅处理你拥有或获准使用的内容；不会绕过私密权限、DRM、付费墙或作者关闭的下载设置。' });
});
// Entitlement endpoints are deliberately informational until an approved ad SDK/payment provider is configured.
app.get('/api/benefits', (_req,res) => res.json({ guest:{ dailyFreeInspections:20 }, reward:{ enabled:false, durationMinutes:120, reason:'激励广告尚未接入并通过平台审核' }, vip:{ enabled:false, reason:'会员支付与订单系统尚未接入' } }));
app.get('*', (_req,res) => res.sendFile(path.join(root,'public','index.html')));
app.listen(PORT, () => console.log(`VideoSave 0.6.0 listening on ${PORT}`));
