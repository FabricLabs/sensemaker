## Classes

<dl>
<dt><a href="#Agent">Agent</a></dt>
<dd><p>The Agent service is responsible for managing an AI agent.  AI agents are self-contained actors which emit messages to a subscriber, which may be a human or another AI agent.</p>
</dd>
<dt><a href="#Bundler">Bundler</a></dt>
<dd><p>Builder for <a href="Fabric">Fabric</a>-based applications.</p>
</dd>
<dt><a href="#Clock">Clock</a> : <code>Object</code></dt>
<dd><p>Simple clock.  Emits <code>tick</code> events at a specified interval.</p>
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
<dt><a href="#InMemoryVectorStore">InMemoryVectorStore</a></dt>
<dd><p>Simple in-memory vector store for testing and development.</p>
</dd>
<dt><a href="#Trainer">Trainer</a></dt>
<dd><p>Implements document ingestion.</p>
</dd>
<dt><a href="#Worker">Worker</a></dt>
<dd><p>Worker service.</p>
</dd>
<dt><a href="#FabricNetwork">FabricNetwork</a></dt>
<dd><p>Defines the Fabric interface for Sensemaker.</p>
</dd>
<dt><a href="#Sensemaker">Sensemaker</a> : <code>Object</code></dt>
<dd><p>Sensemaker is the primary instance of the AI.</p>
</dd>
</dl>

<a name="Agent"></a>

## Agent
The Agent service is responsible for managing an AI agent.  AI agents are self-contained actors which emit messages to a subscriber, which may be a human or another AI agent.

**Kind**: global class  

* [Agent](#Agent)
    * [new Agent([settings])](#new_Agent_new)
    * [.query(request)](#Agent+query) ⇒ <code>AgentResponse</code>

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

<a name="Bundler"></a>

## Bundler
Builder for [Fabric](Fabric)-based applications.

**Kind**: global class  
<a name="new_Bundler_new"></a>

### new Bundler([settings])
Create an instance of the bundler.


| Param | Type | Description |
| --- | --- | --- |
| [settings] | <code>Object</code> | Map of settings. |
| [settings.document] | <code>HTTPComponent</code> | Document to use. |

<a name="Clock"></a>

## Clock : <code>Object</code>
Simple clock.  Emits `tick` events at a specified interval.

**Kind**: global class  
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
<a name="InMemoryVectorStore"></a>

## InMemoryVectorStore
Simple in-memory vector store for testing and development.

**Kind**: global class  
<a name="Trainer"></a>

## Trainer
Implements document ingestion.

**Kind**: global class  

* [Trainer](#Trainer)
    * [.ingestDirectory(directory)](#Trainer+ingestDirectory) ⇒ <code>Promise</code>
    * [.ingestDocument(document, type)](#Trainer+ingestDocument) ⇒ <code>Promise</code>
    * [.search(request)](#Trainer+search) ⇒ <code>Promise</code>

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

<a name="Trainer+search"></a>

### trainer.search(request) ⇒ <code>Promise</code>
Search the document store.

**Kind**: instance method of [<code>Trainer</code>](#Trainer)  
**Returns**: <code>Promise</code> - Resolves with the result of the operation.  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Search object. |

<a name="Worker"></a>

## Worker
Worker service.

**Kind**: global class  
<a name="FabricNetwork"></a>

## FabricNetwork
Defines the Fabric interface for Sensemaker.

**Kind**: global class  
<a name="new_FabricNetwork_new"></a>

### new FabricNetwork([settings])
Create an instance of the service.

**Returns**: <code>FabricService</code> - A new instance of the service.  

| Param | Type | Description |
| --- | --- | --- |
| [settings] | <code>Object</code> | Settings for the service. |

<a name="Sensemaker"></a>

## Sensemaker : <code>Object</code>
Sensemaker is the primary instance of the AI.

**Kind**: global class  
**Extends**: <code>Service</code>  

* [Sensemaker](#Sensemaker) : <code>Object</code>
    * [new Sensemaker([settings])](#new_Sensemaker_new)
    * [.combinationsOf(tokens, prefix)](#Sensemaker+combinationsOf) ⇒ <code>Array</code>
    * [.createAgent(configuration)](#Sensemaker+createAgent) ⇒ [<code>Agent</code>](#Agent)
    * [.estimateTokens(input)](#Sensemaker+estimateTokens) ⇒ <code>Number</code>
    * [.importantPhrases(input, limit)](#Sensemaker+importantPhrases) ⇒ <code>Array</code>
    * [.importantWords(input, limit)](#Sensemaker+importantWords) ⇒ <code>Array</code>
    * [.properNouns(input)](#Sensemaker+properNouns) ⇒ <code>Array</code>
    * [.uniqueWords(input)](#Sensemaker+uniqueWords) ⇒ <code>Array</code>
    * [.alert(message)](#Sensemaker+alert) ⇒ <code>Boolean</code>
    * [.handleTextRequest(request)](#Sensemaker+handleTextRequest) ⇒ <code>Promise</code>
    * [.retrieveFile(id)](#Sensemaker+retrieveFile) ⇒ <code>Object</code>
    * [.start()](#Sensemaker+start) ⇒ <code>Promise</code>
    * [.stop()](#Sensemaker+stop) ⇒ <code>Promise</code>
    * [.syncSource(id)](#Sensemaker+syncSource) ⇒ <code>Promise</code>
    * [._getRoomMessages()](#Sensemaker+_getRoomMessages) ⇒ <code>Array</code>
    * [._handleRequest(request)](#Sensemaker+_handleRequest) ⇒ <code>SensemakerResponse</code>
    * [.verifyMessage(signedMessage)](#Sensemaker+verifyMessage) ⇒ <code>Boolean</code>

<a name="new_Sensemaker_new"></a>

### new Sensemaker([settings])
Constructor for the Sensemaker instance.

**Returns**: [<code>Sensemaker</code>](#Sensemaker) - Resulting instance of Sensemaker.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [settings] | <code>Object</code> | <code>{}</code> | Map of configuration values. |
| [settings.seed] | <code>Number</code> |  | 12 or 24 word mnemonic seed. |
| [settings.port] | <code>Number</code> | <code>7777</code> | Fabric messaging port. |

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

<a name="Sensemaker+start"></a>

### sensemaker.start() ⇒ <code>Promise</code>
Start the process.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
**Returns**: <code>Promise</code> - Resolves once the process has been started.  
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

<a name="Sensemaker+verifyMessage"></a>

### sensemaker.verifyMessage(signedMessage) ⇒ <code>Boolean</code>
Verifies a signed message

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
**Returns**: <code>Boolean</code> - - Whether the signature is valid  

| Param | Type | Description |
| --- | --- | --- |
| signedMessage | <code>Object</code> | The signed message object |

