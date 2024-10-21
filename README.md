`SENSEMAKER`
============
making sense of stuff.

**`SENSEMAKER`** provides robust intelligence gathering services, accumulating and organizing information from a set of configurable data streams to automatically construct new models and foster insight into complex systems.

## Quick Start
From the repository root:
```
npm i # install dependencies
npm start # run node
```
A basic web interface should now be provided at http://localhost:3040

Enjoy!

## Architecture
```
.
├── API.md — auto-generated documentation
├── actions — Redux actions
├── components — React components
├── scripts — useful tools & utilities
│   └── browser.js — browser script
│   └── node.js — server script
├── services — standalone services
├── types — Core types
```

## Configuring
Settings may be provided by modifying `settings/local.js`

```yaml
alias: Network alias.  Used when connecting to peers.
seed: Seed phrase.
```

## Training
### Data Ingestion
Run `scripts/scraper.js` to ingest initial data.  Sensemaker will regularly crawl for additional data from remote data sources, which can be disabled by providing a false `crawl` setting.

### Tokenization
See the `./stores` directory.

Please note that embedding the entire file contents as a single sequence might not be practical or efficient for large files, depending on the available memory and the model's maximum sequence length. You may need to split the content into smaller chunks or use more advanced techniques like windowing or dynamic batching.
