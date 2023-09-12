# Developers
...should read "A CypherPunk's Manifesto" by Timothy May.

## Principles
1. Pull Requests should be the smallest possible set of changes implementing the desired feature.

## Overview
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
