## Classes

<dl>
<dt><a href="#Clock">Clock</a> : <code>Object</code></dt>
<dd><p>Simple clock.  Emits <code>tick</code> events at a specified interval.</p>
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
<a name="Sensemaker"></a>

## Sensemaker : <code>Object</code>
Sensemaker is a Fabric-powered application, capable of running autonomously
once started by the user.  By default, earnings are enabled.

**Kind**: global class  
**Extends**: <code>Service</code>  

* [Sensemaker](#Sensemaker) : <code>Object</code>
    * [new Sensemaker([settings])](#new_Sensemaker_new)
    * [.trust(source)](#Sensemaker+trust) ⇒ [<code>Sensemaker</code>](#Sensemaker)
    * [.start()](#Sensemaker+start) ⇒ <code>Promise</code>
    * [.stop()](#Sensemaker+stop) ⇒ <code>Promise</code>

<a name="new_Sensemaker_new"></a>

### new Sensemaker([settings])
Constructor for the Sensemaker application.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [settings] | <code>Object</code> | <code>{}</code> | Map of configuration values. |
| [settings.port] | <code>Number</code> | <code>7777</code> | Fabric messaging port. |

<a name="Sensemaker+trust"></a>

### sensemaker.trust(source) ⇒ [<code>Sensemaker</code>](#Sensemaker)
Explicitly trust all events from a known source.

**Kind**: instance method of [<code>Sensemaker</code>](#Sensemaker)  
**Returns**: [<code>Sensemaker</code>](#Sensemaker) - Instance of Sensemaker after binding events.  

| Param | Type | Description |
| --- | --- | --- |
| source | <code>EventEmitter</code> | Emitter of events. |

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
