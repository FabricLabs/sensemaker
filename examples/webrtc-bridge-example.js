'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const Bridge = require('../components/Bridge');

/**
 * Example demonstrating WebRTC-enabled Bridge component usage
 */
class WebRTCBridgeExample extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      connectionStatus: null,
      messages: []
    };
    
    // Create a ref to access the Bridge component
    this.bridgeRef = React.createRef();
  }

  componentDidMount() {
    // Set up message handler for the bridge
    if (this.bridgeRef.current) {
      this.bridgeRef.current.onMessage = this.handleBridgeMessage.bind(this);
    }
  }

  handleBridgeMessage = (message) => {
    console.log('[EXAMPLE]', 'Received message:', message);
    this.setState(prevState => ({
      messages: [...prevState.messages, message]
    }));
  };

  // Get connection status
  checkConnectionStatus = () => {
    if (this.bridgeRef.current) {
      const status = this.bridgeRef.current.getConnectionStatus();
      this.setState({ connectionStatus: status });
      console.log('[EXAMPLE]', 'Connection status:', status);
    }
  };

  // Send a test message via WebRTC (preferred)
  sendTestMessageWebRTC = () => {
    if (this.bridgeRef.current) {
      const testMessage = {
        type: 'TEST_MESSAGE',
        content: 'Hello from WebRTC!',
        timestamp: Date.now()
      };
      
      console.log('[EXAMPLE]', 'Sending message via WebRTC...');
      this.bridgeRef.current.sendViaWebRTC(Buffer.from(JSON.stringify(testMessage)));
    }
  };

  // Send a test message via WebSocket (fallback)
  sendTestMessageWebSocket = () => {
    if (this.bridgeRef.current) {
      const testMessage = {
        type: 'TEST_MESSAGE',
        content: 'Hello from WebSocket!',
        timestamp: Date.now()
      };
      
      console.log('[EXAMPLE]', 'Sending message via WebSocket...');
      this.bridgeRef.current.sendViaWebSocket(Buffer.from(JSON.stringify(testMessage)));
    }
  };

  // Reconnect WebRTC if needed
  reconnectWebRTC = () => {
    if (this.bridgeRef.current) {
      console.log('[EXAMPLE]', 'Attempting WebRTC reconnection...');
      this.bridgeRef.current.reconnectWebRTC();
    }
  };

  render() {
    const { connectionStatus, messages } = this.state;

    return (
      <div style={{ padding: '20px' }}>
        <h1>WebRTC-Enabled Bridge Example</h1>
        
        {/* Bridge Component */}
        <Bridge
          ref={this.bridgeRef}
          debug={true}
          host="localhost"
          port={7777}
          secure={false}
        />
        
        {/* Controls */}
        <div style={{ margin: '20px 0' }}>
          <button onClick={this.checkConnectionStatus}>
            Check Connection Status
          </button>
          <button onClick={this.sendTestMessageWebRTC} style={{ marginLeft: '10px' }}>
            Send via WebRTC
          </button>
          <button onClick={this.sendTestMessageWebSocket} style={{ marginLeft: '10px' }}>
            Send via WebSocket
          </button>
          <button onClick={this.reconnectWebRTC} style={{ marginLeft: '10px' }}>
            Reconnect WebRTC
          </button>
        </div>

        {/* Connection Status Display */}
        {connectionStatus && (
          <div style={{ backgroundColor: '#f0f0f0', padding: '10px', margin: '10px 0' }}>
            <h3>Connection Status:</h3>
            <div>
              <strong>WebSocket:</strong> {connectionStatus.websocket.connected ? '✅' : '❌'} 
              {connectionStatus.websocket.readyState !== null && ` (State: ${connectionStatus.websocket.readyState})`}
            </div>
            <div>
              <strong>WebRTC:</strong> {connectionStatus.webrtc.connected ? '✅' : '❌'}
              {connectionStatus.webrtc.peerId && ` (ID: ${connectionStatus.webrtc.peerId})`}
              {connectionStatus.webrtc.serverConnection && ` → ${connectionStatus.webrtc.serverConnection}`}
            </div>
            <div>
              <strong>Preferred Protocol:</strong> {connectionStatus.preferredProtocol}
            </div>
          </div>
        )}

        {/* Messages Display */}
        <div style={{ backgroundColor: '#f9f9f9', padding: '10px', margin: '10px 0' }}>
          <h3>Messages ({messages.length}):</h3>
          <div style={{ maxHeight: '200px', overflow: 'auto' }}>
            {messages.slice(-10).map((message, index) => (
              <div key={index} style={{ fontFamily: 'monospace', fontSize: '12px', margin: '5px 0' }}>
                {JSON.stringify(message, null, 2)}
              </div>
            ))}
          </div>
        </div>

        {/* Usage Information */}
        <div style={{ backgroundColor: '#e8f5e8', padding: '15px', margin: '20px 0' }}>
          <h3>How to Use:</h3>
          <ol>
            <li><strong>Connection:</strong> The Bridge automatically connects via both WebSocket and WebRTC</li>
            <li><strong>Sending Messages:</strong> Use `sendViaWebRTC()` to prefer WebRTC, or `sendViaWebSocket()` for WebSocket</li>
            <li><strong>Automatic Fallback:</strong> If WebRTC fails, messages automatically fall back to WebSocket</li>
            <li><strong>Status Monitoring:</strong> Use `getConnectionStatus()` to check both connection states</li>
            <li><strong>Reconnection:</strong> Use `reconnectWebRTC()` to restore WebRTC connectivity if lost</li>
          </ol>
        </div>
      </div>
    );
  }
}

// Export for use in other modules
module.exports = WebRTCBridgeExample;

// Render if this is the main module
if (typeof window !== 'undefined') {
  ReactDOM.render(<WebRTCBridgeExample />, document.getElementById('app'));
} 