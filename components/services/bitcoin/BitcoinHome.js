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
  Header,
  Icon,
  Segment,
  Table
} = require('semantic-ui-react');

// Local Components
const KeyringManager = require('../KeyringManager');

// Functions
const toRelativeTime = require('../../functions/toRelativeTime');
const truncateMiddle = require('../../functions/truncateMiddle');

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
          blocks: [],
          transactions: [],
          nodes: []
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
        transactions: {},
        mempool: [],
        nodes: []
      },
      content: this.settings.state
    };

    return this;
  }

  componentDidMount () {
    this.props.fetchBitcoinStats();
    this.watcher = setInterval(() => {
      this.props.fetchBitcoinStats();
    }, 60000);
  }

  componentWillUnmount () {
    clearInterval(this.watcher);
  }

  toggleKeyringManager = () => {
    this.setState(prevState => ({
      showKeyringManager: !prevState.showKeyringManager
    }));
  };

  render () {
    const { bitcoin } = this.props;
    const { showKeyringManager } = this.state;
    console.debug('[BITCOIN]', 'Service:', bitcoin);
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
        <Segment className='fade-in' loading={bitcoin?.loading} style={{ maxHeight: '100%' }}>
          <Card className='right floated'>
            <Card.Content textAlign='right'>
              {bitcoin?.syncActive && <div><strong>Syncing block {bitcoin?.height}... (~{(100 * bitcoin.syncProgress).toFixed(1)}%)</strong></div>}
              <div><strong>Chain Height:</strong> <code>{bitcoin?.height || 0}</code></div>
              <div><strong>Supply:</strong> <code>{bitcoin?.supply || 0}</code></div>
            </Card.Content>
          </Card>
          <Header as='h1' style={{ marginTop: 0 }}><Icon name='bitcoin' />Bitcoin</Header>
          <p>Bitcoin is a peer-to-peer electronic cash system.</p>
          <div>
            <Header as='h2'>Latest Blocks</Header>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Height</Table.HeaderCell>
                  <Table.HeaderCell>Hash</Table.HeaderCell>
                  <Table.HeaderCell>Timestamp</Table.HeaderCell>
                  <Table.HeaderCell>Transactions</Table.HeaderCell>
                  <Table.HeaderCell>Size</Table.HeaderCell>
                  <Table.HeaderCell>Subsidy</Table.HeaderCell>
                  <Table.HeaderCell>Fees Paid</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {bitcoin && bitcoin.recentBlocks && bitcoin.recentBlocks.length && bitcoin.recentBlocks.slice(0, 5).map((block, index) => (
                  <Table.Row key={index}>
                    <Table.Cell>{block.height}</Table.Cell>
                    <Table.Cell><Link to={`/services/bitcoin/blocks/` + block.hash}>{truncateMiddle(block.hash || '', 11, '…')}</Link></Table.Cell>
                    <Table.Cell><abbr title={(new Date(block.time * 1000)).toISOString()}>{toRelativeTime(new Date(block.time * 1000))}</abbr></Table.Cell>
                    <Table.Cell>{block.nTx}</Table.Cell>
                    <Table.Cell>{(block.size / 1024 / 1024).toFixed(3)} MB</Table.Cell>
                    <Table.Cell>{block.subsidy?.toFixed(8)} BTC</Table.Cell>
                    <Table.Cell>{block.feesPaid?.toFixed(8)} BTC</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
          <div style={{ marginTop: '1em' }}>
            <Button.Group floated='right'>
              <Button labeled icon labelPosition='right'>Create Transaction <Icon name='add' /></Button>
            </Button.Group>
            <Header as='h2'>Latest Transactions</Header>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Block</Table.HeaderCell>
                  <Table.HeaderCell>Hash</Table.HeaderCell>
                  <Table.HeaderCell>Timestamp</Table.HeaderCell>
                  <Table.HeaderCell>Inputs</Table.HeaderCell>
                  <Table.HeaderCell>Outputs</Table.HeaderCell>
                  <Table.HeaderCell textAlign='right'>Amount</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {bitcoin && bitcoin.recentTransactions && bitcoin.recentTransactions.length && bitcoin.recentTransactions.slice(0, 5).map((tx, index) => (
                  <Table.Row key={index}>
                    <Table.Cell><Link to={`/services/bitcoin/blocks/` + tx.blockhash}>{`#${tx.block?.height}`} {truncateMiddle(tx.blockhash || '', 11, '…')} (#{tx.height})</Link></Table.Cell>
                    <Table.Cell><Link to={`/services/bitcoin/transactions/` + tx.txid}>{truncateMiddle(tx.txid || '', 11, '…')}</Link></Table.Cell>
                    <Table.Cell><abbr title={(new Date(tx.time * 1000)).toISOString()}>{toRelativeTime(new Date(tx.time * 1000))}</abbr></Table.Cell>
                    <Table.Cell>{tx.vin && tx.vin.length} inputs</Table.Cell>
                    <Table.Cell>{tx.vout && tx.vout.length} outputs</Table.Cell>
                    <Table.Cell textAlign='right'>{tx.value.toFixed(8)} BTC</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
          <div style={{ marginTop: '1em' }}>
            <Header as='h2'>Nodes</Header>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Name</Table.HeaderCell>
                  <Table.HeaderCell>Network</Table.HeaderCell>
                  <Table.HeaderCell>URL</Table.HeaderCell>
                  <Table.HeaderCell>Roles</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {bitcoin && bitcoin.nodes && bitcoin.nodes.map((node, index) => (
                  <Table.Row key={index}>
                    <Table.Cell>{node.name}</Table.Cell>
                    <Table.Cell>{node.network}</Table.Cell>
                    <Table.Cell>{node.url}</Table.Cell>
                    <Table.Cell>{node.roles.join(', ')}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </Segment>
        <KeyringManager
          open={showKeyringManager}
          onClose={this.toggleKeyringManager}
        />
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = BitcoinHome;
