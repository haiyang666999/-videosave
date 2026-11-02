# VideoSave 0.7.0

Node.js 18+ / Express. This release improves share-text URL extraction and attempts limited redirects for an explicit allowlist of public short-link hosts.

## Run

```bash
npm install
npm start
```

## API
- `GET /api/health` — service version/status
- `GET /api/platforms` — supported platform recognition list
- `GET /api/benefits` — current entitlement integration status (ads/VIP remain disabled)
- `POST /api/inspect` with `{ "url": "share text or URL" }` — extract first HTTP(S) URL, identify platform, and attempt short-link resolution for configured short hosts

## Security and scope

- Redirect resolution is limited to an explicit short-host allowlist, five hops, a timeout, and public-IP checks to reduce SSRF risk.
- This is link inspection only. It does not fetch video media, bypass platform restrictions, or guarantee metadata availability.
- Ad SDK, payments, account identity, and VIP entitlements are not implemented.
- Only use official APIs, creator exports, user-authorized content, or other permitted sources. Never bypass DRM, private content, paywalls, or creator download settings.
