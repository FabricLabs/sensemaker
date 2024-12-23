`SENSEMAKER`
============
making sense of stuff.

**`SENSEMAKER`** provides robust intelligence gathering services, accumulating and organizing information from a set of configurable data streams to automatically construct new models and foster insight into complex systems.

## Core Features
- Multi-stage LLM Pipeline
- Basic Access to the World Wide Web

## Requirements
- Node 18.19.1 (use `scripts/nvm/install.sh`)
- MySQL 8.3
- Redis Stack 7.2

## Quick Start
From the repository root:
```
npm i # install dependencies
npm start # run node
```
A basic web interface should now be provided at http://localhost:3040

**Important!**  
Your username and password will be displayed in the logs **for the first boot only**.  This is your administrative account, with full access to managing your node.

Enjoy!

## Configuring
Settings may be provided by modifying `settings/local.js` with any of the following properties:

```yaml
alias: Network alias.  Used when connecting to peers.
fabric: Fabric configuration.
seed: Seed phrase.
```

## Architecture
### Fabric
Sensemaker searches [the Fabric Network][fabric-pub] to aggregate information from a variety of sources.
### Project Structure
The repository is configured as follows:
```
.
├── API.md — auto-generated documentation
├── actions — Redux actions
├── components — React components
├── reducers — state reducers
├── scripts — useful tools & utilities
│   └── browser.js — browser script
│   └── node.js — server script
├── services — standalone services
│   └── sensemaker.js — node implementation
└── types — Core types
    └── agent.js — agent implementation
```

## Network
- `@fabric/core`
- `@fabric/http`
- `@fabric/hub`

[fabric-pub]: https://fabric.pub
[fabric-hub]: https://hub.fabric.pub
