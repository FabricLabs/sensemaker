# Developers
...should read "A Cypherpunk's Manifesto" by Timothy May.

## Quick Start
See `scripts/` for a list of available tools, or `npm run docs` to run a local copy of the documentation.

### Install
See `INSTALL.md` for a complete install guide.

### Configuration
Local settings should be provided by environment variables wherever possible, including:

- `SQL_DB_HOST` — host of the SQL server
- `SQL_DB_PORT` — port of the SQL server
- `SQL_DB_USERNAME` — username for the SQL user
- `SQL_DB_PASSWORD` — password for the SQL user
- `OLLAMA_HOST` — HTTP host for Ollama server
- `OLLAMA_PORT` — HTTP port for Ollama server
- `REDIS_HOST` — host of the Redis server
- `REDIS_PORT` — port of the Redis server

Settings can be configured locally through `settings/local.js` — care should be taken not to commit secrets; **again, prefer environment variables**.

## Overview
The project is primarily built in JavaScript, running Node.js on the server and leveraging React on the client side.  The client is transpiled using Webpack, and delivered as a complete bundle to the `assets/` directory.  This directory can be served by a static web server, so long as update operations (and requests for JSON representations of hosted resources) are passed through to the backend HTTP server (served on port `3045` by default).

### Breakdown
- Coordinator — `scripts/node.js` the Node.js master process, managing:
  - Sensemaker — `services/sensemaker.js` implements Fabric Service
  - AI Agents — `types/agent.js`
  - Trainer Agents — `types/trainer.js`
  - Worker Agents — `types/worker.js`
  - HTTPServer — `@fabric/http`
  - FabricNode — `@fabric/core`
- AI Agents — connect to external resources, such as OpenAI, HuggingFace, or Ollama
  - Fabric — `@fabric/core`
  - Matrix — `@fabric/matrix`
  - Python HTTP Server — for models unsupported by Ollama
- Services — implement a common API using `@fabric/core/types/service`
  - Sensemaker — primary, single-core instance of the Coordinator
  - Trainer - utilizes LangChain, etc. to generate, store, and retrieve embeddings
  - PyTorch — initial training tools used for gpt2 emulation

LangChain is available through `services/trainer.js` which also handles all general "training" operations, including the generation of embeddings.

### Workflow
1. Commit early, commit often
2. Once a branch diverges, open a pull request (see also number 1)
3. Regularly use `npm test` and `npm run report:todo`

### Tools
- Knex is used to manage database schemata, including migrations both forward and backward
- Ollama is used to provide a standard API for interfacing with LLMs
- Fabric is used for connectivity between instances

## Python Environment
Run `source .env/bin/activate` to enter the Python environment.  See also `requirements.txt` for dependencies.

## Tips
- You can use `scripts/node.js` to quickly run the service without building: `node scripts/node.js`
- Use `nodemon` to monitor for changes: `nodemon scripts/node.js`
- Re-build UI when necessary: `npm run build`
- Re-build semantic styling (CSS) when necessary: `npm run build:semantic`

You can pass `webpack` configuration options in `types/compiler.js` to tweak various settings, such as live reloading.

All other configuration options for your local node live in `settings/local.js` — some important settings include:

- `email` — configures email settings
  - `enable` — boolean (true or false)
  - `host` — hostname for outbound email

## Style
- semicolon not optional
- explicit over implicit (prefer clarity over brevity)
- spaces after function names, not after calls
- no double spacing (maximum one empty line)
- newline at EOF
