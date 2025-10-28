`SENSEMAKER`
============
`self-hosted artificial intelligence.`

**`SENSEMAKER`** is a suite of tools for creating and managing artificially-intelligent assistants in a secure, private environment.

## Core Features
- **Personalized per-instance** (set goals, tasks, and more)
- **Long-range strategic planning** using a "metacognitive network"
- **Automate background work** towards user-defined goals & objectives
- **Aggregate & analyze information** from the social media & more
- Robust network-enabled "Document Library" enables **real-time fine-tuning**

## Developer Setup
### Requirements
- Node 18.19.1 (use `scripts/nvm/install.sh`)
- MySQL 8.3
- Redis Stack 7.2

### Walkthrough
Fork the repository and clone it to the host machine:

```bash
git clone git@github.com:<YOUR_USERNAME>/sensemaker.git
```

Install dependencies:

```bash
npm install
```

Start the instance:

```bash
npm start
```

### Running with Docker Compose
You can run `make setup` to create a `.env` file, `make up` to start the service.  This will use your local Docker installation to create and manage an instance of Sensemaker.  Check `make help` for a list of available commands.

## Configuring
Many advanced configuration values can be found in the `settings/local.js` file.  Make sure to back up your settings before making changes.  You can use `make rebuild` to generate a new build, or `make clean` to destroy your instance.

## API
Sensemaker implements a REST API over HTTP, maintaining compatibility with other AI providers in addition to supporting a variety of commonly used extensions such as MCP servers, real-time updates over WebSockets, and peer-to-peer document exchange.

### Resources
Sensemaker maintains a map of **Resources** to their corresponding HTTP paths, and is responsive to client requests such as the `Accept` header.  For example, a request to `/conversations` might return the HTML document corresponding to the "Conversations" collection when opened in a browser, but when called from a client sending a `Accept: application/json` header would receive the list of conversation in JSON format.

Furthermore, any connection on a supported path can be upgraded to a WebSocket connection, enabling the client to receive notifications of any changes to the corresponding server-side resource.

### Using Sensemaker as a Library
You can import Sensemaker into your project as following:

```javascript
const Sensemaker = require('sensemaker');
const sensemaker = new Sensemaker(/* options */);
```

Various types are exposed, such as `Agent`, `Pool`, and `Trainer`.  These types can be used directly as follows:

```javascript
const Agent = require('sensemaker/types/agent');
```

## Graveyard
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
