#!/bin/bash
## Install Models, in order of priority
### Core Models
ollama pull llama2 # runs in most places (8GB RAM?)
ollama pull mistral # runs in most places
ollama pull gemma # runs in most places

### Very Large Models
ollama pull mixtral # runs in most places (16GB RAM?)
ollama pull mixtral:8x22b
ollama pull command-r-plus # too slow (104B parameters)
ollama pull llama3
ollama pull llama3:70b
ollama pull llama3:70b-instruct-fp16

### Untested Models
ollama pull wizardlm2
ollama pull wizardlm2:7b
ollama pull wizardlm2:8x22b # Preferred Target
ollama pull dbrx # 132B parameters
ollama pull mxbai
ollama pull orca2
ollama pull falcon
ollama pull llama2-uncensored
ollama pull yarn-llama2:7b-128k
ollama pull yarn-llama2:13b-64k

### Embedding Models
ollama pull snowflake-arctic-embed # fast embeddings
ollama pull mxbai-embed-large # large embeddings
