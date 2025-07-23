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
Sensemaker runs locally, on your machine, unless configured to do otherwise.  First, clone the repository:

```
git clone git@github.com:FabricLabs/sensemaker.git
```

### Docker Setup (Recommended)
For the easiest setup with automatic database initialization:
```
chmod +x setup-first-time.sh
./setup-first-time.sh
```

This will automatically generate secure MySQL passwords, admin credentials, Fabric seed phrase, and set up all services via Docker.

### Manual Setup
From the repository root:
```
npm i # install dependencies
npm start # run node
```
A basic web interface should now be provided at http://localhost:3040

If you'd like to avoid the web components, you can use `npm run demo` to skip straight to the networking demo.

**Important!**
When using the Docker setup, your admin username and password are automatically generated and stored in the `.env` file. When using manual setup, your username and password will be displayed in the logs **for the first boot only**.  This is your administrative account, with full access to managing your node.  Secure it somewhere safely!

## Next Steps
- Ask your instance a few questions to get a feel for how it responds.

## Configuring
Settings may be provided by modifying `settings/local.js` with any of the following properties:

```yaml
alias: Network alias.  Used when connecting to peers.
fabric: Fabric configuration.
seed: Seed phrase.
```

# Fabric Protocol Overview
Fabric is a peer-to-peer network protocol built on Bitcoin's foundational principles of decentralization, cryptographic security, and consensus.  It provides a framework for building distributed applications that can operate without centralized control.

At the heart of Fabric is the concept of signed, verifiable messages.  Every piece of data transmitted through the network is wrapped in a Fabric Message that includes cryptographic signatures, timestamps, and unique identifiers. This ensures message integrity, authenticity, and non-repudiation.

Fabric introduces several key abstractions: Actors represent identities with cryptographic keys, Peers are network participants that can route messages, Services provide specialized functionality, and Hubs serve as coordination points.  The Sensemaker application extends the Hub concept to create a centralized service that manages AI agents and user interactions while still maintaining Fabric's security properties.

Messages in Fabric follow a structured format with a type classification, payload data, and metadata.  For streaming applications, Fabric defines specific message types like MessageStart, MessageChunk, and MessageEnd that coordinate the delivery of streaming content across the network.

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
