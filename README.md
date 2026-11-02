# VideoSave 0.5 Starter

这是 VideoSave 的前后端分离开发起点。当前实现：
- Node.js + Express 本地后端
- `/api/health` 健康检查
- `/api/platforms` 平台清单
- `/api/inspect` 分享链接平台识别
- `/api/auth/:platform/start` 官方 OAuth 配置占位（返回 501，不收集密码）
- 简单网页前端

## 启动方式

需要 Node.js 18 或更高版本。

```bash
npm install
npm start
```

浏览器打开 `http://localhost:3000`。

## 当前未实现

此版本**没有真实的视频下载器，也没有任何平台 OAuth 凭据**。X、YouTube、TikTok、Telegram、Instagram、Facebook、抖音、快手、小红书、B站等只完成平台识别与集成点登记。

## 下一步接入顺序建议

1. 先选一个平台并确认开发者账号、API 产品资格、允许的用途与内容权限。
2. 建立该平台专用 adapter，不做通用任意 URL 抓取。
3. OAuth 使用官方授权页；校验 `state`，平台支持时使用 PKCE；令牌只保存在服务端，不发给浏览器。
4. 只提供 API 明确允许的媒体访问、用户自己的内容导出，或权利人授权的文件下载。
5. 对下载文件做大小限制、类型校验、速率限制、审计日志与过期清理。

## 安全说明

- 不要把 client secret、bot token 或 OAuth refresh token 写进前端代码或提交到 Git。
- 不要在公开服务器上开放任意 URL 代理/抓取接口，以免 SSRF、内网探测和滥用。
- 不绕过 DRM、付费墙、私密频道/群组权限、作者关闭的下载权限或其他访问控制。
- 仅处理你拥有或已获授权且平台规则允许处理的内容。
