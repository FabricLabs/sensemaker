'use strict';

const React = require('react');
const {
  Button,
  Icon,
  Popup,
  Segment
} = require('semantic-ui-react');

const { toast } = require('../functions/toast');
const FabricMessage = require('@fabric/core/types/message');

/**
 * Reusable component for displaying and managing Bitcoin deposit addresses
 * Handles fetching, displaying, and copying deposit addresses with unified logic
 */
class DepositAddress extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      address: null,
      loading: false,
      error: null
    };

    // Promise handlers for address fetching
    this.pendingAddressResolve = null;
    this.pendingAddressReject = null;
  }

  componentDidMount () {
    // Set up bridge message handler if bridge is available
    if (this.props.bridge) {
      // Store original handler to chain calls
      this.originalHandler = this.props.bridge.props.responseCapture;
      this.props.bridge.props.responseCapture = (msg) => {
        this.handleBridgeMessage(msg);
        if (this.originalHandler) this.originalHandler(msg);
      };

      // Auto-fetch if requested
      if (this.props.autoFetch) {
        this.fetchDepositAddress().catch(error => {
          console.error('[DEPOSIT:ADDRESS]', 'Auto-fetch failed:', error);
        });
      }
    }
  }

  componentWillUnmount () {
    // Restore original handler
    if (this.props.bridge && this.originalHandler) {
      this.props.bridge.props.responseCapture = this.originalHandler;
    }

    // Clean up pending promises
    if (this.pendingAddressReject) {
      this.pendingAddressReject(new Error('Component unmounted'));
      this.pendingAddressResolve = null;
      this.pendingAddressReject = null;
    }
  }

  handleBridgeMessage = (message) => {
    console.debug('[DEPOSIT:ADDRESS]', 'Received bridge message:', message);

    if (message.type === 'GenericMessage' && message.content) {
      // Handle deposit address response
      if (message.content.method === 'getUnusedAddress') {
        const address = message.content.result;
        console.debug('[DEPOSIT:ADDRESS]', 'Received getUnusedAddress result:', address);
        this.setState({
          address,
          loading: false,
          error: null
        });

        // Call onAddressFetched callback if provided
        if (this.props.onAddressFetched) {
          this.props.onAddressFetched(address);
        }

        // Resolve any pending promise
        if (this.pendingAddressResolve) {
          this.pendingAddressResolve(address);
          this.pendingAddressResolve = null;
          this.pendingAddressReject = null;
        }
      }
      // Also try to parse content as JSON in case it's a different format
      else {
        try {
          const result = JSON.parse(message.content);
          console.debug('[DEPOSIT:ADDRESS]', 'Parsed message content:', result);

          // Handle getUnusedAddress response (direct result)
          if (result.result) {
            const address = result.result;
            console.debug('[DEPOSIT:ADDRESS]', 'Extracted address from result:', address);
            this.setState({
              address,
              loading: false,
              error: null
            });

            // Call onAddressFetched callback if provided
            if (this.props.onAddressFetched) {
              this.props.onAddressFetched(address);
            }

            // Resolve any pending promise
            if (this.pendingAddressResolve) {
              this.pendingAddressResolve(address);
              this.pendingAddressResolve = null;
              this.pendingAddressReject = null;
            }
          }
          // Handle JSONCallResult format
          else if (result.method === 'JSONCallResult' && result.params && result.params.length > 1) {
            const addressData = result.params[1];
            if (typeof addressData === 'object' && addressData.address) {
              const address = addressData.address;
              console.debug('[DEPOSIT:ADDRESS]', 'Extracted address from JSONCallResult:', address);
              this.setState({
                address,
                loading: false,
                error: null
              });

              // Call onAddressFetched callback if provided
              if (this.props.onAddressFetched) {
                this.props.onAddressFetched(address);
              }

              // Resolve any pending promise
              if (this.pendingAddressResolve) {
                this.pendingAddressResolve(address);
                this.pendingAddressResolve = null;
                this.pendingAddressReject = null;
              }
            }
          }
        } catch (e) {
          console.debug('[DEPOSIT:ADDRESS]', 'Content is not JSON, skipping parse');
        }
      }
    }
  };

  fetchDepositAddress = async () => {
    if (!this.props.bridge) {
      const error = new Error('Bridge not available for fetching deposit address');
      console.error('[DEPOSIT:ADDRESS]', error.message);
      this.setState({ error: error.message, loading: false });
      throw error;
    }

    this.setState({ loading: true, error: null });

    try {
      // Create the RPC call payload
      const message = FabricMessage.fromVector(['JSONCall', JSON.stringify({
        method: 'getUnusedAddress',
        params: []
      })]);

      // Send message and wait for response using permanent handler
      return new Promise((resolve, reject) => {
        // Set up promise handlers for the permanent bridge message handler
        this.pendingAddressResolve = resolve;
        this.pendingAddressReject = reject;

        const timeout = setTimeout(() => {
          console.error('[DEPOSIT:ADDRESS]', 'Timeout waiting for deposit address');
          this.setState({
            loading: false,
            error: 'Timeout waiting for deposit address'
          });
          this.pendingAddressResolve = null;
          this.pendingAddressReject = null;
          reject(new Error('Timeout waiting for deposit address'));
        }, 10000); // 10 second timeout

        // Clean up timeout when promise resolves
        const originalResolve = resolve;
        this.pendingAddressResolve = (address) => {
          clearTimeout(timeout);
          originalResolve(address);
        };

        const originalReject = reject;
        this.pendingAddressReject = (error) => {
          clearTimeout(timeout);
          originalReject(error);
        };

        // Send the message
        console.debug('[DEPOSIT:ADDRESS]', 'Sending getUnusedAddress message:', message);
        this.props.bridge.sendMessage(message.toBuffer());
      });
    } catch (error) {
      console.error('[DEPOSIT:ADDRESS]', 'Failed to fetch deposit address:', error);
      this.setState({
        loading: false,
        error: error.message || 'Failed to fetch deposit address'
      });
      throw error;
    }
  };

  handleCopyAddress = async () => {
    if (!this.state.address) return;

    try {
      await navigator.clipboard.writeText(this.state.address);
      toast.success('Address copied to clipboard!', {
        position: 'bottom-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (err) {
      console.error('Failed to copy address:', err);
      toast.error('Failed to copy address. Please try again.', {
        position: 'bottom-right',
        autoClose: 4000,
      });
    }
  };

  render () {
    const {
      showLabel = true,
      style = {},
      segmentStyle = {},
      compact = false
    } = this.props;

    const { address, loading, error } = this.state;

    const defaultSegmentStyle = {
      backgroundColor: '#f8f9fa',
      textAlign: 'center',
      ...segmentStyle
    };

    return (
      <div style={style}>
        {showLabel && !compact && (
          <p>Send Bitcoin to this address:</p>
        )}

        <Segment style={defaultSegmentStyle}>
          {loading ? (
            <div>
              <Icon loading name="spinner" />
              Generating deposit address...
            </div>
          ) : error ? (
            <div style={{ color: '#d32f2f' }}>
              <Icon name="exclamation triangle" />
              {error}
              {this.props.bridge && (
                <div style={{ marginTop: '0.5em' }}>
                  <Button size="small" onClick={this.fetchDepositAddress}>
                    Retry
                  </Button>
                </div>
              )}
            </div>
          ) : address ? (
            <div>
              <code style={{
                fontSize: compact ? '0.9em' : '1.1em',
                padding: '0.5em',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                wordBreak: 'break-all'
              }}>
                {address}
              </code>
              <Popup
                trigger={
                  <Button
                    icon
                    basic
                    size={compact ? "tiny" : "mini"}
                    style={{ marginLeft: '1em' }}
                    onClick={this.handleCopyAddress}
                  >
                    <Icon name="copy" />
                  </Button>
                }
                content="Copy address to clipboard"
                position="top center"
              />
            </div>
          ) : (
            <div>
              No address available
              {this.props.bridge && (
                <div style={{ marginTop: '0.5em' }}>
                  <Button primary size="small" onClick={this.fetchDepositAddress}>
                    Generate Address
                  </Button>
                </div>
              )}
            </div>
          )}
        </Segment>
      </div>
    );
  }
}

module.exports = DepositAddress;