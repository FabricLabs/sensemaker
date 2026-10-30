# Sensemaker ↔ Fabric application namespaces

Sensemaker converges on the same Fabric Core message set as Hub and other
light peers. Canonical spec:

- `@fabric/core` [docs/APPLICATION_NAMESPACES.md](https://github.com/FabricLabs/fabric/blob/master/docs/APPLICATION_NAMESPACES.md)
- `@fabric/core` `functions/applicationNamespaces.js`
- Sensemaker merge: [`contracts/applicationMessageTypes.js`](../contracts/applicationMessageTypes.js)
- Hub `MESSAGE_TRANSPORT.md` (Application namespaces section)
- Hub [DESKTOP.md](../../hub.fabric.pub/docs/DESKTOP.md) — `fabric://login` / `fabric://link`

Product-specific body types (missions, gameplay batches, share envelopes) stay
in **those apps’** catalogs — not in Sensemaker’s merge. `DocumentList` is a
core catalog type, so Sensemaker does not add it to `APP_CONTRACT_BODY_TYPES`.

## Target model

| Layer | Outer type | Sensemaker target |
|-------|------------|-------------------|
| Global shoutbox | `P2P_CHAT_MESSAGE` | Raw UTF-8 body + Peer `chat`; nicknames on `P2P_PEER_ALIAS`. Not a JSON envelope. |
| Namespace declare | `CONTRACT_PUBLISH` | Tracked pending queue (Hub ADR-001); optional Federation genesis |
| Namespace events | `CONTRACT_MESSAGE` | Count per namespace; `knownBodyType` via local catalog |
| Multi-origin ARC tip | `contractMessageAccumulate` | Same core helper as other peers (tests cover mesh ≡ paste) |
| Delivery 2PC | `MessageReceived` / `MessageReceipt` | Core catalog + `contractMessageCommit` |
| AI product chat | HTTP + `JSONPatch` / stream fragments | **Stays local** — do not overload mesh shoutbox |
| Site login (D-011) | REST `/sessions` | Dual-mode: password **or** Hub client-signed `{ origin }` |
| Device link (D-013) | REST `/device-links` | Hub-compatible mutual Schnorr |

## Status (2026-08-11)

| Item | State |
|------|--------|
| Document gap + Core catalog pointers | Done |
| Local catalog merge (`contracts/applicationMessageTypes.js`) | Done |
| Peer `chat` / `contract:publish` / `contract:message` → `fabric:*` events | Done (`_attachFabricApplicationNamespaceHandlers`) |
| Global shoutbox `P2P_CHAT_MESSAGE` | Done — raw UTF-8 via `publishShoutbox` → Peer `relayFrom` (`functions/shoutbox.js`). A Bridge JSON envelope (`{ actor, object.content }`) is not the mesh body. Inbound Peer `{ text }` is shown the same way as Hub `object.content`. Nickname uses `P2P_PEER_ALIAS` when `settings.alias` (or moniker) is set. |
| `CONTRACT_PUBLISH` → Hub tracked-application-contracts pending | Done (via Hub `_recordTrackedContractPublish`) |
| `CONTRACT_MESSAGE` per-namespace counts + known body flag | Done |
| D-011 client-signed login (`POST /sessions` + `…/signatures`) | Done (`functions/fabricProtocolMount.js`; password login preserved) |
| D-013 `/device-links` | Done (Hub `mountFabricDeviceLinkHttp`) |
| Optional Federation `CONTRACT_PUBLISH` genesis for multi-node policy | Open |
| Electron `fabric:` protocol handler | Open (HTTP surfaces ready for Passport / desktop clients) |
| Keep AI `Conversation` / stream fragments off the mesh shoutbox | Policy — do not regress |
| `DocumentList` data libraries | Core body type. A folder is shared as a compact catalog (`functions/dataLibrary.js`); file bytes stay local until that peer's document request is approved. `APP_CONTRACT_BODY_TYPES` stays empty |

## Dual-mode `POST /sessions`

| Body | Behavior |
|------|----------|
| `{ username, password }` or `{ token }` | Existing Sensemaker password / credential login → node-signed Bearer |
| `{ origin }` (no username/password/token) | Hub desktop/player challenge → `fabric://login?sessionId&hub=` |

Poll `GET /sessions/:sessionId`; complete with `POST /sessions/:sessionId/signatures` (client-signed or loopback hub self-sign).

## Do not regress

AI streaming (`MessageStart` / `MessageChunk` / `MessageEnd` / `JSONPatch` on
`/messages/:id`) is a **product** path. It must remain distinct from the Fabric
**network shoutbox** (`P2P_CHAT_MESSAGE`) and must not appear in
`APP_CONTRACT_BODY_TYPES`.
