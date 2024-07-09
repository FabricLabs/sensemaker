# Developers
...should read "A CypherPunk's Manifesto" by Timothy May.

## Quick Start
See `scripts/` for a list of available tools.

### Install
See `INSTALL.md` for a complete install guide.

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

### Workflow
1. Commit early, commit often
2. Once a branch diverges, open a pull request (see also number 1)
3. Regularly use `npm test` and `npm run report:todo`

### Tools
- Knex is used to manage database schemata, including migrations both forward and backward
- Ollama is used to provide a standard API for interfacing with LLMs
- Fabric is used for connectivity between instances

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
