'use strict';

// Dependencies
// React
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

// Functions
const truncateMiddle = require('../../../functions/truncateMiddle');
const toRelativeTime = require('../../../functions/toRelativeTime');

// Components
// Semantic UI
const {
  Breadcrumb,
  Button,
  Header,
  Icon,
  Input,
  Label,
  Segment,
  Table
} = require('semantic-ui-react');

class BitcoinTransactionList extends React.Component {
  constructor (props = {}) {
    super(props);

    this.state = {
      showAllTransactions: true,
      searchQuery: ''
    };

    return this;
  }

  componentDidMount () {
    this.props.fetchBitcoinTransactions();
  }

  handleSearchChange = (e, { value }) => {
    this.setState({ searchQuery: value });
  };

  filterTransactions = (transactions) => {
    const { searchQuery } = this.state;
    if (!searchQuery) return transactions;

    return transactions.filter(tx =>
      tx.txid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.blockhash?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.vout?.[0]?.scriptPubKey?.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  getTransactionType = (tx) => {
    if (tx.vin?.[0]?.coinbase) {
      return <Label color='orange' size='tiny'>Coinbase</Label>;
    }
    return <Label color='blue' size='tiny'>Transfer</Label>;
  };

  getRecipientAddress = (tx) => {
    // Find the first non-OP_RETURN output with an address
    const output = tx.vout?.find(out =>
      out.scriptPubKey?.type !== 'nulldata' &&
      out.scriptPubKey?.address
    );
    return output?.scriptPubKey?.address || 'No recipient address';
  };

  render () {
    const { bitcoin } = this.props;
    const { searchQuery } = this.state;
    console.debug('[BITCOIN]', 'Service:', bitcoin);

    // Filter transactions based on search query
    const filteredTransactions = bitcoin?.transactions ?
      this.filterTransactions(bitcoin.transactions) : [];

    return (
      <div>
        {/* <div className='uppercase'>
          <Button onClick={() => { history.back(); }} icon color='black'><Icon name='left chevron' /> Back</Button>
          <Breadcrumb style={{ marginLeft: '1em' }}>
            <Breadcrumb.Section><Link to='/services/bitcoin'>Bitcoin</Link></Breadcrumb.Section>
            <Breadcrumb.Divider />
            <Breadcrumb.Section><Link to='/services/bitcoin/transactions'>Transactions</Link></Breadcrumb.Section>
          </Breadcrumb>
        </div> */}
        <div className='fade-in' loading={bitcoin?.loading} style={{ maxHeight: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1em' }}>
            <Header as='h1'>
              <Link to='/services/bitcoin'>
                <Icon name='bitcoin' color='orange' />
              </Link>
              Transactions
            </Header>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1em' }}>
            <Button.Group>
              <Button disabled active={!this.state.showAllTransactions} onClick={() => this.setState({ showAllTransactions: false })}>
                My Transactions
              </Button>
              <Button active={this.state.showAllTransactions} onClick={() => this.setState({ showAllTransactions: true })}>
                All Transactions
              </Button>
            </Button.Group>

            <Input
              icon='search'
              placeholder='Search by transaction ID, block hash, or address...'
              value={searchQuery}
              onChange={this.handleSearchChange}
              style={{ minWidth: '300px' }}
            />
          </div>

          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell>Transaction ID</Table.HeaderCell>
                <Table.HeaderCell>Block</Table.HeaderCell>
                <Table.HeaderCell>Confirmations</Table.HeaderCell>
                <Table.HeaderCell>Amount (BTC)</Table.HeaderCell>
                <Table.HeaderCell>Recipient</Table.HeaderCell>
                <Table.HeaderCell>Time</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredTransactions.slice(0, 14).map((tx, index) => (
                <Table.Row key={index}>
                  <Table.Cell>{this.getTransactionType(tx)}</Table.Cell>
                  <Table.Cell>
                    <Link to={`/services/bitcoin/transactions/` + tx.txid}>
                      {truncateMiddle(tx.txid || '', 8, '…')}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>
                    {tx.blockhash ? (
                      <Link to={`/services/bitcoin/blocks/` + tx.blockhash}>
                        {truncateMiddle(tx.blockhash || '', 8, '…')}
                      </Link>
                    ) : (
                      <Label size='tiny'>Unconfirmed</Label>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {tx.confirmations === 0 ? (
                      <Label color='yellow' size='tiny'>Pending</Label>
                    ) : tx.confirmations?.toLocaleString() || 'Unknown'}
                  </Table.Cell>
                  <Table.Cell>
                    {tx.value?.toFixed(8) || '0.00000000'}
                  </Table.Cell>
                  <Table.Cell>
                    <code style={{ fontSize: '0.9em' }}>{truncateMiddle(this.getRecipientAddress(tx), 20, '…')}</code>
                  </Table.Cell>
                  <Table.Cell>
                    {tx.time ? toRelativeTime(tx.time * 1000) : 'Unknown'}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          {filteredTransactions.length === 0 && (
            <Segment placeholder textAlign='center'>
              <Header icon>
                <Icon name='search' />
                No transactions found matching your search criteria
              </Header>
            </Segment>
          )}
        </div>
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = BitcoinTransactionList;
