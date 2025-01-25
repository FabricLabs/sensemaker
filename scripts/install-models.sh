#!/bin/bash
## Install Models
### Core Models
ollama pull llama3.2 # runs in most places (8GB RAM?)
ollama pull llama3.3:70b-instruct-q2_K # smallest 3.3 model
ollama pull llama3.2-vision # runs in most places (8GB RAM?)

### Embedding Models
ollama pull mxbai-embed-large # large embeddings
