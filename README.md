# VideoSave 0.8.0

Node.js 18+ / Express. This version adds a cautious public-page metadata preview to the 0.7.0 link inspection flow.

## Run

```bash
npm install
npm start
```

## API

- `GET /api/health` — service version/status
- `GET /api/platforms` — supported platform recognition list
- `GET /api/benefits` — current entitlement integration status (ads/VIP remain disabled)
- `POST /api/inspect` with `{ "url": "share text or URL" }` — extract URL, identify platform, attempt configured short-link resolution, then attempt to read public HTML metadata (title, image, author) for configured platform hosts.

## Metadata limits

Only HTML page metadata is inspected. The request is limited to configured platform hosts, public-IP checks, a small redirect limit, a timeout, and a 1 MiB response cap. Platforms may block anonymous access or omit metadata; an unavailable result is normal. This is not a media downloader and does not retrieve video files.

Ad SDK, payments, account identity, and VIP entitlements are not implemented. Only use official APIs, creator exports, user-authorized content, or other permitted sources. Never bypass DRM, private content, paywalls, or creator download settings.
