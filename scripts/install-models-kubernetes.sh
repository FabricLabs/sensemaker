#!/bin/bash

# Get Ollama Container Name
POD_NAME=$(kubectl get pods -n ollama | tail -n +2 | cut -d ' ' -f 1)

echo "[+] Copying install script to $POD_NAME"
kubectl cp scripts/install-models.sh $POD_NAME:/install-models.sh -n ollama
kubectl exec -n ollama $POD_NAME -- /bin/bash -c '/install-models.sh'
