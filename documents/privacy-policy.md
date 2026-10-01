# Privacy Policy

Sensemaker is a **hosted node**: the operator of this instance can read chats, documents, emails, and Discord tokens stored here, and can impersonate users who hold a valid session on this node.

This is not an anonymity network. Connecting to this origin reveals your IP address to the operator and to any reverse proxy in front of it. If this node also runs a Fabric Peer, connecting to public hubs (`hub.fabric.pub`, `relay.goon.vc`) reveals your IP, Fabric identity, and any **unsealed** mesh bodies (chat, documents, missions) to those hops.

**Who sees what**

- **You** — your account, conversations, and files you create, subject to this node's retention.
- **This node's operator** — the same data, plus server logs and any backups they keep. Treat the operator as a conventional SaaS IdP.
- **LLM vendors** (Ollama locally, or OpenAI / OpenRouter if configured) — prompts and retrieved document snippets sent to those APIs.
- **Discord / email processors** — content that leaves this node through those integrations.
- **Public Fabric hubs** — IP, Fabric id, and unsealed gossip if this process peers.

Keep seeds in Fabric Passport or a desktop identity store. This application uses **one server seed** for the node, not per-user Fabric custody.

Session cookies are HttpOnly. Do not paste admin or hub tokens into a multi-user visitor app.

Contact the operator of this instance for deletion or export. Fabric protocol questions: `security@fabric.pub`.
