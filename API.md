## Classes

<dl>
<dt><a href="#Clock">Clock</a> : <code>Object</code></dt>
<dd><p>Simple clock.  Emits <code>tick</code> events at a specified interval.</p>
</dd>
<dt><a href="#Learner">Learner</a></dt>
<dd><p>Basic neural network support.</p>
</dd>
<dt><a href="#Sensemaker">Sensemaker</a> : <code>Object</code></dt>
<dd><p>Sensemaker is a Fabric-powered application, capable of running autonomously
once started by the user.  By default, earnings are enabled.</p>
</dd>
</dl>

<a name="Clock"></a>

## Clock : <code>Object</code>
Simple clock.  Emits `tick` events at a specified interval.

**Kind**: global class  
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

<a name="Sensemaker"></a>

## Sensemaker : <code>Object</code>
Sensemaker is a Fabric-powered application, capable of running autonomously
once started by the user.  By default, earnings are enabled.

**Kind**: global class  
**Extends**: <code>Service</code>  

* [Sensemaker](#Sensemaker) : <code>Object</code>
    * [new Sensemaker([settings])](#new_Sensemaker_new)
    * [.start()](#Sensemaker+start) ⇒ <code>Promise</code>
    * [.stop()](#Sensemaker+stop) ⇒ <code>Promise</code>

<a name="new_Sensemaker_new"></a>

### new Sensemaker([settings])
Constructor for the Sensemaker application.

**Returns**: [<code>Sensemaker</code>](#Sensemaker) - Resulting instance of Sensemaker.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [settings] | <code>Object</code> | <code>{}</code> | Map of configuration values. |
| [settings.port] | <code>Number</code> | <code>7777</code> | Fabric messaging port. |

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
