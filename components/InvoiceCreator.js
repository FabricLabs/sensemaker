'use strict';

const React = require('react');
const { Button, Modal, Form, Message, Checkbox } = require('semantic-ui-react');
const FabricMessage = require('@fabric/core/types/message');

class InvoiceCreator extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      open: false,
      address: '',
      amount: '',
      currency: 'BTC',
      description: '',
      due_date: '',
      expiration_time: '',
      loading: false,
      error: null,
      success: null,
      generatingAddress: false,
      showAmount: false,
      pendingAddressResolve: null,
      pendingAddressReject: null
    };
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
    }
  }

  componentWillUnmount () {
    // Restore original handler
    if (this.props.bridge && this.originalHandler) {
      this.props.bridge.props.responseCapture = this.originalHandler;
    }
  }

  handleBridgeMessage = (message) => {
    console.debug('[INVOICE:CREATOR]', 'Received bridge message:', message);

    if (message.type === 'GenericMessage' && message.content) {
      // Handle deposit address response
      if (message.content.method === 'getUnusedAddress') {
        const address = message.content.result;
        console.debug('[INVOICE:CREATOR]', 'Received getUnusedAddress result:', address);
        this.setState({
          address,
          generatingAddress: false,
          error: null
        });

        // Resolve any pending promise
        if (this.state.pendingAddressResolve) {
          this.state.pendingAddressResolve(address);
          this.setState({
            pendingAddressResolve: null,
            pendingAddressReject: null
          });
        }
      }
      // Also try to parse content as JSON in case it's a different format
      else {
        try {
          const result = JSON.parse(message.content);
          console.debug('[INVOICE:CREATOR]', 'Parsed message content:', result);

          // Handle getUnusedAddress response (direct result)
          if (result.result) {
            const address = result.result;
            console.debug('[INVOICE:CREATOR]', 'Extracted address from result:', address);
            this.setState({
              address,
              generatingAddress: false,
              error: null
            });

            // Resolve any pending promise
            if (this.state.pendingAddressResolve) {
              this.state.pendingAddressResolve(address);
              this.setState({
                pendingAddressResolve: null,
                pendingAddressReject: null
              });
            }
          }
          // Handle JSONCallResult format
          else if (result.method === 'JSONCallResult' && result.params && result.params.length > 1) {
            const addressData = result.params[1];
            if (typeof addressData === 'object' && addressData.address) {
              const address = addressData.address;
              console.debug('[INVOICE:CREATOR]', 'Extracted address from JSONCallResult:', address);
              this.setState({
                address,
                generatingAddress: false,
                error: null
              });

              // Resolve any pending promise
              if (this.state.pendingAddressResolve) {
                this.state.pendingAddressResolve(address);
                this.setState({
                  pendingAddressResolve: null,
                  pendingAddressReject: null
                });
              }
            }
          }
        } catch (e) {
          console.debug('[INVOICE:CREATOR]', 'Content is not JSON, skipping parse');
        }
      }
    }
  };

  generateAddress = async () => {
    if (!this.props.bridge) {
      this.setState({
        error: 'Bridge not available for generating address',
        generatingAddress: false
      });
      return;
    }

    this.setState({ generatingAddress: true, error: null });

    try {
      // Create the RPC call payload
      const message = FabricMessage.fromVector(['JSONCall', JSON.stringify({
        method: 'getUnusedAddress',
        params: []
      })]);

      // Send message and wait for response using promise-based approach
      return new Promise((resolve, reject) => {
        // Set up promise handlers
        this.setState({
          pendingAddressResolve: resolve,
          pendingAddressReject: reject
        });

        const timeout = setTimeout(() => {
          console.error('[INVOICE:CREATOR]', 'Timeout waiting for address generation');
          this.setState({
            generatingAddress: false,
            error: 'Timeout waiting for address generation',
            pendingAddressResolve: null,
            pendingAddressReject: null
          });
          reject(new Error('Timeout waiting for address generation'));
        }, 15000); // 15 second timeout

        // Clean up timeout when promise resolves
        const originalResolve = resolve;
        this.setState({
          pendingAddressResolve: (address) => {
            clearTimeout(timeout);
            originalResolve(address);
          }
        });

        const originalReject = reject;
        this.setState({
          pendingAddressReject: (error) => {
            clearTimeout(timeout);
            originalReject(error);
          }
        });

        // Send the message
        console.debug('[INVOICE:CREATOR]', 'Sending getUnusedAddress message:', message);
        this.props.bridge.sendMessage(message.toBuffer());
      });
    } catch (error) {
      console.error('[INVOICE:CREATOR]', 'Failed to generate address:', error);
      this.setState({
        generatingAddress: false,
        error: error.message || 'Failed to generate address'
      });
      throw error;
    }
  };

  openModal = () => {
    this.setState({ open: true, error: null, success: null });
    // Auto-generate address when modal opens
    if (this.props.bridge) {
      this.generateAddress();
    }
  };

  closeModal = () => this.setState({
    open: false,
    address: '',
    amount: '',
    currency: 'BTC',
    description: '',
    due_date: '',
    expiration_time: '',
    loading: false,
    error: null,
    success: null,
    generatingAddress: false,
    showAmount: false,
    pendingAddressResolve: null,
    pendingAddressReject: null
  });

  handleChange = (e, { name, value }) => this.setState({ [name]: value });

  handleSubmit = async () => {
    const { address, amount, currency, description, due_date, expiration_time } = this.state;
    this.setState({ loading: true, error: null, success: null });
    try {
      const res = await fetch('/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, amount, currency, description, due_date, expiration_time })
      });
      if (!res.ok) throw new Error('Failed to create invoice');
      this.setState({ loading: false, success: 'Invoice created!', open: false });
      if (this.props.onSuccess) this.props.onSuccess();
    } catch (err) {
      this.setState({ loading: false, error: err.message });
    }
  };

  render () {
    const { open, address, amount, currency, description, due_date, expiration_time, loading, error, success, generatingAddress, showAmount } = this.state;
    return (
      <React.Fragment>
        <Button color='violet' icon='file invoice' content='Create Invoice' onClick={this.openModal} style={{ marginBottom: '1em' }} />
        <Modal open={open} onClose={this.closeModal} size='small'>
          <Modal.Header>Create Invoice</Modal.Header>
          <Modal.Content>
            <Form loading={loading} error={!!error} success={!!success} onSubmit={this.handleSubmit}>
              <Form.Field>
                <label>Address</label>
                <div style={{ display: 'flex', gap: '0.5em', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Form.Input
                      name='address'
                      value={address}
                      onChange={this.handleChange}
                      required
                      placeholder="Generating address..."
                      loading={generatingAddress}
                      fluid
                    />
                  </div>
                  {this.props.bridge && (
                    <Button
                      icon='refresh'
                      loading={generatingAddress}
                      onClick={this.generateAddress}
                      disabled={generatingAddress}
                      title="Generate new address"
                      style={{ flexShrink: 0 }}
                    />
                  )}
                </div>
              </Form.Field>

              <Form.Field>
                <Checkbox
                  label="Set specific amount"
                  checked={showAmount}
                  onChange={(e, { checked }) => this.setState({ showAmount: checked })}
                />
              </Form.Field>

              {showAmount && (
                <Form.Input
                  label='Amount'
                  name='amount'
                  value={amount}
                  onChange={this.handleChange}
                  type='number'
                  step='0.01'
                  placeholder="Enter amount in BTC"
                />
              )}

              {/* Hidden currency field - always BTC */}
              <input type="hidden" name="currency" value={currency} />

              <Form.TextArea label='Description' name='description' value={description} onChange={this.handleChange} />
              <Form.Input label='Due Date' name='due_date' value={due_date} onChange={this.handleChange} type='date' />
              <Form.Input label='Expiration Date' name='expiration_time' value={expiration_time} onChange={this.handleChange} type='date' />
              <Message error content={error} />
              <Message success content={success} />
            </Form>
          </Modal.Content>
          <Modal.Actions>
            <Button onClick={this.closeModal}>Cancel</Button>
            <Button primary onClick={this.handleSubmit} loading={loading} disabled={loading}>Create</Button>
          </Modal.Actions>
        </Modal>
      </React.Fragment>
    );
  }
}

module.exports = InvoiceCreator;
