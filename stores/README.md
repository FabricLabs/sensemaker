# Stores
Contains long-term data storage.  Do not modify.

## `./corpus`
Files located in this directory will be processed by Jeeves to produce a custom corpus for the managing agent.  All agents will derive context from this corpus, producing an initial template for the system.

All files should be in `.jsonl` format, with the following structure for each record:

```json
{ "prompt": "GET DOCUMENT: <Document ID>", "completion": "<Document Body>"}
```
