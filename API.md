## Classes

<dl>
<dt><a href="#ServiceUIRegistry">ServiceUIRegistry</a></dt>
<dd><p>Service UI Registry
Manages service-provided UI components and their routes.
Allows services to declare UI components that will be automatically
integrated into the Sensemaker dashboard.</p>
</dd>
<dt><a href="#Agent">Agent</a></dt>
<dd><p>The Agent service is responsible for managing an AI agent.  AI agents are self-contained actors which emit messages to a subscriber, which may be a human or another AI agent.</p>
</dd>
<dt><a href="#Bundler">Bundler</a></dt>
<dd><p>Builder for <a href="Fabric">Fabric</a>-based applications.</p>
</dd>
<dt><a href="#Clock">Clock</a> : <code>Object</code></dt>
<dd><p>Simple clock.  Emits <code>tick</code> events at a specified interval.</p>
</dd>
<dt><a href="#Pool">Pool</a></dt>
<dd><p>Manage a pool of member Agents to reliably queries.</p>
</dd>
<dt><a href="#Queue">Queue</a></dt>
<dd><p>A <code>Queue</code> is a simple job queue for managing asynchronous tasks.</p>
</dd>
<dt><a href="#Site">Site</a></dt>
<dd><p>Implements a full-capacity (Native + Edge nodes) for a Fabric Site.</p>
</dd>
<dt><a href="#SPA">SPA</a></dt>
<dd><p>Fully-managed HTML application.</p>
</dd>
<dt><a href="#Trainer">Trainer</a></dt>
<dd><p>Implements document ingestion.</p>
</dd>
<dt><a href="#Worker">Worker</a></dt>
<dd><p>Worker service.</p>
</dd>
<dt><a href="#ActiveWorkerQueue">ActiveWorkerQueue</a></dt>
<dd></dd>
<dt><a href="#EmailService">EmailService</a></dt>
<dd><p>Outbound email: Postmark HTTP API or SMTP (e.g. Mailpit at 127.0.0.1:1025).</p>
</dd>
<dt><a href="#FabricNetwork">FabricNetwork</a></dt>
<dd><p>Defines the Fabric interface for Sensemaker.
Extends Hub <code>services/fabric</code> via package export (no path.join deep-require).</p>
</dd>
<dt><a href="#Sensemaker">Sensemaker</a> : <code>Object</code></dt>
<dd><p>Sensemaker is the primary instance of the AI.</p>
</dd>
</dl>

## Members

<dl>
<dt><a href="#poolUpstreamModel">poolUpstreamModel</a></dt>
<dd><p>When set, pool queries use this upstream model id (e.g. OpenRouter tag).</p>
</dd>
<dt><a href="#additionalPoolModels">additionalPoolModels</a></dt>
<dd><p>Extra model names this member accepts in <a href="#Pool">Pool</a> (aliases for fallback routing).</p>
</dd>
<dt><a href="#maxEmbeddingInputChars">maxEmbeddingInputChars</a></dt>
<dd><p>Hard cap on characters sent to Ollama embed (tokens vary by model; avoids 400 context errors).</p>
</dd>
<dt><a href="#transport">transport</a></dt>
<dd><p><code>postmark</code> | <code>smtp</code> — default: smtp if host set, else postmark if key set</p>
</dd>
<dt><a href="#key">key</a></dt>
<dd><p>Postmark server token when transport is postmark</p>
</dd>
<dt><a href="#baseUrl">baseUrl</a></dt>
<dd><p>Absolute site origin for emailed links (e.g. <a href="http://127.0.0.1:3040">http://127.0.0.1:3040</a>). Falls back to <code>authority</code>.</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#REDIS_KEY">REDIS_KEY</a></dt>
<dd><p>Single active worker per Sensemaker node: one job at a time, FIFO queue.</p>
<ul>
<li><strong>Redis</strong> (when <code>hub.redis</code> is connected): list key <code>sensemaker:active_worker_queue:v1</code> — RPUSH enqueue, LPOP dequeue.</li>
<li><strong>Fallback</strong>: in-memory array when Redis is unavailable.</li>
</ul>
<p>When the worker has been <strong>idle</strong> for <a href="IDLE_MS">IDLE_MS</a>, the hub may run one <strong>background task</strong>
(oldest incomplete row in <code>tasks</code>) via <a href="#Sensemaker+_processBackgroundTaskJob">_processBackgroundTaskJob</a>.</p>
</dd>
<dt><a href="#crypto">crypto</a></dt>
<dd><p>Bridges OpenAI-compatible SSE (HTTP) with signed Fabric <a href="Message">Message</a> frames for chat streaming.</p>
<ul>
<li><strong>HTTP edge</strong>: <code>text/event-stream</code> lines <code>data: {JSON}\n\n</code> per OpenAI <code>chat.completion.chunk</code> / <code>[DONE]</code>.</li>
<li><strong>Fabric bus</strong>: <a href="Message#fromVector">Message#fromVector</a> + <a href="Message#signWithKey">Message#signWithKey</a> + <code>hub.http.broadcast</code>.</li>
</ul>
<p>Subscribers should use <a href="#verifyStreamMessage">verifyStreamMessage</a> with the hub’s public key.</p>
</dd>
<dt><a href="#SESSION_PAYLOAD_MAX_CHARS">SESSION_PAYLOAD_MAX_CHARS</a></dt>
<dd><p>Max JSON characters for session payload (after base64 decode).</p>
</dd>
<dt><a href="#TOKEN_KIND_SESSION">TOKEN_KIND_SESSION</a></dt>
<dd><p>Value of signed payload field <code>cap</code>: identifies this blob as an HTTP session token.</p>
</dd>
<dt><a href="#CAP_IDENTITY">CAP_IDENTITY</a></dt>
<dd><p>Session capabilities in <code>caps[]</code> (Token only; not Fabric opcodes).</p>
</dd>
<dt><del><a href="#CAP_SESSION">CAP_SESSION</a></del></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#getRegistry">getRegistry()</a> ⇒ <code><a href="#ServiceUIRegistry">ServiceUIRegistry</a></code></dt>
<dd><p>Get the global Service UI Registry instance.</p>
</dd>
<dt><a href="#browserPublicProcessEnv">browserPublicProcessEnv()</a> ⇒ <code>Record.&lt;string, string&gt;</code></dt>
<dd><p>Public env subset for browser bundles only. Never pass <code>process.env</code> wholesale into
<a href="webpack.DefinePlugin">webpack.DefinePlugin</a>: webpack inlines the full JSON, which leaks host secrets
(npm/GitHub tokens, API keys, mnemonics) into <code>assets/bundles/browser.min.js</code> and trips
GitHub push protection.</p>
</dd>
<dt><a href="#requestUsesTools">requestUsesTools()</a></dt>
<dd><p>True when the HTTP request carries non-empty tools (not <code>[]</code>, which is truthy in JS).</p>
</dd>
<dt><a href="#processSseLine">processSseLine()</a></dt>
<dd><p>One SSE line: <code>data: {...}</code> (OpenAI-style) or bare JSON (native Ollama stream).
Mutates ctx.assembled / ctx.lastContent; calls ctx.onStreamChunk(delta) when provided.</p>
</dd>
<dt><a href="#stripThinkTags">stripThinkTags()</a></dt>
<dd><p>Strip common model &quot;reasoning&quot; wrappers from final text.</p>
</dd>
<dt><a href="#consumeChatCompletionStream">consumeChatCompletionStream()</a></dt>
<dd><p>Read a streaming chat/completions body (ReadableStream or full buffer as text).</p>
</dd>
<dt><a href="#parseChatCompletionJsonOrSse">parseChatCompletionJsonOrSse()</a></dt>
<dd><p>Non-streaming body: single JSON object, or SSE lines if the server streamed anyway.</p>
</dd>
<dt><a href="#broadcastSignedFabric">broadcastSignedFabric(hub, fabricType, payload)</a> ⇒ <code>Message</code></dt>
<dd><p>Build and sign a Fabric message, then broadcast on the HTTP bridge.</p>
</dd>
<dt><a href="#verifyStreamMessage">verifyStreamMessage(fabricMessage, key)</a></dt>
<dd></dd>
<dt><a href="#openAiChatCompletionChunk">openAiChatCompletionChunk()</a></dt>
<dd><p>OpenAI <code>chat.completion.chunk</code> object (one SSE JSON payload).</p>
</dd>
<dt><a href="#canonicalSessionPayload">canonicalSessionPayload()</a></dt>
<dd><p>Canonical JSON for signing (stable key order and sorted role/cap arrays).</p>
</dd>
<dt><a href="#issueNodeSessionToken">issueNodeSessionToken(nodeKey, opts)</a></dt>
<dd></dd>
<dt><a href="#verifyNodeSessionToken">verifyNodeSessionToken(wire, nodeKey)</a> ⇒ <code>object</code> | <code>null</code></dt>
<dd></dd>
<dt><a href="#mergeVerifiedBearerTokens">mergeVerifiedBearerTokens()</a> ⇒ <code>Object</code> | <code>null</code></dt>
<dd><p>Verify one or more node-signed session tokens and merge roles/caps (same subject only).</p>
</dd>
<dt><a href="#capsIncludeAdmin">capsIncludeAdmin(caps)</a> ⇒ <code>boolean</code></dt>
<dd></dd>
<dt><a href="#ollamaBaseUrl">ollamaBaseUrl()</a></dt>
<dd><p>Base URL for the configured Ollama instance (used to proxy tags/version).</p>
</dd>
<dt><a href="#buildPipelineFanOut">buildPipelineFanOut()</a></dt>
<dd><p>Parallel LLM fan-out for <a href="#Sensemaker+handleTextRequest">handleTextRequest</a>.</p>
<p>Steps (same user template each time):</p>
<ol>
<li>Pool — one Ollama call per entry in <code>parallelModels</code> (different <code>model</code> tag).</li>
<li>Trainer — optional RAG / retrieval QA (can be slow; disable in lean profile).</li>
<li>Sensemaker — primary chat agent (same stack as final streamed summary).</li>
</ol>
<p>Results are combined downstream via Promise.allSettled + filtering; the final
answer is produced by a separate streamed <code>sensemaker.query</code> summarization pass.</p>
</dd>
</dl>

<a name="ServiceUIRegistry"></a>

## ServiceUIRegistry
Service UI Registry
Manages service-provided UI components and their routes.
Allows services to declare UI components that will be automatically
integrated into the Sensemaker dashboard.

**Kind**: global class  

* [ServiceUIRegistry](#ServiceUIRegistry)
    * [.register(serviceName, config)](#ServiceUIRegistry+register)
    * [.getServiceRoutes(serviceName)](#ServiceUIRegistry+getServiceRoutes) ⇒ <code>Array</code>
    * [.getAllRoutes()](#ServiceUIRegistry+getAllRoutes) ⇒ <code>Array</code>
    * [.getService(serviceName)](#ServiceUIRegistry+getService) ⇒ <code>Object</code> \| <code>null</code>
    * [.getAllServices()](#ServiceUIRegistry+getAllServices) ⇒ <code>Array</code>
    * [.getNavigationItems()](#ServiceUIRegistry+getNavigationItems) ⇒ <code>Array</code>
    * [.loadComponent(serviceName, componentPath)](#ServiceUIRegistry+loadComponent) ⇒ <code>React.Component</code> \| <code>null</code>
    * [.unregister(serviceName)](#ServiceUIRegistry+unregister)
    * [.clear()](#ServiceUIRegistry+clear)

<a name="ServiceUIRegistry+register"></a>

### serviceUIRegistry.register(serviceName, config)
Register UI components from a service.

**Kind**: instance method of [<code>ServiceUIRegistry</code>](#ServiceUIRegistry)  

| Param | Type | Description |
| --- | --- | --- |
| serviceName | <code>String</code> | Name of the service (e.g., 'star-citizen') |
| config | <code>Object</code> | UI configuration |
| config.name | <code>String</code> | Display name of the service |
| config.icon | <code>String</code> | Icon name (semantic-ui-react icon) |
| config.basePath | <code>String</code> | Base path for service routes (e.g., '/services/star-citizen') |
| config.routes | <code>Array</code> | Array of route definitions |
| config.routes[].path | <code>Object</code> | Route path (relative to basePath) |
| config.routes[].component | <code>String</code> \| <code>function</code> | Component name or require path |
| config.routes[].title | <code>String</code> | Page title |
| config.routes[].icon | <code>String</code> | Route icon (optional) |
| config.routes[].exact | <code>Boolean</code> | Exact path match (default: true) |
| config.metadata | <code>Object</code> | Additional metadata |

<a name="ServiceUIRegistry+getServiceRoutes"></a>

### serviceUIRegistry.getServiceRoutes(serviceName) ⇒ <code>Array</code>
Get all routes for a service.

**Kind**: instance method of [<code>ServiceUIRegistry</code>](#ServiceUIRegistry)  
**Returns**: <code>Array</code> - Array of route definitions  

| Param | Type | Description |
| --- | --- | --- |
| serviceName | <code>String</code> | Name of the service |

<a name="ServiceUIRegistry+getAllRoutes"></a>

### serviceUIRegistry.getAllRoutes() ⇒ <code>Array</code>
Get all registered routes.

**Kind**: instance method of [<code>ServiceUIRegistry</code>](#ServiceUIRegistry)  
**Returns**: <code>Array</code> - Array of all route definitions  
<a name="ServiceUIRegistry+getService"></a>

### serviceUIRegistry.getService(serviceName) ⇒ <code>Object</code> \| <code>null</code>
Get service configuration.

**Kind**: instance method of [<code>ServiceUIRegistry</code>](#ServiceUIRegistry)  
**Returns**: <code>Object</code> \| <code>null</code> - Service configuration or null  

| Param | Type | Description |
| --- | --- | --- |
| serviceName | <code>String</code> | Name of the service |

<a name="ServiceUIRegistry+getAllServices"></a>

### serviceUIRegistry.getAllServices() ⇒ <code>Array</code>
Get all registered services.

**Kind**: instance method of [<code>ServiceUIRegistry</code>](#ServiceUIRegistry)  
**Returns**: <code>Array</code> - Array of service configurations  
<a name="ServiceUIRegistry+getNavigationItems"></a>

### serviceUIRegistry.getNavigationItems() ⇒ <code>Array</code>
Get navigation menu items for services.

**Kind**: instance method of [<code>ServiceUIRegistry</code>](#ServiceUIRegistry)  
**Returns**: <code>Array</code> - Array of menu item configurations  
<a name="ServiceUIRegistry+loadComponent"></a>

### serviceUIRegistry.loadComponent(serviceName, componentPath) ⇒ <code>React.Component</code> \| <code>null</code>
Load a component dynamically.

**Kind**: instance method of [<code>ServiceUIRegistry</code>](#ServiceUIRegistry)  
**Returns**: <code>React.Component</code> \| <code>null</code> - Loaded component or null  

| Param | Type | Description |
| --- | --- | --- |
| serviceName | <code>String</code> | Name of the service |
| componentPath | <code>String</code> | Path or name of the component |

<a name="ServiceUIRegistry+unregister"></a>

### serviceUIRegistry.unregister(serviceName)
Unregister a service.

**Kind**: instance method of [<code>ServiceUIRegistry</code>](#ServiceUIRegistry)  

| Param | Type | Description |
| --- | --- | --- |
| serviceName | <code>String</code> | Name of the service |

<a name="ServiceUIRegistry+clear"></a>

### serviceUIRegistry.clear()
Clear all registered services.

**Kind**: instance method of [<code>ServiceUIRegistry</code>](#ServiceUIRegistry)  
<a name="Agent"></a>

## Agent
The Agent service is responsible for managing an AI agent.  AI agents are self-contained actors which emit messages to a subscriber, which may be a human or another AI agent.

**Kind**: global class  

* [Agent](#Agent)
    * [new Agent([settings])](#new_Agent_new)
    * [.query(request)](#Agent+query) ⇒ <code>AgentResponse</code>
    * [.queryStream(request)](#Agent+queryStream) ⇒ <code>Promise.&lt;AgentResponse&gt;</code>
    * [.messageStart(request)](#Agent+messageStart) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.messageChunk(request)](#Agent+messageChunk) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.messageEnd(request)](#Agent+messageEnd) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.messageAck(request)](#Agent+messageAck) ⇒ <code>Promise.&lt;Object&gt;</code>

<a name="new_Agent_new"></a>

### new Agent([settings])
Create an instance of an [Agent](#Agent).

**Returns**: [<code>Agent</code>](#Agent) - Instance of the Agent.  

| Param | Type | Description |
| --- | --- | --- |
| [settings] | <code>Object</code> | Settings for the Agent. |
| [settings.name] | <code>String</code> | The name of the agent. |
| [settings.type] | <code>String</code> | The type of the agent. |
| [settings.description] | <code>String</code> | The description of the agent. |
| [settings.frequency] | <code>Number</code> | The frequency at which the agent operates. |
| [settings.database] | <code>Object</code> | The database settings for the agent. |
| [settings.fabric] | <code>Object</code> | The Fabric settings for the agent. |
| [settings.parameters] | <code>Object</code> | The parameters for the agent. |
| [settings.model] | <code>String</code> | The model for the agent. |

<a name="Agent+query"></a>

### agent.query(request) ⇒ <code>AgentResponse</code>
Query the agent with some text.

**Kind**: instance method of [<code>Agent</code>](#Agent)  
**Returns**: <code>AgentResponse</code> - Response object.  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Request object. |
| request.query | <code>String</code> | The query to send to the agent. |

<a name="Agent+queryStream"></a>

### agent.queryStream(request) ⇒ <code>Promise.&lt;AgentResponse&gt;</code>
Stream a query to the agent with real-time response chunks.

**Kind**: instance method of [<code>Agent</code>](#Agent)  
**Returns**: <code>Promise.&lt;AgentResponse&gt;</code> - Response object.  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Request object. |
| request.query | <code>String</code> | The query to send to the agent. |
| [request.onChunk] | <code>function</code> | Callback function for each chunk received. |
| [request.onStart] | <code>function</code> | Callback function when streaming starts. |
| [request.onEnd] | <code>function</code> | Callback function when streaming ends. |

<a name="Agent+messageStart"></a>

### agent.messageStart(request) ⇒ <code>Promise.&lt;Object&gt;</code>
Handle MessageStart requests.

**Kind**: instance method of [<code>Agent</code>](#Agent)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - Response object.  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | The MessageStart request. |

<a name="Agent+messageChunk"></a>

### agent.messageChunk(request) ⇒ <code>Promise.&lt;Object&gt;</code>
Handle MessageChunk requests.

**Kind**: instance method of [<code>Agent</code>](#Agent)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - Response object.  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | The MessageChunk request. |

<a name="Agent+messageEnd"></a>

### agent.messageEnd(request) ⇒ <code>Promise.&lt;Object&gt;</code>
Handle MessageEnd requests.

**Kind**: instance method of [<code>Agent</code>](#Agent)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - Response object.  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | The MessageEnd request. |

<a name="Agent+messageAck"></a>

### agent.messageAck(request) ⇒ <code>Promise.&lt;Object&gt;</code>
Handle MessageAck requests.

**Kind**: instance method of [<code>Agent</code>](#Agent)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - Response object.  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | The MessageAck request. |

<a name="Bundler"></a>

## Bundler
Builder for [Fabric](Fabric)-based applications.

**Kind**: global class  

* [Bundler](#Bundler)
    * [new Bundler([settings])](#new_Bundler_new)
    * [.compileJavaScriptBundle()](#Bundler+compileJavaScriptBundle) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.calculateBundleHash(bundlePath)](#Bundler+calculateBundleHash) ⇒ <code>string</code>
    * [.getBundleStats()](#Bundler+getBundleStats) ⇒ <code>Object</code>
    * [.compileTo(target)](#Bundler+compileTo) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.generateCacheManifest(outputPath)](#Bundler+generateCacheManifest)
    * [.generateWebManifest(outputPath)](#Bundler+generateWebManifest)

<a name="new_Bundler_new"></a>

### new Bundler([settings])
Create an instance of the bundler.


| Param | Type | Description |
| --- | --- | --- |
| [settings] | <code>Object</code> | Map of settings. |
| [settings.document] | <code>HTTPComponent</code> | Document to use. |

<a name="Bundler+compileJavaScriptBundle"></a>

### bundler.compileJavaScriptBundle() ⇒ <code>Promise.&lt;Object&gt;</code>
Compile the JavaScript bundle using webpack.

**Kind**: instance method of [<code>Bundler</code>](#Bundler)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - Webpack compilation results  
<a name="Bundler+calculateBundleHash"></a>

### bundler.calculateBundleHash(bundlePath) ⇒ <code>string</code>
Calculate the sha256 hash of the generated JavaScript bundle.

**Kind**: instance method of [<code>Bundler</code>](#Bundler)  
**Returns**: <code>string</code> - SHA256 hash of the bundle  

| Param | Type | Description |
| --- | --- | --- |
| bundlePath | <code>string</code> | Path to the bundle file |

<a name="Bundler+getBundleStats"></a>

### bundler.getBundleStats() ⇒ <code>Object</code>
Get bundle statistics.

**Kind**: instance method of [<code>Bundler</code>](#Bundler)  
**Returns**: <code>Object</code> - Bundle statistics  
<a name="Bundler+compileTo"></a>

### bundler.compileTo(target) ⇒ <code>Promise.&lt;Object&gt;</code>
Compile the HTML file to a specific target.

**Kind**: instance method of [<code>Bundler</code>](#Bundler)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - Compilation results including bundle hash  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| target | <code>string</code> | <code>&quot;assets/index.html&quot;</code> | Path to output HTML file |

<a name="Bundler+generateCacheManifest"></a>

### bundler.generateCacheManifest(outputPath)
Generate a cache.manifest file listing all static assets for offline support.

**Kind**: instance method of [<code>Bundler</code>](#Bundler)  

| Param | Type | Description |
| --- | --- | --- |
| outputPath | <code>string</code> | Path to the manifest file (default: 'assets/cache.manifest') |

<a name="Bundler+generateWebManifest"></a>

### bundler.generateWebManifest(outputPath)
Generate a manifest.json file for PWA support.

**Kind**: instance method of [<code>Bundler</code>](#Bundler)  

| Param | Type | Description |
| --- | --- | --- |
| outputPath | <code>string</code> | Path to the manifest file (default: 'assets/manifest.json') |

<a name="Clock"></a>

## Clock : <code>Object</code>
Simple clock.  Emits `tick` events at a specified interval.

**Kind**: global class  
<a name="Pool"></a>

## Pool
Manage a pool of member Agents to reliably queries.

**Kind**: global class  
<a name="Pool+resetMembers"></a>

### pool.resetMembers()
Clear members so the pool can be reconfigured (e.g. OpenRouter toggle). Call before start().

**Kind**: instance method of [<code>Pool</code>](#Pool)  
<a name="Queue"></a>

## Queue
A `Queue` is a simple job queue for managing asynchronous tasks.

**Kind**: global class  
<a name="Queue+registerMethod"></a>

### queue.registerMethod(name, contract, context) ⇒ <code>function</code>
Register a method with the queue.

**Kind**: instance method of [<code>Queue</code>](#Queue)  
**Returns**: <code>function</code> - The registered method.  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>String</code> | Name of the method to register. |
| contract | <code>function</code> | Function to execute when the method is called. |
| context | <code>Object</code> | Context in which to execute the method. |

<a name="Site"></a>

## Site
Implements a full-capacity (Native + Edge nodes) for a Fabric Site.

**Kind**: global class  
<a name="new_Site_new"></a>

### new Site([settings])
Creates an instance of the [Site](#Site), which provides general statistics covering a target Fabric node.

**Returns**: [<code>Site</code>](#Site) - Instance of the [Site](#Site).  Call `render(state)` to derive a new DOM element.  

| Param | Type | Description |
| --- | --- | --- |
| [settings] | <code>Object</code> | Configuration values for the [Site](#Site). |

<a name="SPA"></a>

## SPA
Fully-managed HTML application.

**Kind**: global class  
<a name="Trainer"></a>

## Trainer
Implements document ingestion.

**Kind**: global class  

* [Trainer](#Trainer)
    * [.ingestDirectory(directory)](#Trainer+ingestDirectory) ⇒ <code>Promise</code>
    * [.ingestDocument(document, type)](#Trainer+ingestDocument) ⇒ <code>Promise</code>
    * [.queryStream()](#Trainer+queryStream)
    * [._mapSimilarityResults(request)](#Trainer+_mapSimilarityResults) ⇒ <code>Promise</code>
    * [._ensureEmbeddings()](#Trainer+_ensureEmbeddings)
    * [._unescapeRedisMetadata()](#Trainer+_unescapeRedisMetadata)
    * [._isChunkMemoryMetadata()](#Trainer+_isChunkMemoryMetadata)
    * [.listMemoryFragmentsFromIndex(indexName, opts)](#Trainer+listMemoryFragmentsFromIndex)
    * [.getMemoryFragmentByRedisKey()](#Trainer+getMemoryFragmentByRedisKey)

<a name="Trainer+ingestDirectory"></a>

### trainer.ingestDirectory(directory) ⇒ <code>Promise</code>
Ingest a directory of files.

**Kind**: instance method of [<code>Trainer</code>](#Trainer)  
**Returns**: <code>Promise</code> - Resolves with the result of the operation.  

| Param | Type | Description |
| --- | --- | --- |
| directory | <code>String</code> | Path to ingest. |

<a name="Trainer+ingestDocument"></a>

### trainer.ingestDocument(document, type) ⇒ <code>Promise</code>
Ingest a well-formed document.

**Kind**: instance method of [<code>Trainer</code>](#Trainer)  
**Returns**: <code>Promise</code> - Resolves with the result of the operation.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| document | <code>Object</code> |  | Well-formed document object. |
| type | <code>String</code> | <code>text</code> | Name of the document type. |

<a name="Trainer+queryStream"></a>

### trainer.queryStream()
Streaming-compatible surface for Trainer.
Trainer retrieval is non-token-streaming today, so this emits start/chunk/end
around the resolved query payload to align API shape with Agent/Pool.

**Kind**: instance method of [<code>Trainer</code>](#Trainer)  
<a name="Trainer+_mapSimilarityResults"></a>

### trainer.\_mapSimilarityResults(request) ⇒ <code>Promise</code>
Search the document store.

**Kind**: instance method of [<code>Trainer</code>](#Trainer)  
**Returns**: <code>Promise</code> - Resolves with the result of the operation.  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Search object. |

<a name="Trainer+_ensureEmbeddings"></a>

### trainer.\_ensureEmbeddings()
Lazily initialize the Redis vector store + Ollama embeddings on first use.
Called automatically by search() and ingestDocument(); idempotent.

**Kind**: instance method of [<code>Trainer</code>](#Trainer)  
<a name="Trainer+_unescapeRedisMetadata"></a>

### trainer.\_unescapeRedisMetadata()
Undo LangChain Redis metadata escaping (see @langchain/redis vectorstores).

**Kind**: instance method of [<code>Trainer</code>](#Trainer)  
<a name="Trainer+_isChunkMemoryMetadata"></a>

### trainer.\_isChunkMemoryMetadata()
True for chunked trainer fragments (excludes owner-index seed rows without chunk_index).

**Kind**: instance method of [<code>Trainer</code>](#Trainer)  
<a name="Trainer+listMemoryFragmentsFromIndex"></a>

### trainer.listMemoryFragmentsFromIndex(indexName, opts)
Scan Redis vector hashes for one RediSearch index (LangChain key prefix doc:{indexName}:).

**Kind**: instance method of [<code>Trainer</code>](#Trainer)  

| Param | Type | Description |
| --- | --- | --- |
| indexName | <code>string</code> | e.g. sensemaker:owners:42 or sensemaker-embeddings |
| opts | <code>object</code> |  |
| [opts.limit] | <code>number</code> |  |
| [opts.ownerFilterUserId] | <code>number</code> \| <code>null</code> | when set, only rows whose metadata.owner matches |

<a name="Trainer+getMemoryFragmentByRedisKey"></a>

### trainer.getMemoryFragmentByRedisKey()
Load one Redis memory hash by full key; returns null if missing.

**Kind**: instance method of [<code>Trainer</code>](#Trainer)  
<a name="Worker"></a>

## Worker
Worker service.

**Kind**: global class  
<a name="ActiveWorkerQueue"></a>

## ActiveWorkerQueue
**Kind**: global class  

* [ActiveWorkerQueue](#ActiveWorkerQueue)
    * [new ActiveWorkerQueue(hub)](#new_ActiveWorkerQueue_new)
    * [._memory](#ActiveWorkerQueue+_memory) : <code>Array.&lt;object&gt;</code>
    * [._timer](#ActiveWorkerQueue+_timer) : <code>\*</code> \| <code>null</code>
    * [.queueDepth()](#ActiveWorkerQueue+queueDepth) ⇒ <code>Promise.&lt;number&gt;</code>
    * [.enqueue(job)](#ActiveWorkerQueue+enqueue)
    * [._dequeue()](#ActiveWorkerQueue+_dequeue) ⇒ <code>Promise.&lt;(object\|null)&gt;</code>

<a name="new_ActiveWorkerQueue_new"></a>

### new ActiveWorkerQueue(hub)

| Param | Type |
| --- | --- |
| hub | [<code>Sensemaker</code>](#Sensemaker) | 

<a name="ActiveWorkerQueue+_memory"></a>

### activeWorkerQueue.\_memory : <code>Array.&lt;object&gt;</code>
**Kind**: instance property of [<code>ActiveWorkerQueue</code>](#ActiveWorkerQueue)  
<a name="ActiveWorkerQueue+_timer"></a>

### activeWorkerQueue.\_timer : <code>\*</code> \| <code>null</code>
**Kind**: instance property of [<code>ActiveWorkerQueue</code>](#ActiveWorkerQueue)  
<a name="ActiveWorkerQueue+queueDepth"></a>

### activeWorkerQueue.queueDepth() ⇒ <code>Promise.&lt;number&gt;</code>
**Kind**: instance method of [<code>ActiveWorkerQueue</code>](#ActiveWorkerQueue)  
<a name="ActiveWorkerQueue+enqueue"></a>

### activeWorkerQueue.enqueue(job)
**Kind**: instance method of [<code>ActiveWorkerQueue</code>](#ActiveWorkerQueue)  

| Param | Type |
| --- | --- |
| job | <code>object</code> | 

<a name="ActiveWorkerQueue+_dequeue"></a>

### activeWorkerQueue.\_dequeue() ⇒ <code>Promise.&lt;(object\|null)&gt;</code>
**Kind**: instance method of [<code>ActiveWorkerQueue</code>](#ActiveWorkerQueue)  
<a name="EmailService"></a>

## EmailService
Outbound email: Postmark HTTP API or SMTP (e.g. Mailpit at 127.0.0.1:1025).

**Kind**: global class  
<a name="FabricNetwork"></a>

## FabricNetwork
Defines the Fabric interface for Sensemaker.
Extends Hub `services/fabric` via package export (no path.join deep-require).

**Kind**: global class  

* [FabricNetwork](#FabricNetwork)
    * [new FabricNetwork([settings])](#new_FabricNetwork_new)
    * [._connect(target)](#FabricNetwork+_connect)

<a name="new_FabricNetwork_new"></a>

### new FabricNetwork([settings])
Create an instance of the service.

**Returns**: <code>FabricService</code> - A new instance of the service.  

| Param | Type | Description |
| --- | --- | --- |
| [settings] | <code>Object</code> | Settings for the service. |

<a name="FabricNetwork+_connect"></a>

### fabricNetwork.\_connect(target)
Outbound P2P dial (host:port or pubkey@host:port). Delegates to the Fabric [Peer](Peer).

**Kind**: instance method of [<code>FabricNetwork</code>](#FabricNetwork)  

| Param | Type |
| --- | --- |
| target | <code>string</code> | 

<a name="Sensemaker"></a>

## Sensemaker : <code>Object</code>
Sensemaker is the primary instance of the AI.

**Kind**: global class  
**Extends**: <code>Service</code>  

* [Sensemaker](#Sensemaker) : <code>Object</code>
    * [new Sensemaker([settings])](#new_Sensemaker_new)
    * [.activeWorkerQueue](#Sensemaker+activeWorkerQueue)
    * [._lastBackgroundTaskAtById](#Sensemaker+_lastBackgroundTaskAtById)
    * [._workerJobKind](#Sensemaker+_workerJobKind)
    * [._playnetDonationAddress](#Sensemaker+_playnetDonationAddress)
    * [.combinationsOf(tokens, prefix)](#Sensemaker+combinationsOf) ⇒ <code>Array</code>
    * [.createAgent(configuration)](#Sensemaker+createAgent) ⇒ [<code>Agent</code>](#Agent)
    * [.estimateTokens(input)](#Sensemaker+estimateTokens) ⇒ <code>Number</code>
    * [.importantPhrases(input, limit)](#Sensemaker+importantPhrases) ⇒ <code>Array</code>
    * [.importantWords(input, limit)](#Sensemaker+importantWords) ⇒ <code>Array</code>
    * [.properNouns(input)](#Sensemaker+properNouns) ⇒ <code>Array</code>
    * [.uniqueWords(input)](#Sensemaker+uniqueWords) ⇒ <code>Array</code>
    * [.alert(message)](#Sensemaker+alert) ⇒ <code>Boolean</code>
    * [._finalizeConversationAfterReply(opts)](#Sensemaker+_finalizeConversationAfterReply)
    * [._startPlaynetBitcoinIfPresent()](#Sensemaker+_startPlaynetBitcoinIfPresent)
    * [._ensurePlaynetDonationAddress()](#Sensemaker+_ensurePlaynetDonationAddress) ⇒ <code>Promise.&lt;(string\|null)&gt;</code>
    * [._pickOldestBackgroundTask()](#Sensemaker+_pickOldestBackgroundTask) ⇒ <code>Promise.&lt;(object\|undefined)&gt;</code>
    * [._processBackgroundTaskJob(taskRow)](#Sensemaker+_processBackgroundTaskJob)
    * [._processConversationTurnJob(job)](#Sensemaker+_processConversationTurnJob)
    * [.handleTextRequest(request)](#Sensemaker+handleTextRequest) ⇒ <code>Promise</code>
    * [.retrieveFile(id)](#Sensemaker+retrieveFile) ⇒ <code>Object</code>
    * [.refreshPoolMembersAfterGlobalSettings()](#Sensemaker+refreshPoolMembersAfterGlobalSettings)
    * [.start()](#Sensemaker+start) ⇒ <code>Promise</code>
    * [.stop()](#Sensemaker+stop) ⇒ <code>Promise</code>
    * [.syncSource(id)](#Sensemaker+syncSource) ⇒ <code>Promise</code>
    * [._attachFabricApplicationNamespaceHandlers()](#Sensemaker+_attachFabricApplicationNamespaceHandlers)
    * [._getRoomMessages()](#Sensemaker+_getRoomMessages) ⇒ <code>Array</code>
    * [._handleRequest(request)](#Sensemaker+_handleRequest) ⇒ <code>SensemakerResponse</code>
    * [._userHasAdminAccess()](#Sensemaker+_userHasAdminAccess)
    * [._sendSensemakerAdminRequiredJson()](#Sensemaker+_sendSensemakerAdminRequiredJson)
    * [._assertSensemakerAdminJson()](#Sensemaker+_assertSensemakerAdminJson) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [._userCanAccessConversation()](#Sensemaker+_userCanAccessConversation)
    * [.verifyMessage(signedMessage)](#Sensemaker+verifyMessage) ⇒ <code>Boolean</code>
    * [._verifyInboundFabricMessage(message)](#Sensemaker+_verifyInboundFabricMessage) ⇒ <code>Boolean</code>
    * [.prepareTextRequest(request)](#Sensemaker+prepareTextRequest) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.streamTextResponse(preparedRequest, assistantMessageId, fabricConversationID, isNew, localConversationID)](#Sensemaker+streamTextResponse)

<a name="new_Sensemaker_new"></a>

### new Sensemaker([settings])
Constructor for the Sensemaker instance.

**Returns**: [<code>Sensemaker</code>](#Sensemaker) - Resulting instance of Sensemaker.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [settings] | <code>Object</code> | <code>{}</code> | Map of configuration values. |
| [settings.seed] | <code>Number</code> |  | 12 or 24 word mnemonic seed. |
| [settings.port] | <code>Number</code> | <code>7777</code> | Fabric messaging port. |

<a name="Sensemaker+activeWorkerQueue"></a>

### sensemaker.activeWorkerQueue
One serial NLP / conversation worker + FIFO queue (see [ActiveWorkerQueue](#ActiveWorkerQueue)).

**Kind**: instance property of [<code>Sensemaker</code>](#Sensemaker)  
<a name="Sensemaker+_lastBackgroundTaskAtById"></a>

### sensemaker.\_lastBackgroundTaskAtById
Per-task cooldown so idle background work does not hammer the same row.

**Kind**: instance property of [<code>Sensemaker</code>](#Sensemaker)  
<a name="Sensemaker+_workerJobKind"></a>

### sensemaker.\_workerJobKind
`'conversation' | 'background' | null` while the active worker runs a job.

**Kind**: instance property of [<code>Sensemaker</code>](#Sensemaker)  
<a name="Sensemaker+_playnetDonationAddress"></a>

### sensemaker.\_playnetDonationAddress
Permanent playnet facet: a [Hub](Hub) wired to regtest RPC (defaults to 127.0.0.1:18443).
Used for playnet-only flows (e.g. host donations) independent of mainnet / `this.bitcoin.enable`.
Does not start Fabric P2P or HTTP; only its Bitcoin client is started in [start](#Sensemaker+start).
Only created when RPC credentials are provided so a development node without a local bitcoind
doesn't wait for the startTimeoutMs on every startup.

**Kind**: instance property of [<code>Sensemaker</code>](#Sensemaker)  
<a name="Sensemaker+combinationsOf"></a>

### sensemaker.combinationsOf(tokens, prefix) ⇒ <code>Array</code>
Extracts a list of possible combinations of a given array.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
**Returns**: <code>Array</code> - List of possible combinations.  

| Param | Type | Description |
| --- | --- | --- |
| tokens | <code>Array</code> | List of tokens to combine. |
| prefix | <code>String</code> | Additional prefix to add to each combination. |

<a name="Sensemaker+createAgent"></a>

### sensemaker.createAgent(configuration) ⇒ [<code>Agent</code>](#Agent)
Creates (and registers) a new [Agent](#Agent) instance.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
**Returns**: [<code>Agent</code>](#Agent) - Instance of the [Agent](#Agent).  

| Param | Type | Description |
| --- | --- | --- |
| configuration | <code>Object</code> | Settings for the [Agent](#Agent). |

<a name="Sensemaker+estimateTokens"></a>

### sensemaker.estimateTokens(input) ⇒ <code>Number</code>
Provides a function to estimate the number of tokens in a given input string.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
**Returns**: <code>Number</code> - Estimated number of tokens.  

| Param | Type | Description |
| --- | --- | --- |
| input | <code>String</code> | Input string to estimate. |

<a name="Sensemaker+importantPhrases"></a>

### sensemaker.importantPhrases(input, limit) ⇒ <code>Array</code>
Extracts a list of important phrases from a given input string.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
**Returns**: <code>Array</code> - List of important phrases in order of rank.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| input | <code>String</code> |  | Input string to analyze. |
| limit | <code>Number</code> | <code>5</code> | Maximum number of phrases to return. |

<a name="Sensemaker+importantWords"></a>

### sensemaker.importantWords(input, limit) ⇒ <code>Array</code>
Extracts a list of important words from a given input string.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
**Returns**: <code>Array</code> - List of important words in order of rank.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| input | <code>String</code> |  | Input string to analyze. |
| limit | <code>Number</code> | <code>5</code> | Maximum number of words to return. |

<a name="Sensemaker+properNouns"></a>

### sensemaker.properNouns(input) ⇒ <code>Array</code>
Extract a list of proper nouns from a given input string.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
**Returns**: <code>Array</code> - List of proper nouns.  

| Param | Type | Description |
| --- | --- | --- |
| input | <code>String</code> | Input string to analyze. |

<a name="Sensemaker+uniqueWords"></a>

### sensemaker.uniqueWords(input) ⇒ <code>Array</code>
Extract a list of unique words from a given input string.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
**Returns**: <code>Array</code> - List of unique words.  

| Param | Type | Description |
| --- | --- | --- |
| input | <code>String</code> | Input string to analyze. |

<a name="Sensemaker+alert"></a>

### sensemaker.alert(message) ⇒ <code>Boolean</code>
Sends a system-wide alert.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
**Returns**: <code>Boolean</code> - Returns `true` if the alert sent, `false` otherwise.  

| Param | Type | Description |
| --- | --- | --- |
| message | <code>String</code> | Message to send in the alert. |

<a name="Sensemaker+_finalizeConversationAfterReply"></a>

### sensemaker.\_finalizeConversationAfterReply(opts)
After a conversation reply is stored via handleTextRequest, refresh title/summary and broadcast.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  

| Param | Type |
| --- | --- |
| opts | <code>object</code> | 
| opts.localConversationID | <code>number</code> | 
| opts.fabricConversationID | <code>string</code> | 
| opts.isNew | <code>boolean</code> | 

<a name="Sensemaker+_startPlaynetBitcoinIfPresent"></a>

### sensemaker.\_startPlaynetBitcoinIfPresent()
Start only the playnet [Hub](Hub) Bitcoin RPC client (no Fabric P2P, beacon, or HTTP listener).

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
<a name="Sensemaker+_ensurePlaynetDonationAddress"></a>

### sensemaker.\_ensurePlaynetDonationAddress() ⇒ <code>Promise.&lt;(string\|null)&gt;</code>
Cached playnet receive address for donations to this host (regtest).

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
<a name="Sensemaker+_pickOldestBackgroundTask"></a>

### sensemaker.\_pickOldestBackgroundTask() ⇒ <code>Promise.&lt;(object\|undefined)&gt;</code>
Oldest incomplete task that is not in a recent background cooldown window.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
<a name="Sensemaker+_processBackgroundTaskJob"></a>

### sensemaker.\_processBackgroundTaskJob(taskRow)
Refresh `tasks.recommendation` when the node is otherwise idle.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  

| Param | Type |
| --- | --- |
| taskRow | <code>object</code> | 

<a name="Sensemaker+_processConversationTurnJob"></a>

### sensemaker.\_processConversationTurnJob(job)
Run one queued chat turn: single-flight worker entry point.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  

| Param | Type |
| --- | --- |
| job | <code>object</code> | 

<a name="Sensemaker+handleTextRequest"></a>

### sensemaker.handleTextRequest(request) ⇒ <code>Promise</code>
Generate a response to a given request.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
**Returns**: <code>Promise</code> - Resolves with the response to the request.  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Request object. |
| request.query | <code>String</code> | Query text. |
| [request.conversation_id] | <code>String</code> | Unique identifier for the conversation. |

<a name="Sensemaker+retrieveFile"></a>

### sensemaker.retrieveFile(id) ⇒ <code>Object</code>
Retrieve a file by its database ID.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
**Returns**: <code>Object</code> - File object.  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>Number</code> | Database ID of the file. |

<a name="Sensemaker+refreshPoolMembersAfterGlobalSettings"></a>

### sensemaker.refreshPoolMembersAfterGlobalSettings()
Rebuild pool members (e.g. after Admin toggles OPENROUTER_POOL_ENABLED).

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
<a name="Sensemaker+start"></a>

### sensemaker.start() ⇒ <code>Promise</code>
Start the process.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
**Returns**: <code>Promise</code> - Resolves once the process has been started.

NOTE: This still replaces Hub.start entirely (does not call super.start).
Prefer migrating onto Hub lifecycle hooks — see @fabric/hub docs/HUB_LIFECYCLE.md
(`beforeRoutes` / `afterRoutes` / `afterRuntime`, or settings.startHooks) so
identity HTTP, peering, and Beacon stay shared with upstream Hub.  
<a name="Sensemaker+stop"></a>

### sensemaker.stop() ⇒ <code>Promise</code>
Stop the process.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
**Returns**: <code>Promise</code> - Resolves once the process has been stopped.  
<a name="Sensemaker+syncSource"></a>

### sensemaker.syncSource(id) ⇒ <code>Promise</code>
Synchronize a remote [Source](Source) by ID.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>Hash256</code> | The ID of the source to sync. |

<a name="Sensemaker+_attachFabricApplicationNamespaceHandlers"></a>

### sensemaker.\_attachFabricApplicationNamespaceHandlers()
Subscribe to Fabric Peer application-namespace events when available.
Does not touch the AI Conversation / JSONPatch stream path.

CONTRACT_PUBLISH is ingested into Hub tracked-application-contracts (pending
until operator Accept). CONTRACT_MESSAGE is counted per namespace; known
ARC body types (see contracts/applicationMessageTypes) are flagged on the
emitted event. Unknown namespaces stay non-fatal beyond the counter.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
<a name="Sensemaker+_getRoomMessages"></a>

### sensemaker.\_getRoomMessages() ⇒ <code>Array</code>
Retrieve a conversation's messages.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
**Returns**: <code>Array</code> - List of the conversation's messages.  
<a name="Sensemaker+_handleRequest"></a>

### sensemaker.\_handleRequest(request) ⇒ <code>SensemakerResponse</code>
Generate a response to a request.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>SensemakerRequest</code> | The request. |
| [request.room] | <code>String</code> | Matrix room to retrieve conversation history from. |

<a name="Sensemaker+_userHasAdminAccess"></a>

### sensemaker.\_userHasAdminAccess()
Node-signed session with [nodeSessionToken.CAP_ADMIN](nodeSessionToken.CAP_ADMIN) and DB `is_admin`.
Legacy HMAC sessions never satisfy this (forged bearer tokens could otherwise claim admin).

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
<a name="Sensemaker+_sendSensemakerAdminRequiredJson"></a>

### sensemaker.\_sendSensemakerAdminRequiredJson()
Single JSON body for failed admin checks (DRY for routes).

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
<a name="Sensemaker+_assertSensemakerAdminJson"></a>

### sensemaker.\_assertSensemakerAdminJson() ⇒ <code>Promise.&lt;boolean&gt;</code>
Require node-signed CAP_ADMIN + DB admin for JSON API handlers.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - false if response was sent with an error status  
<a name="Sensemaker+_userCanAccessConversation"></a>

### sensemaker.\_userCanAccessConversation()
Conversation row must include `creator_id`. Admins may access any; others only their own.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
<a name="Sensemaker+verifyMessage"></a>

### sensemaker.verifyMessage(signedMessage) ⇒ <code>Boolean</code>
Verifies a signed message

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
**Returns**: <code>Boolean</code> - - Whether the signature is valid  

| Param | Type | Description |
| --- | --- | --- |
| signedMessage | <code>Object</code> | The signed message object |

<a name="Sensemaker+_verifyInboundFabricMessage"></a>

### sensemaker.\_verifyInboundFabricMessage(message) ⇒ <code>Boolean</code>
Verify inbound Fabric messages from trusted HTTP/WebSocket sources.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  

| Param | Type | Description |
| --- | --- | --- |
| message | <code>Object</code> | Fabric Message instance |

<a name="Sensemaker+prepareTextRequest"></a>

### sensemaker.prepareTextRequest(request) ⇒ <code>Promise.&lt;Object&gt;</code>
Prepare a text request using the same logic as handleTextRequest

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - Prepared request with context, messages, and user data  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Request object |

<a name="Sensemaker+streamTextResponse"></a>

### sensemaker.streamTextResponse(preparedRequest, assistantMessageId, fabricConversationID, isNew, localConversationID)
Stream a text response using the prepared request

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  

| Param | Type | Description |
| --- | --- | --- |
| preparedRequest | <code>Object</code> | Prepared request from prepareTextRequest |
| assistantMessageId | <code>String</code> | Assistant message ID for updates |
| fabricConversationID | <code>String</code> | Conversation ID |
| isNew | <code>Boolean</code> | Whether this is a new conversation |
| localConversationID | <code>Number</code> | Local conversation ID |

<a name="poolUpstreamModel"></a>

## poolUpstreamModel
When set, pool queries use this upstream model id (e.g. OpenRouter tag).

**Kind**: global variable  
<a name="additionalPoolModels"></a>

## additionalPoolModels
Extra model names this member accepts in [Pool](#Pool) (aliases for fallback routing).

**Kind**: global variable  
<a name="maxEmbeddingInputChars"></a>

## maxEmbeddingInputChars
Hard cap on characters sent to Ollama embed (tokens vary by model; avoids 400 context errors).

**Kind**: global variable  
<a name="transport"></a>

## transport
`postmark` | `smtp` — default: smtp if host set, else postmark if key set

**Kind**: global variable  
<a name="key"></a>

## key
Postmark server token when transport is postmark

**Kind**: global variable  
<a name="baseUrl"></a>

## baseUrl
Absolute site origin for emailed links (e.g. http://127.0.0.1:3040). Falls back to `authority`.

**Kind**: global variable  
<a name="REDIS_KEY"></a>

## REDIS\_KEY
Single active worker per Sensemaker node: one job at a time, FIFO queue.

- **Redis** (when `hub.redis` is connected): list key `sensemaker:active_worker_queue:v1` — RPUSH enqueue, LPOP dequeue.
- **Fallback**: in-memory array when Redis is unavailable.

When the worker has been **idle** for [IDLE_MS](IDLE_MS), the hub may run one **background task**
(oldest incomplete row in `tasks`) via [_processBackgroundTaskJob](#Sensemaker+_processBackgroundTaskJob).

**Kind**: global constant  
<a name="crypto"></a>

## crypto
Bridges OpenAI-compatible SSE (HTTP) with signed Fabric [Message](Message) frames for chat streaming.

- **HTTP edge**: `text/event-stream` lines `data: {JSON}\n\n` per OpenAI `chat.completion.chunk` / `[DONE]`.
- **Fabric bus**: [Message#fromVector](Message#fromVector) + [Message#signWithKey](Message#signWithKey) + `hub.http.broadcast`.

Subscribers should use [verifyStreamMessage](#verifyStreamMessage) with the hub’s public key.

**Kind**: global constant  
<a name="SESSION_PAYLOAD_MAX_CHARS"></a>

## SESSION\_PAYLOAD\_MAX\_CHARS
Max JSON characters for session payload (after base64 decode).

**Kind**: global constant  
<a name="TOKEN_KIND_SESSION"></a>

## TOKEN\_KIND\_SESSION
Value of signed payload field `cap`: identifies this blob as an HTTP session token.

**Kind**: global constant  
<a name="CAP_IDENTITY"></a>

## CAP\_IDENTITY
Session capabilities in `caps[]` (Token only; not Fabric opcodes).

**Kind**: global constant  
<a name="CAP_SESSION"></a>

## ~~CAP\_SESSION~~
***Use [TOKEN_KIND_SESSION](#TOKEN_KIND_SESSION); kept for callers that still read `CAP_SESSION`.***

**Kind**: global constant  
<a name="getRegistry"></a>

## getRegistry() ⇒ [<code>ServiceUIRegistry</code>](#ServiceUIRegistry)
Get the global Service UI Registry instance.

**Kind**: global function  
**Returns**: [<code>ServiceUIRegistry</code>](#ServiceUIRegistry) - Global registry instance  
<a name="browserPublicProcessEnv"></a>

## browserPublicProcessEnv() ⇒ <code>Record.&lt;string, string&gt;</code>
Public env subset for browser bundles only. Never pass `process.env` wholesale into
[webpack.DefinePlugin](webpack.DefinePlugin): webpack inlines the full JSON, which leaks host secrets
(npm/GitHub tokens, API keys, mnemonics) into `assets/bundles/browser.min.js` and trips
GitHub push protection.

**Kind**: global function  
<a name="requestUsesTools"></a>

## requestUsesTools()
True when the HTTP request carries non-empty tools (not `[]`, which is truthy in JS).

**Kind**: global function  
<a name="processSseLine"></a>

## processSseLine()
One SSE line: `data: {...}` (OpenAI-style) or bare JSON (native Ollama stream).
Mutates ctx.assembled / ctx.lastContent; calls ctx.onStreamChunk(delta) when provided.

**Kind**: global function  
<a name="stripThinkTags"></a>

## stripThinkTags()
Strip common model "reasoning" wrappers from final text.

**Kind**: global function  
<a name="consumeChatCompletionStream"></a>

## consumeChatCompletionStream()
Read a streaming chat/completions body (ReadableStream or full buffer as text).

**Kind**: global function  
<a name="parseChatCompletionJsonOrSse"></a>

## parseChatCompletionJsonOrSse()
Non-streaming body: single JSON object, or SSE lines if the server streamed anyway.

**Kind**: global function  
<a name="broadcastSignedFabric"></a>

## broadcastSignedFabric(hub, fabricType, payload) ⇒ <code>Message</code>
Build and sign a Fabric message, then broadcast on the HTTP bridge.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| hub | <code>object</code> | Sensemaker instance (`key`, `http.broadcast`) |
| fabricType | <code>string</code> | Vector type string (uses {@code ChatMessage} — a registered AMP opcode; {@code MessageChunk}/{@code MessageStart} are not wire-registered and decode as generic P2P frames) |
| payload | <code>object</code> | JSON-serializable body (stored as vector[1] string) |

<a name="verifyStreamMessage"></a>

## verifyStreamMessage(fabricMessage, key)
**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| fabricMessage | <code>Message</code> |  |
| key | <code>object</code> | Fabric key with `verify` / `verifySchnorrHash` (hub.key) |

<a name="openAiChatCompletionChunk"></a>

## openAiChatCompletionChunk()
OpenAI `chat.completion.chunk` object (one SSE JSON payload).

**Kind**: global function  
<a name="canonicalSessionPayload"></a>

## canonicalSessionPayload()
Canonical JSON for signing (stable key order and sorted role/cap arrays).

**Kind**: global function  
<a name="issueNodeSessionToken"></a>

## issueNodeSessionToken(nodeKey, opts)
**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| nodeKey | <code>Key</code> |  |
| opts | <code>object</code> |  |
| opts.subject | <code>string</code> \| <code>number</code> | user id |
| [opts.roles] | <code>Array.&lt;string&gt;</code> |  |
| [opts.isAdmin] | <code>boolean</code> | if true, includes [CAP_ADMIN](CAP_ADMIN) when DB also says admin at issuance |
| [opts.expiresInSeconds] | <code>number</code> |  |

<a name="verifyNodeSessionToken"></a>

## verifyNodeSessionToken(wire, nodeKey) ⇒ <code>object</code> \| <code>null</code>
**Kind**: global function  
**Returns**: <code>object</code> \| <code>null</code> - parsed payload fields (capabilities normalized to canonical strings)  

| Param | Type | Description |
| --- | --- | --- |
| wire | <code>string</code> | `base64url(payloadJson).base64url(sig)` |
| nodeKey | <code>Key</code> | verification uses this node's public key |

<a name="mergeVerifiedBearerTokens"></a>

## mergeVerifiedBearerTokens() ⇒ <code>Object</code> \| <code>null</code>
Verify one or more node-signed session tokens and merge roles/caps (same subject only).

**Kind**: global function  
<a name="capsIncludeAdmin"></a>

## capsIncludeAdmin(caps) ⇒ <code>boolean</code>
**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| caps | <code>Array.&lt;string&gt;</code> \| <code>undefined</code> | — canonical strings (e.g. after [verifyNodeSessionToken](#verifyNodeSessionToken)) |

<a name="ollamaBaseUrl"></a>

## ollamaBaseUrl()
Base URL for the configured Ollama instance (used to proxy tags/version).

**Kind**: global function  
<a name="buildPipelineFanOut"></a>

## buildPipelineFanOut()
Parallel LLM fan-out for [handleTextRequest](#Sensemaker+handleTextRequest).

Steps (same user template each time):
 1. Pool — one Ollama call per entry in `parallelModels` (different `model` tag).
 2. Trainer — optional RAG / retrieval QA (can be slow; disable in lean profile).
 3. Sensemaker — primary chat agent (same stack as final streamed summary).

Results are combined downstream via Promise.allSettled + filtering; the final
answer is produced by a separate streamed `sensemaker.query` summarization pass.

**Kind**: global function  
