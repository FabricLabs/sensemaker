# Outstanding (security-first)
Living queue for this repo. Detail: [SECURITY.md](../SECURITY.md). Suite march: [@fabric/core `docs/PRODUCTION_MARCH.md`](https://github.com/FabricLabs/fabric/blob/feature/rsi/docs/PRODUCTION_MARCH.md).

**Last reviewed:** 2026-08-14 (`feature/benchmark`; local `file:` siblings — core `9f2eb9453`, http `cbdfa858`, hub `dcf8fb46` / [#16](https://github.com/FabricLabs/hub.fabric.pub/pull/16), discord `eac4633`).

## Blockers before shared-host claims
1. **Inherited login/link redeem** — QR `sessionId` + forgeable Origin is still the capability ([`@fabric/http` OUTSTANDING](https://github.com/FabricLabs/fabric-http/blob/feature/rsi/docs/OUTSTANDING.md)).
2. **Prompt injection** — crawled and user-supplied text is hostile input to LLM / tool pipelines. Admin stays fail-closed without a verified node-signed session (`sessionTrust === 'node-signed'`). Spoofed roles / `X-Forwarded-For` do not grant admin (`tests/adversarialEnvironment.basics.test.js`).
3. **Never commit** `FABRIC_MNEMONIC`, DB passwords, or API keys.

## Next slices
- [ ] Keep `file:` sibling pins for local RSI work; switch to GitHub `#feature/rsi` only when cutting a published Sensemaker pin.
- [x] `npm run report:install` needs `allowScripts` for `bcrypt` / `classic-level` (npm 12+ blocks native builds otherwise). Also `electron@36.3.2` so `npm run desktop` can download the Electron binary.
- [ ] Optional: consume `@fabric/hub/functions/bulkSecurityAdvisory` on document ingest (Hub already drops GHSA dumps).

## Closed this pass (do not re-open)
- Lockfile refreshed via `npm run report:install` against sibling Fabric trees (Hub `dcf8fb46`).
- Hub identity / delegation / allowlist / email / fabric service imports use package exports (`tests/liftedApis.unit.js`).
- Hub bulk GHSA helper is reachable as `@fabric/hub/functions/bulkSecurityAdvisory` once Hub [#16](https://github.com/FabricLabs/hub.fabric.pub/pull/16) lands that export.

## PRs
No FabricLabs RSI PR for this tree (`feature/benchmark`). Do not merge to `main`. Do not retarget Passport [#3](https://github.com/FabricLabs/fabric-browser-extension/pull/3) (`eric/develop`).
