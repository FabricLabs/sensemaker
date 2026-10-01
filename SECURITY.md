# Security (Sensemaker)
AI-assisted intelligence gathering service with Fabric network integration.

## Adversarial environment
Fabric networks are intended for deployment where **peers, relays, hubs, and operators may be hostile**. Design and review against:

- Untrusted TCP / WebSocket / WebRTC neighbors (forgery, replay, amplification, pin hijack)
- Phishing of identity flows (`fabric://login`, device-link) toward attacker-controlled hubs
- Public observability of unsigned or plaintext application traffic unless an explicit seal is used
- No reliance on an “honest majority” of random internet peers for key custody

Sensemaker additionally faces **prompt-injection / untrusted corpus** risk: treat crawled and user-supplied text as hostile input to LLM and tool pipelines. Admin capabilities must remain fail-closed without a verified node-signed session (`sessionTrust === 'node-signed'`). Spoofed roles / `X-Forwarded-For` do not grant admin (`tests/adversarialEnvironment.basics.test.js`).

**Basics coverage:** [`tests/adversarialEnvironment.basics.test.js`](tests/adversarialEnvironment.basics.test.js). Related: [`tests/sensemaker.security.js`](tests/sensemaker.security.js). Outstanding queue: [`docs/OUTSTANDING.md`](docs/OUTSTANDING.md).

## Pins (local `file:` siblings)
Refreshed 2026-08-14 via `npm run report:install`: `@fabric/core` `9f2eb9453`, `@fabric/http` `cbdfa858`, `@fabric/hub` `dcf8fb46`, `@fabric/discord` `eac4633`.

## Process
1. `npm test` before merging auth, admin, or Fabric bridge changes.
2. Never commit `FABRIC_MNEMONIC`, DB passwords, or API keys; prefer environment variables.
3. Rate-limit and validate inputs to LLM endpoints; do not grant admin from cookie presence alone.

## Disclosure
Report issues via the repository issue tracker / maintainer contact in README.
