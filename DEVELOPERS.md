# Developers
...should read "A Cypherpunk's Manifesto" by Timothy May.

## Quick Start
See `scripts/` for a list of available tools.

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
- `OPENAI_API_KEY` — access token for OpenAI

## Overview
The project is primarily built in JavaScript, running Node.js on the server and leveraging React on the client side.

- Coordinator: the Node.js master process
  - HTTPServer — `@fabric/http`
  - FabricNode — `@fabric/core`
  - LangChain
- Agents: connect to external networks
  - Fabric — `@fabric/core`
  - Matrix — `@fabric/matrix`
  - ChatGPT — `services/openai.js`
  - PyTorch HTTP Client
- Services: provide an HTTP API
  - Jeeves — `services/jeeves.js`
  - Trainer - `services/trainer.js`
  - PyTorch

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


## File/Document Ingestion
When a file or document is uploaded, it's stored on the DDBB first.
Then, a Job is created for Redis to proccess, it's added to the queue and then taken assigned a status of 'COMPUTING'. - see `types/queue.js`.
The file would have a document created, related to it, and will be added to the job.
Once the job is taken from the queue it'll begin the ingestion and assign a status for that.
If the ingestion is completed without error, It's status are updated in the DDBB, and will also be available for the AI to proccess, broadcasting a notification to the user.
