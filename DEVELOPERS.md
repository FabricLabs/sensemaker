# Developers
...should read "A CypherPunk's Manifesto" by Timothy May.

## Quick Start
See `scripts/` for a list of available tools.

### Install
See `INSTALL.md` for a complete install guide.

## Principles
1. Pull Requests should be the smallest possible set of changes implementing the desired feature.

## Overview
The project is primarily built in JavaScript, running Node.js on the server and leveraging React on the client side.

- Coordinator: the Node.js master process
  - HTTPServer
  - FabricNode
  - LangChain
- Agents: connect to external networks
  - Fabric
  - Matrix
  - ChatGPT
  - PyTorch HTTP Client
- Services: provided an HTTP API
  - PyTorch

## Python Environment
`source .env/bin/activate`

See also `requirements.txt`

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
