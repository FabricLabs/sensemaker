[`jeeves.dev`][jeeves-dev]
==========================
source code for [`jeeves.dev`][jeeves-dev]

## Quick Start
From the repository root:
```
npm i # install dependencies
npm start # run node
```
A basic web interface should now be provided at http://localhost:3045

Enjoy!

## Configuring
Settings may be provided by modifying `settings/local.js`

```yaml
alias: Network alias.  Used when connecting to peers.
seed: Seed phrase.
```

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

## Sensemaker
Sensemaker is the original intelligence gathering platform around which Jeeves is based.

**General Purpose:** provide a common library for consuming data from various 
remote APIs, caching that data in a local database, stitching that information
together to extrapolate additional context for previously sparse data, and 
delivering that gained context via a simple, queryable API.

```html
<h1>Digital Intelligence is Here.</h1>
<p class="subtitle"><strong>Introducing <code>Jeeves</code></strong>, an organizer of information.</p>

<h2>The Power of Intelligence</h2>
<p><strong>code>Jeeves</code></strong> provides robust intelligence gathering services, <strong>accumulating</strong> and <em>understaning</em> information consumed from a set of configurable data streams to automatically construct new models and foster insight into complex systems.</p>
```

## Training
### Data Ingestion
Run `scripts/scraper.js` to ingest initial data.  Sensemaker will regularly crawl for additional data from remote data sources, which can be disabled by providing a false `crawl` setting.

### Tokenization
See the `./stores` directory.

Please note that embedding the entire file contents as a single sequence might not be practical or efficient for large files, depending on the available memory and the model's maximum sequence length. You may need to split the content into smaller chunks or use more advanced techniques like windowing or dynamic batching.

[jeeves-dev]: https://jeeves.dev
