# VideoSave 0.5.2

Node.js + Express link-recognition test version. It accepts a full URL or pasted share text containing a URL, including Douyin short links on `v.douyin.com`.

## Deploy
- Node.js 18+
- `npm install`
- `npm start`

Render uses the repository root and the `start` script.

## Test
Paste this example share text into the page:

`8.76 复制打开抖音，看看【作品】…… https://v.douyin.com/example/ :9pm`

The recognition endpoint extracts the first HTTP(S) URL and identifies `v.douyin.com` as Douyin. This is link recognition only; it does not download media or bypass platform restrictions.

## Current limitations
No real media downloader or OAuth credentials are included. Use only content you own or are authorized to access, and respect platform terms, privacy, DRM, paywalls, and creator download settings.
