## Classes

<dl>
<dt><a href="#Agent">Agent</a></dt>
<dd><p>The Agent service is responsible for managing an AI agent.  AI agents are self-contained actors which emit messages to a subscriber, which may be a human or another AI agent.</p>
</dd>
<dt><a href="#Clock">Clock</a> : <code>Object</code></dt>
<dd><p>Simple clock.  Emits <code>tick</code> events at a specified interval.</p>
</dd>
<dt><a href="#Compiler">Compiler</a></dt>
<dd><p>Builder for <a href="Fabric">Fabric</a>-based applications.</p>
</dd>
<dt><a href="#Learner">Learner</a></dt>
<dd><p>Basic neural network support.</p>
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
<dt><a href="#CourtListener">CourtListener</a> ⇐ <code>Service</code></dt>
<dd><p>CourtListener is a service for interacting with the CourtListener database.</p>
</dd>
<dt><a href="#Jeeves">Jeeves</a> : <code>Object</code></dt>
<dd><p>Jeeves is a Fabric-powered application, capable of running autonomously
once started by the user.  By default, earnings are enabled.</p>
</dd>
<dt><a href="#Mistral">Mistral</a> : <code><a href="#Mistral">Mistral</a></code></dt>
<dd><p>HTTP-based Mistral client.</p>
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

<a name="Clock"></a>

## Clock : <code>Object</code>
Simple clock.  Emits `tick` events at a specified interval.

**Kind**: global class  
<a name="Compiler"></a>

## Compiler
Builder for [Fabric](Fabric)-based applications.

**Kind**: global class  
<a name="new_Compiler_new"></a>

### new Compiler([settings])
Create an instance of the compiler.


| Param | Type | Description |
| --- | --- | --- |
| [settings] | <code>Object</code> | Map of settings. |
| [settings.document] | <code>HTTPComponent</code> | Document to use. |

<a name="Learner"></a>

## Learner
Basic neural network support.

**Kind**: global class  

* [Learner](#Learner)
    * [new Learner([settings])](#new_Learner_new)
    * [.readChunk(address)](#Learner+readChunk) ⇒ <code>Buffer</code>
    * [.writeChunk(address, value)](#Learner+writeChunk) ⇒ <code>Number</code>

<a name="new_Learner_new"></a>

### new Learner([settings])
Create a neural network.

**Returns**: [<code>Learner</code>](#Learner) - Instance of the network.  

| Param | Type | Description |
| --- | --- | --- |
| [settings] | <code>Object</code> | Settings for the network. |

<a name="Learner+readChunk"></a>

### learner.readChunk(address) ⇒ <code>Buffer</code>
Read a memory cell.

**Kind**: instance method of [<code>Learner</code>](#Learner)  
**Returns**: <code>Buffer</code> - Value of the memory cell.  

| Param | Type | Description |
| --- | --- | --- |
| address | <code>Number</code> | Address of the cell. |

<a name="Learner+writeChunk"></a>

### learner.writeChunk(address, value) ⇒ <code>Number</code>
Write a buffer to memory.

**Kind**: instance method of [<code>Learner</code>](#Learner)  
**Returns**: <code>Number</code> - Number of bytes written to the cell.  

| Param | Type | Description |
| --- | --- | --- |
| address | <code>Number</code> | Address of the cell. |
| value | <code>Buffer</code> | Data to write to memory. |

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
<a name="CourtListener"></a>

## CourtListener ⇐ <code>Service</code>
CourtListener is a service for interacting with the CourtListener database.

**Kind**: global class  
**Extends**: <code>Service</code>  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [settings] | <code>Object</code> | Configuration for the service. |

<a name="Jeeves"></a>

## Jeeves : <code>Object</code>
Jeeves is a Fabric-powered application, capable of running autonomously
once started by the user.  By default, earnings are enabled.

**Kind**: global class  
**Extends**: <code>Service</code>  

* [Jeeves](#Jeeves) : <code>Object</code>
    * [new Jeeves([settings])](#new_Jeeves_new)
    * [.createAgent(configuration)](#Jeeves+createAgent) ⇒ [<code>Agent</code>](#Agent)
    * [.createTimedRequest(request, [timeout], [depth])](#Jeeves+createTimedRequest) ⇒ <code>Message</code>
    * [.start()](#Jeeves+start) ⇒ <code>Promise</code>
    * [.stop()](#Jeeves+stop) ⇒ <code>Promise</code>
    * [._getRoomMessages()](#Jeeves+_getRoomMessages) ⇒ <code>Array</code>
    * [._handleRequest(request)](#Jeeves+_handleRequest) ⇒ <code>JeevesResponse</code>

<a name="new_Jeeves_new"></a>

### new Jeeves([settings])
Constructor for the Jeeves application.

**Returns**: [<code>Jeeves</code>](#Jeeves) - Resulting instance of Jeeves.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [settings] | <code>Object</code> | <code>{}</code> | Map of configuration values. |
| [settings.port] | <code>Number</code> | <code>7777</code> | Fabric messaging port. |

<a name="Jeeves+createAgent"></a>

### jeeves.createAgent(configuration) ⇒ [<code>Agent</code>](#Agent)
Creates (and registers) a new [Agent](#Agent) instance.

**Kind**: instance method of [<code>Jeeves</code>](#Jeeves)  
**Returns**: [<code>Agent</code>](#Agent) - Instance of the [Agent](#Agent).  

| Param | Type | Description |
| --- | --- | --- |
| configuration | <code>Object</code> | Settings for the [Agent](#Agent). |

<a name="Jeeves+createTimedRequest"></a>

### jeeves.createTimedRequest(request, [timeout], [depth]) ⇒ <code>Message</code>
Execute the default pipeline for an inbound request.

**Kind**: instance method of [<code>Jeeves</code>](#Jeeves)  
**Returns**: <code>Message</code> - Request as a Fabric [Message](Message).  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| request | <code>Object</code> |  | Request object. |
| [timeout] | <code>Number</code> |  | How long to wait for a response. |
| [depth] | <code>Number</code> | <code>0</code> | How many times to recurse. |

<a name="Jeeves+start"></a>

### jeeves.start() ⇒ <code>Promise</code>
Start the process.

**Kind**: instance method of [<code>Jeeves</code>](#Jeeves)  
**Returns**: <code>Promise</code> - Resolves once the process has been started.  
<a name="Jeeves+stop"></a>

### jeeves.stop() ⇒ <code>Promise</code>
Stop the process.

**Kind**: instance method of [<code>Jeeves</code>](#Jeeves)  
**Returns**: <code>Promise</code> - Resolves once the process has been stopped.  
<a name="Jeeves+_getRoomMessages"></a>

### jeeves.\_getRoomMessages() ⇒ <code>Array</code>
Retrieve a conversation's messages.

**Kind**: instance method of [<code>Jeeves</code>](#Jeeves)  
**Returns**: <code>Array</code> - List of the conversation's messages.  
<a name="Jeeves+_handleRequest"></a>

### jeeves.\_handleRequest(request) ⇒ <code>JeevesResponse</code>
Generate a response to a request.

**Kind**: instance method of [<code>Jeeves</code>](#Jeeves)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>JeevesRequest</code> | The request. |
| [request.room] | <code>String</code> | Matrix room to retrieve conversation history from. |

<a name="Mistral"></a>

## Mistral : [<code>Mistral</code>](#Mistral)
HTTP-based Mistral client.

**Kind**: global class  
**Extends**: <code>Service</code>  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| settings | <code>Object</code> |  |
| fabric | <code>Peer</code> | The Fabric Core peer. |
| remote | <code>HTTPClient</code> | The Mistral remote. |
| engine | <code>Object</code> | The Mistral engine. |
| state | <code>Object</code> | The Mistral state. |

