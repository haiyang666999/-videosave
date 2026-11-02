# VideoSave 0.9.0

Node.js 18+ / Express. This version improves public metadata preview while retaining the 0.8.0 link inspection flow.

## Run

```bash
npm install
npm start
```

## API

- `GET /api/health` — service version/status
- `GET /api/platforms` — supported platform recognition list
- `GET /api/benefits` — entitlement integration status (ads/VIP remain disabled)
- `POST /api/inspect` with `{ "url": "share text or URL" }` — extract URL, identify platform, resolve configured public short links, and attempt to read public HTML metadata.

## 0.9.0 metadata improvements

- Reads common Open Graph and Twitter meta tags regardless of attribute order.
- Also checks the page title and public JSON-LD structured data for title, image, and author.
- Returns an explicit metadata status and a clearer reason when public information is unavailable.
- Metadata redirect targets must remain within configured platform hosts.

## Limits and safety

This is still link inspection and public-page metadata preview, not a media downloader. Anonymous access may be blocked, pages may load data dynamically, and metadata may be absent. No bypass of login restrictions, DRM, paywalls, private content, or creator download settings. Ad SDK, payments, account identity, and VIP entitlements are not implemented. Only use official APIs, creator exports, user-authorized content, or other permitted sources.
