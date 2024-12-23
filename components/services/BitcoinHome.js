'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');

const {
  Segment,
  Table
} = require('semantic-ui-react');

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
      ...this.settings.state
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

  render () {
    const { bitcoin } = this.props;
    return (
      <Segment className='fade-in' loading={bitcoin?.loading} style={{ maxHeight: '100%' }}>
        <h1>Bitcoin</h1>
        <div>
          <div>Chain Tip: <code>{bitcoin?.tip || '...'}</code></div>
          <div>Genesis: <code>{bitcoin?.genesisHash || '...'}</code></div>
          <div>Block Height: <code>{bitcoin?.height || 0}</code></div>
          <div>Bitcoin Issued: <code>{bitcoin?.supply || 0}</code></div>
          <div>Mempool Size: <code>{bitcoin?.mempoolSize || 0}</code></div>
        </div>
        <div>
          <h2>Latest Blocks</h2>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Height</Table.HeaderCell>
                <Table.HeaderCell>Hash</Table.HeaderCell>
                <Table.HeaderCell>Timestamp</Table.HeaderCell>
                <Table.HeaderCell>Transactions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {this.state.bitcoin?.blocks.slice(0, 5).map((block, index) => (
                <Table.Row key={index}>
                  <Table.Cell>{block.height}</Table.Cell>
                  <Table.Cell>{block.hash}</Table.Cell>
                  <Table.Cell>{block.timestamp}</Table.Cell>
                  <Table.Cell>{block.transactions}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
        <div>
          <h2>Latest Transactions</h2>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Hash</Table.HeaderCell>
                <Table.HeaderCell>Block</Table.HeaderCell>
                <Table.HeaderCell>Timestamp</Table.HeaderCell>
                <Table.HeaderCell>Amount</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {this.state.bitcoin?.transactions.slice(0, 5).map((tx, index) => (
                <Table.Row key={index}>
                  <Table.Cell>{tx.hash}</Table.Cell>
                  <Table.Cell>{tx.block}</Table.Cell>
                  <Table.Cell>{tx.timestamp}</Table.Cell>
                  <Table.Cell>{tx.amount}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
        <div>
          <h2>Mempool</h2>
        </div>
        <div>
          <h2>Nodes</h2>
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
              {this.state.bitcoin?.nodes.map((node, index) => (
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
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = BitcoinHome;
