'use strict';

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

// Fabric Types
const FabricMessage = require('@fabric/core/types/message');

// Toast notifications
const { toast } = require('../../../functions/toast');

// Semantic UI
const {
  Breadcrumb,
  Button,
  Card,
  Grid,
  Header,
  Icon,
  Modal,
  Message,
  Popup,
  Segment
} = require('semantic-ui-react');

// Local Components
const BlocksList = require('./BlocksList');
const TransactionsList = require('./TransactionsList');
const NodesList = require('./NodesList');
const DepositAddress = require('../../DepositAddress');

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
          syncProgress: 0,
          depositAddress: null
        }
      }
    }, props);

    // React State
    this.state = {
      ...this.settings.state,
      isDepositModalOpen: false
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

    // Bind methods
    this.handleBridgeMessage = this.handleBridgeMessage.bind(this);

    return this;
  }

  componentDidMount () {
    // Subscribe to Bitcoin service updates
    if (this.props.bridge) {
      this.props.bridge.subscribe('/services/bitcoin');

      // Set up message handler
      const originalHandler = this.props.bridge.props.responseCapture;
      this.props.bridge.props.responseCapture = (msg) => {
        this.handleBridgeMessage(msg);
        if (originalHandler) originalHandler(msg);
      };

      // Check for #deposit hash and open modal if present
      if (window.location.hash === '#deposit') {
        this.setState({ isDepositModalOpen: true });
        // Remove the hash to prevent modal from reopening on refresh
        window.history.replaceState(null, null, ' ');
      }

      // Initial data fetch
      this.setState({ bitcoin: { ...this.state.bitcoin, loading: true } });
      this.props.fetchBitcoinStats().catch(error => {
        console.error('[BITCOIN:HOME]', 'Failed to fetch Bitcoin stats:', error);
        this.setState({ bitcoin: { ...this.state.bitcoin, loading: false } });
      });

      // Periodic refresh
      this.watcher = setInterval(() => {
        this.setState({ bitcoin: { ...this.state.bitcoin, loading: true } });
        this.props.fetchBitcoinStats().catch(error => {
          console.error('[BITCOIN:HOME]', 'Failed to fetch Bitcoin stats:', error);
          this.setState({ bitcoin: { ...this.state.bitcoin, loading: false } });
        });
      }, 60000);
    } else {
      console.error('[BITCOIN:HOME]', 'Bridge not available');
    }
  }

  componentWillUnmount () {
    // Unsubscribe from Bitcoin service updates
    if (this.props.bridge) {
      this.props.bridge.unsubscribe('/services/bitcoin');
    }

    // Clean up interval
    if (this.watcher) {
      clearInterval(this.watcher);
    }
  }

  handleBridgeMessage (message) {
    console.debug('[BITCOIN:HOME]', 'Received bridge message:', message);

    if (message.type === 'GenericMessage' && message.content) {
      // Handle Bitcoin service updates
      if (message.content.type === 'PATCH') {
        const { path, value } = message.content;
        this.setState(prevState => ({
          bitcoin: {
            ...prevState.bitcoin,
            [path]: value,
            loading: false
          }
        }));
      }
      // Handle direct bitcoin status updates
      else if (typeof message.content === 'object' && message.content.network) {
        console.debug('[BITCOIN:HOME]', 'Received bitcoin status update:', message.content);
        this.setState({
          bitcoin: {
            ...message.content,
            loading: false
          }
        });
      }
      // Try to parse JSON content for other formats
      else {
        try {
          const result = JSON.parse(message.content);
          console.debug('[BITCOIN:HOME]', 'Parsed message content:', result);

          // Handle Bitcoin service updates
          if (result.type === 'PATCH') {
            const { path, value } = result;
            this.setState(prevState => ({
              bitcoin: {
                ...prevState.bitcoin,
                [path]: value,
                loading: false
              }
            }));
          }
          // Handle direct bitcoin status updates
          else if (typeof result === 'object' && result.network) {
            console.debug('[BITCOIN:HOME]', 'Received bitcoin status update:', result);
            this.setState({
              bitcoin: {
                ...result,
                loading: false
              }
            });
          }
        } catch (e) {
          console.debug('[BITCOIN:HOME]', 'Content is not JSON, skipping parse');
        }
      }
    }
  }

    handleDepositModalOpen = () => {
    this.setState({ isDepositModalOpen: true });
  };

  handleDepositModalClose = () => {
    this.setState({ isDepositModalOpen: false });
  };



  render () {
    const { bitcoin, bitcoinBalance } = this.props;
    const { isDepositModalOpen } = this.state;
    console.debug('[BITCOIN]', 'Service:', bitcoin);
    console.debug('[BITCOIN]', 'Recent Blocks:', bitcoin?.recentBlocks);

    // Format height and supply values
    const formattedHeight = bitcoin?.height ? bitcoin.height.toLocaleString() : '0';
    const formattedSupply = bitcoin?.supply ? (bitcoin.supply).toFixed(8) : '0.00000000';

    // Calculate average block time from recentBlocks
    let averageBlockTime = 0;
    if (bitcoin?.recentBlocks && bitcoin.recentBlocks.length > 1) {
      const times = bitcoin.recentBlocks.map(block => block.time);
      let totalDiff = 0;
      for (let i = 0; i < times.length - 1; i++) {
        totalDiff += times[i] - times[i + 1];
      }
      averageBlockTime = totalDiff / (times.length - 1);
    }

    return (
      <div>
        {/* <div className='uppercase'>
          <Button onClick={() => { history.back(); }} icon color='black'><Icon name='left chevron' /> Back</Button>
          <Breadcrumb style={{ marginLeft: '1em' }}>
            <Breadcrumb.Section><Link to='/services/bitcoin'>Bitcoin</Link></Breadcrumb.Section>
          </Breadcrumb>
        </div> */}
        <Segment className='fade-in' style={{ maxHeight: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'anchor-center' }}>
            <div>
              <Header as='h1' style={{ marginTop: 0, marginBottom: 0 }}><Icon name='bitcoin' color='orange' />Bitcoin</Header>
            </div>
            <Button.Group>
              <Button as={Link} to='/services/bitcoin/transactions' color='black'>
                <Icon name='bitcoin outline' />
                {bitcoinBalance || '0.00000000'}
              </Button>
              <Button color='green' onClick={this.handleDepositModalOpen}>
                <Icon name='plus' /> Deposit
              </Button>
            </Button.Group>
          </div>
          <p style={{ margin: '0.5em 0 0 0' }}>Bitcoin is a peer-to-peer electronic cash system.</p>
        </Segment>
        <style>
          {`
            @media (max-width: 768px) {
              .ui.stackable.grid > .column:not(.row) {
                padding-right: 0 !important;
              }
            }
          `}
        </style>
        <Grid columns={3} stackable equal style={{ display: 'flex', alignItems: 'stretch', marginTop: '1em', marginLeft: 0 }}>
          <Grid.Row style={{ paddingTop: 0 }}>
            <Grid.Column style={{ display: 'flex', paddingLeft: 0 }}>
              <Card fluid style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                <Card.Content style={{ flex: '1 1 auto' }}>
                  <Card.Header>Network Status</Card.Header>
                  <Card.Description>
                    {bitcoin?.syncActive && (
                      <Message info>
                        <Message.Header>Syncing...</Message.Header>
                        <p>Block {formattedHeight} (~{(100 * bitcoin.syncProgress).toFixed(1)}%)</p>
                      </Message>
                    )}
                    <div><strong>Network:</strong> <code>{bitcoin?.network || 'unknown'}</code></div>
                    <div><strong>Chain Height:</strong> <code>{formattedHeight}</code></div>
                    <div><strong>Supply:</strong> <code>{formattedSupply} BTC</code></div>
                    <div><strong>Status:</strong> <code>{bitcoin?.status || 'unknown'}</code></div>
                    {bitcoin?.chain && (
                      <>
                        <div><strong>Difficulty:</strong> <code>{bitcoin.chain.difficulty.toExponential(6)}</code></div>
                        <div><strong>Size on Disk:</strong> <code>{(bitcoin.chain.size_on_disk / (1024 * 1024)).toFixed(2)} MB</code></div>
                        {bitcoin.chain.warnings && bitcoin.chain.warnings.length > 0 && (
                          <Message warning>
                            <Message.Header>Chain Warnings</Message.Header>
                            <ul>
                              {bitcoin.chain.warnings.map((warning, idx) => (
                                <li key={idx}>{warning}</li>
                              ))}
                            </ul>
                          </Message>
                        )}
                      </>
                    )}
                  </Card.Description>
                </Card.Content>
                <Button attached='bottom' color='black' as={Link} to='/services/bitcoin/status'>
                  View Network Status &raquo;
                </Button>
              </Card>
            </Grid.Column>
            <Grid.Column style={{ display: 'flex', paddingLeft: 0 }}>
              <Card fluid style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                <Card.Content style={{ flex: '1 1 auto' }}>
                  <Card.Header>Blocks</Card.Header>
                  <Card.Description>
                    {bitcoin?.chain && (
                      <div style={{ marginBottom: '1em' }}>
                        <div><strong>Headers:</strong> <code>{bitcoin.chain.headers.toLocaleString()}</code></div>
                        <div><strong>Initial Block Download:</strong> <code>{bitcoin.chain.initialblockdownload ? 'Yes' : 'No'}</code></div>
                        <div><strong>Verification Progress:</strong> <code>{(bitcoin.chain.verificationprogress * 100).toFixed(2)}%</code></div>
                        {averageBlockTime > 0 && (
                          <div><strong>Average Block Time:</strong> <code>{averageBlockTime.toFixed(1)} seconds</code></div>
                        )}
                      </div>
                    )}
                    <div>
                      {console.debug('[BITCOIN]', 'Rendering blocks:', bitcoin?.recentBlocks)}
                      {Array.isArray(bitcoin?.recentBlocks) && bitcoin.recentBlocks.slice(0, 5).map((block) => (
                        <div key={block.hash} style={{ marginBottom: '0.5em' }}>
                          <Link to={`/services/bitcoin/blocks/${block.hash}`}>
                            <strong>Block {block.height}</strong>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
                              {truncateMiddle(block.hash, 20)}
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </Card.Description>
                </Card.Content>
                <Button attached='bottom' color='black' as={Link} to='/services/bitcoin/blocks'>
                  View All Blocks &raquo;
                </Button>
              </Card>
            </Grid.Column>
            <Grid.Column style={{ display: 'flex', paddingLeft: 0 }}>
              <Card fluid style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                <Card.Content style={{ flex: '1 1 auto' }}>
                  <Card.Header>Transactions</Card.Header>
                  <Card.Description>
                    {bitcoin?.mempool && (
                      <div style={{ marginBottom: '1em' }}>
                        <div><strong>Mempool Size:</strong> <code>{bitcoin.mempool.size} txs</code></div>
                        <div><strong>Mempool Usage:</strong> <code>{(bitcoin.mempool.usage / 1024).toFixed(2)} KB</code></div>
                        <div><strong>Unspent Transactions:</strong> <code>{bitcoin?.unspentTransactions || 0}</code></div>
                      </div>
                    )}
                    <TransactionsList transactions={bitcoin?.recentTransactions || []} />
                  </Card.Description>
                </Card.Content>
                <Button attached='bottom' color='black' as={Link} to='/services/bitcoin/transactions'>
                  View All Transactions &raquo;
                </Button>
              </Card>
            </Grid.Column>
          </Grid.Row>
        </Grid>
        <Modal
          open={isDepositModalOpen}
          onClose={this.handleDepositModalClose}
          size="small"
        >
          <Modal.Header>
            <Icon name="bitcoin" /> Deposit Bitcoin
          </Modal.Header>
                    <Modal.Content>
            <DepositAddress
              bridge={this.props.bridge}
              autoFetch={true}
              showLabel={true}
              onAddressFetched={(address) => {
                // Update local state for compatibility with existing bitcoin state
                this.setState(prevState => ({
                  bitcoin: {
                    ...prevState.bitcoin,
                    depositAddress: address
                  }
                }));
              }}
            />
            <Message warning>
              <Message.Header>Important</Message.Header>
              <p>Only send Bitcoin (BTC) to this address. Sending any other cryptocurrency may result in permanent loss.</p>
            </Message>
          </Modal.Content>
          <Modal.Actions>
            <Button color="black" onClick={this.handleDepositModalClose}>
              Close
            </Button>
          </Modal.Actions>
        </Modal>
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = BitcoinHome;
