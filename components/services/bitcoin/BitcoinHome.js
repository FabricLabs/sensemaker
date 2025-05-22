'use strict';

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

// Semantic UI
const {
  Breadcrumb,
  Button,
  Card,
  Grid,
  Header,
  Icon,
  Segment
} = require('semantic-ui-react');

// Local Components
const KeyringManager = require('../../KeyringManager');
const BlocksList = require('./BlocksList');
const TransactionsList = require('./TransactionsList');
const NodesList = require('./NodesList');

// Functions
const toRelativeTime = require('../../../functions/toRelativeTime');
const truncateMiddle = require('../../../functions/truncateMiddle');

class BitcoinHome extends React.Component {
  constructor (props) {
    super(props);

    // Settings
    this.settings = Object.assign({
      debug: false,
      bitcoin: {
        peers: [],
        nodes: [
          { name: 'BITCOIN_LOCAL_MAINNET_WALLET', network: 'mainnet', url: 'http://localhost:8332', roles: ['wallet', 'blockchain', 'mempool'] },
          { name: 'BITCOIN_LOCAL_MAINNET_BOUNDARY', network: 'mainnet', url: 'http://localhost:8332', roles: ['blockchain', 'mempool'] },
          { name: 'BITCOIN_LOCAL_TESTNET_WALLET', network: 'testnet', url: 'http://localhost:18332', roles: ['wallet', 'blockchain', 'mempool'] },
          { name: 'BITCOIN_LOCAL_TESTNET_BOUNDARY', network: 'testnet', url: 'http://localhost:18332', roles: ['blockchain', 'mempool'] }
        ]
      },
      state: {
        bitcoin: {
          network: 'mainnet',
          genesisHash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
          blockHeight: 0,
          issuance: 0,
          blocks: {},
          transactions: {},
          nodes: [],
          recentBlocks: [],
          recentTransactions: [],
          loading: false,
          syncActive: false,
          syncProgress: 0
        }
      }
    }, props);

    // React State
    this.state = {
      ...this.settings.state,
      showKeyringManager: false
    };

    // Fabric State
    this._state = {
      bitcoin: {
        keys: {}, // TODO: add keys from this.seed, this.key, etc.,
        blocks: {},
        transactions: {}, // Map of transactions by txid
        mempool: [],
        nodes: []
      },
      content: this.settings.state
    };

    return this;
  }

  componentDidMount () {
    // Subscribe to Bitcoin service updates
    this.props.bridge.subscribe('/services/bitcoin');

    // Check if keys are loaded
    const storedKeyring = localStorage.getItem('keyring');
    if (!storedKeyring) {
      this.setState({ showKeyringManager: true });
    }

    // Check if we're in deposit mode
    const isDepositAction = window.location.pathname === '/services/bitcoin' && window.location.search.includes('action=deposit');
    if (isDepositAction && !storedKeyring) {
      this.setState({ showKeyringManager: true });
    }

    // Initial data fetch
    this.setState({ bitcoin: { ...this.state.bitcoin, loading: true } });
    this.props.fetchBitcoinStats().catch(error => {
      console.error('[BITCOIN:HOME]', 'Failed to fetch stats:', error);
      this.setState({ bitcoin: { ...this.state.bitcoin, loading: false } });
    });

    // Periodic refresh
    this.watcher = setInterval(() => {
      this.setState({ bitcoin: { ...this.state.bitcoin, loading: true } });
      this.props.fetchBitcoinStats().catch(error => {
        console.error('[BITCOIN:HOME]', 'Failed to fetch stats:', error);
        this.setState({ bitcoin: { ...this.state.bitcoin, loading: false } });
      });
    }, 60000);
  }

  componentWillUnmount () {
    // Unsubscribe from Bitcoin service updates
    this.props.bridge.unsubscribe('/services/bitcoin');

    // Clean up interval
    if (this.watcher) {
      clearInterval(this.watcher);
    }
  }

  handleAuthorityMessage (update) {
    console.debug('[BITCOIN:HOME]', 'Received update:', update);
    // Handle state updates from bridge
    if (update.type === 'PATCH') {
      const path = update.path;
      const value = update.value;
      
      this.setState(prevState => ({
        bitcoin: {
          ...prevState.bitcoin,
          [path]: value,
          loading: false
        }
      }));
    }
  }

  toggleKeyringManager = () => {
    this.setState(prevState => ({
      showKeyringManager: !prevState.showKeyringManager
    }));
  };

  render () {
    const { bitcoin } = this.state;
    const { showKeyringManager } = this.state;
    console.debug('[BITCOIN]', 'Service:', bitcoin);

    // Format height and supply values
    const formattedHeight = bitcoin?.height ? bitcoin.height.toLocaleString() : '0';
    const formattedSupply = bitcoin?.supply ? (bitcoin.supply / 100000000).toFixed(8) : '0.00000000';

    return (
      <div>
        <div className='uppercase'>
          <Button onClick={() => { history.back(); }} icon color='black'><Icon name='left chevron' /> Back</Button>
          <Breadcrumb style={{ marginLeft: '1em' }}>
            <Breadcrumb.Section><Link to='/services/bitcoin'>Bitcoin</Link></Breadcrumb.Section>
          </Breadcrumb>
          <Button
            icon
            color='black'
            style={{ float: 'right' }}
            onClick={this.toggleKeyringManager}
          >
            <Icon name='key' /> Keys
          </Button>
        </div>
        <Segment className='fade-in' style={{ maxHeight: '100%' }}>
          <Header as='h1' style={{ marginTop: 0 }}><Icon name='bitcoin' />Bitcoin</Header>
          <p>Bitcoin is a peer-to-peer electronic cash system.</p>
        </Segment>
        <Grid columns={3}>
          <Grid.Row>
            <Grid.Column>
              <Segment>
                <p><strong>Transactions in Mempool:</strong> {bitcoin?.mempool?.length || 0}</p>
                <TransactionsList transactions={bitcoin?.recentTransactions || []} />
              </Segment>
            </Grid.Column>
            <Grid.Column>
              <Segment>
                <p><strong>Recent Blocks</strong></p>
                <BlocksList blocks={bitcoin?.recentBlocks || []} />
              </Segment>
            </Grid.Column>
            <Grid.Column>
              <Segment>
                {bitcoin?.syncActive && <div><strong>Syncing block {formattedHeight}... (~{(100 * bitcoin.syncProgress).toFixed(1)}%)</strong></div>}
                <div><strong>Chain Height:</strong> <code>{formattedHeight}</code></div>
                <div><strong>Supply:</strong> <code>{formattedSupply} BTC</code></div>
              </Segment>
            </Grid.Column>
          </Grid.Row>
        </Grid>
        <Segment className='fade-in'>
          <p>To create or receive Bitcoin transactions, you must first set up a wallet.</p>
          <KeyringManager
            open={showKeyringManager}
            onClose={this.toggleKeyringManager}
          />
        </Segment>
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = BitcoinHome;
