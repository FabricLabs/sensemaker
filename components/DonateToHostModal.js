'use strict';

const React = require('react');
const {
  Modal,
  Button,
  Form,
  Input,
  Message,
  Icon
} = require('semantic-ui-react');

const { BRAND_NAME } = require('../constants');

class DonateToHostModal extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      amountBtc: '0.0001',
      loading: false,
      loadingMeta: false,
      error: null,
      success: null,
      nodeName: '',
      address: '',
      network: 'regtest'
    };
  }

  componentDidUpdate (prevProps) {
    if (this.props.open && !prevProps.open) {
      this.loadMeta();
    }
  }

  loadMeta = async () => {
    const token = this.props.token;
    if (!token) return;
    this.setState({ loadingMeta: true, error: null, success: null });
    try {
      const r = await fetch('/workers/playnet-receive-address', {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      this.setState({
        nodeName: data.nodeName || BRAND_NAME,
        address: data.address || '',
        network: data.network || 'regtest',
        loadingMeta: false
      });
    } catch (e) {
      this.setState({ loadingMeta: false, error: e.message || String(e) });
    }
  };

  handleDonate = async () => {
    const token = this.props.token;
    const amt = parseFloat(String(this.state.amountBtc || '').replace(',', '.'), 10);
    if (!Number.isFinite(amt) || amt <= 0) {
      this.setState({ error: 'Enter a positive BTC amount.' });
      return;
    }
    const amountSats = Math.round(amt * 1e8);
    if (amountSats < 546) {
      this.setState({ error: 'Amount must be at least 546 satoshis.' });
      return;
    }
    this.setState({ loading: true, error: null, success: null });
    try {
      const r = await fetch('/workers/donate-playnet', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ amountSats })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      this.setState({
        loading: false,
        success: `Sent ${amountSats} sats on playnet. txid: ${data.txid || '(unknown)'}`
      });
      if (typeof this.props.onSuccess === 'function') this.props.onSuccess(data);
    } catch (e) {
      this.setState({ loading: false, error: e.message || String(e) });
    }
  };

  render () {
    const { open, onClose } = this.props;
    const { amountBtc, loading, loadingMeta, error, success, nodeName, address, network } = this.state;
    return (
      <Modal open={open} onClose={onClose} size="small">
        <Modal.Header>
          <Icon name="bitcoin" /> Donate to this host (playnet)
        </Modal.Header>
        <Modal.Content>
          <p style={{ marginBottom: '1em' }}>
            Your account uses this site as a <strong>single host node</strong>
            {nodeName ? <> named <strong>{nodeName}</strong></> : null}. Donations always settle on{' '}
            <strong>playnet</strong> (<code>{network}</code>) via this node&apos;s Fabric playnet Hub.
          </p>
          {loadingMeta ? (
            <Message info>Loading playnet receive info…</Message>
          ) : address ? (
            <Message>
              <Message.Header>Host receive address</Message.Header>
              <code style={{ wordBreak: 'break-all' }}>{address}</code>
            </Message>
          ) : null}
          {error && <Message negative>{error}</Message>}
          {success && <Message positive>{success}</Message>}
          <Form onSubmit={(e) => { e.preventDefault(); this.handleDonate(); }}>
            <Form.Field>
              <label>Amount (BTC)</label>
              <Input
                type="text"
                value={amountBtc}
                onChange={(e, { value }) => this.setState({ amountBtc: value })}
                placeholder="0.0001"
              />
            </Form.Field>
            <p style={{ fontSize: '0.9em', color: '#666' }}>
              Spends from the node&apos;s playnet wallet to this host&apos;s donation address (regtest / shared-wallet setups).
            </p>
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={onClose}>Close</Button>
          <Button primary loading={loading} disabled={loadingMeta || !address} onClick={this.handleDonate}>
            Donate
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }
}

module.exports = DonateToHostModal;
