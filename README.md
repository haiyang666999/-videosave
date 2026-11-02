# VideoSave 0.6.0

Responsive web test version based on the public 0.5.2 project.

## Run
- Node.js 18+
- `npm install`
- `npm start`

## Endpoints
- `GET /api/health`
- `GET /api/platforms`
- `POST /api/inspect` with `{ "url": "share text or URL" }`
- `GET /api/benefits` returns current entitlement integration status

## Important scope
This release performs URL extraction and platform recognition only. It does not download media. Rewarded-ad entitlement and VIP payment are explicitly shown as planned, disabled integrations until a compliant ad SDK, payment provider, callbacks, user identity, and platform approval are configured. Only connect media sources that are official, user-authorized, or otherwise permitted. Do not bypass DRM, private access, paywalls, or creator download restrictions.
