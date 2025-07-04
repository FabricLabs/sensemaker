'use strict';

// Dependencies
const merge = require('lodash.merge');

// React
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const {
  Link,
  useParams
} = require('react-router-dom');

// Functions
const truncateMiddle = require('../../../functions/truncateMiddle');
const toRelativeTime = require('../../../functions/toRelativeTime');

// Components
// Semantic UI
const {
  Breadcrumb,
  Button,
  Card,
  Divider,
  Header,
  Icon,
  Label,
  List,
  Segment,
  Statistic,
  Table,
  Message,
  Grid
} = require('semantic-ui-react');

class BitcoinTransactionView extends React.Component {
  constructor (props = {}) {
    super(props);

    this.settings = merge({
      state: {
        includeBreadCrumbs: false,
        status: 'SYNCING'
      }
    }, props);

    return this;
  }

  componentDidMount () {
    this.props.fetchBitcoinTransaction(this.props.txhash);
  }

  getTransactionStatus = (tx) => {
    if (!tx.confirmations) {
      return <Label color='yellow'>Unconfirmed</Label>;
    }
    if (tx.confirmations === 1) {
      return <Label color='olive'>1 Confirmation</Label>;
    }
    return <Label color='green'>{tx.confirmations.toLocaleString()} Confirmations</Label>;
  };

  render () {
    const { bitcoin } = this.props;
    const tx = bitcoin.transaction;
    console.debug('[BITCOIN]', 'Service:', bitcoin);

    // Handle error states
    const error = bitcoin?.error;
    const isPruned = error?.message?.includes('pruned mode');
    const needsBlockHash = error?.suggestion?.includes('block hash');

    // Calculate total input/output values with null checks
    const totalInput = tx?.vin?.reduce((sum, input) => sum + (input.value || 0), 0) || 0;
    const totalOutput = tx?.vout?.reduce((sum, output) => sum + (output.value || 0), 0) || 0;
    const fee = Math.max(0, totalInput - totalOutput);

    // Format numbers safely
    const formatNumber = (num) => (typeof num === 'number' ? num.toLocaleString() : '0');
    const formatBTC = (num) => (typeof num === 'number' ? num.toFixed(8) : '0.00000000');

    return (
      <div>
        <div className='uppercase'>
          <Button onClick={() => { history.back(); }} icon color='black'><Icon name='left chevron' /> Back</Button>
          <Breadcrumb style={{ marginLeft: '1em' }}>
            <Breadcrumb.Section><Link to='/services/bitcoin'>Bitcoin</Link></Breadcrumb.Section>
            <Breadcrumb.Divider />
            <Breadcrumb.Section><Link to='/services/bitcoin/transactions'>Transactions</Link></Breadcrumb.Section>
            <Breadcrumb.Divider />
            <Breadcrumb.Section active>{truncateMiddle(tx?.txid || this.props.txhash || '', 15, '…')}</Breadcrumb.Section>
          </Breadcrumb>
        </div>
        <Segment className='fade-in' loading={bitcoin?.loading} style={{ maxHeight: '100%' }}>
          {isPruned ? (
            <Message warning icon>
              <Icon name='warning sign' />
              <Message.Content>
                <Message.Header>Transaction Not Available</Message.Header>
                <p>This transaction is not available because the node is running in pruned mode. Only recent transactions can be viewed.</p>
                {needsBlockHash && (
                  <p>If you know which block contains this transaction, you can provide the block hash to view it.</p>
                )}
              </Message.Content>
            </Message>
          ) : error ? (
            <Message negative>
              <Message.Header>Error Loading Transaction</Message.Header>
              <p>{error.message || 'Failed to load transaction details.'}</p>
            </Message>
          ) : tx ? (
            <>
              <Header as='h2' style={{ marginBottom: '0.5em' }}>
                Transaction Details
                {tx.vin?.[0]?.coinbase && (
                  <Label color='orange' style={{ marginLeft: '1em' }}>
                    Coinbase Transaction
                  </Label>
                )}
              </Header>

              <Grid columns={2} stackable>
                <Grid.Column>
                  <List>
                    <List.Item>
                      <List.Header>Transaction ID</List.Header>
                      <code style={{ wordBreak: 'break-all' }}>{tx.txid}</code>
                      <Button
                        icon
                        basic
                        size='mini'
                        style={{ marginLeft: '0.5em' }}
                        onClick={() => navigator.clipboard.writeText(tx.txid)}
                      >
                        <Icon name='copy' />
                      </Button>
                    </List.Item>
                    {tx.blockhash && (
                      <List.Item>
                        <List.Header>Block</List.Header>
                        <Link to={`/services/bitcoin/blocks/${tx.blockhash}`}>
                          <code>{truncateMiddle(tx.blockhash, 20)}</code>
                        </Link>
                      </List.Item>
                    )}
                    {tx.time && (
                      <List.Item>
                        <List.Header>Timestamp</List.Header>
                        {new Date(tx.time * 1000).toLocaleString()} ({toRelativeTime(tx.time * 1000)})
                      </List.Item>
                    )}
                    <List.Item>
                      <List.Header>Status</List.Header>
                      {this.getTransactionStatus(tx)}
                    </List.Item>
                  </List>
                </Grid.Column>
                <Grid.Column>
                  <Statistic.Group size='small' widths='one'>
                    <Statistic>
                      <Statistic.Value>{formatBTC(totalInput)}</Statistic.Value>
                      <Statistic.Label>Input BTC</Statistic.Label>
                    </Statistic>
                    <Statistic>
                      <Statistic.Value>{formatBTC(totalOutput)}</Statistic.Value>
                      <Statistic.Label>Output BTC</Statistic.Label>
                    </Statistic>
                    <Statistic>
                      <Statistic.Value>{formatBTC(fee)}</Statistic.Value>
                      <Statistic.Label>Fee BTC</Statistic.Label>
                    </Statistic>
                  </Statistic.Group>
                  <List style={{ marginTop: '1em' }}>
                    <List.Item>
                      <List.Header>Size</List.Header>
                      {formatNumber(tx?.size)} bytes
                    </List.Item>
                    <List.Item>
                      <List.Header>Virtual Size</List.Header>
                      {formatNumber(tx?.vsize)} vBytes
                    </List.Item>
                    <List.Item>
                      <List.Header>Weight</List.Header>
                      {formatNumber(tx?.weight)} weight units
                    </List.Item>
                  </List>
                </Grid.Column>
              </Grid>

              <Divider />

              <Grid columns={2} stackable>
                <Grid.Column>
                  <Header as='h3'>
                    Inputs
                    <Label circular style={{ marginLeft: '0.5em' }}>{tx.vin?.length || 0}</Label>
                  </Header>
                  <Table>
                    <Table.Header>
                      <Table.Row>
                        <Table.HeaderCell>Index</Table.HeaderCell>
                        <Table.HeaderCell>Previous Output</Table.HeaderCell>
                        <Table.HeaderCell textAlign='right'>Amount</Table.HeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {tx.vin?.map((input, index) => (
                        <Table.Row key={index}>
                          <Table.Cell>{index}</Table.Cell>
                          <Table.Cell>
                            {input.coinbase ? (
                              <Label>Newly Generated Coins</Label>
                            ) : input.txid ? (
                              <Link to={`/services/bitcoin/transactions/${input.txid}`}>
                                {truncateMiddle(input.txid, 15)}:{input.vout}
                              </Link>
                            ) : 'Unknown'}
                          </Table.Cell>
                          <Table.Cell textAlign='right'>{formatBTC(input.value)} BTC</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </Grid.Column>
                <Grid.Column>
                  <Header as='h3'>
                    Outputs
                    <Label circular style={{ marginLeft: '0.5em' }}>{tx.vout?.length || 0}</Label>
                  </Header>
                  <Table>
                    <Table.Header>
                      <Table.Row>
                        <Table.HeaderCell>Index</Table.HeaderCell>
                        <Table.HeaderCell>Address / Script</Table.HeaderCell>
                        <Table.HeaderCell textAlign='right'>Amount</Table.HeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {tx.vout?.map((output, index) => (
                        <Table.Row key={index}>
                          <Table.Cell>{output.n}</Table.Cell>
                          <Table.Cell>
                            {output.scriptPubKey?.type === 'nulldata' ? (
                              <Label>OP_RETURN</Label>
                            ) : (
                              <code>{output.scriptPubKey?.address || 'No Address'}</code>
                            )}
                            {output.scriptPubKey?.type && (
                              <Label size='tiny' style={{ marginLeft: '0.5em' }}>
                                {output.scriptPubKey.type}
                              </Label>
                            )}
                          </Table.Cell>
                          <Table.Cell textAlign='right'>{formatBTC(output.value)} BTC</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                    {tx.vout?.length > 0 && (
                      <Table.Footer>
                        <Table.Row>
                          <Table.HeaderCell colSpan='2'><strong>Total</strong></Table.HeaderCell>
                          <Table.HeaderCell textAlign='right'>
                            <strong>{formatBTC(totalOutput)} BTC</strong>
                          </Table.HeaderCell>
                        </Table.Row>
                      </Table.Footer>
                    )}
                  </Table>
                </Grid.Column>
              </Grid>
            </>
          ) : null}
        </Segment>
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

function TransactionView (props) {
  const { txhash } = useParams();
  return <BitcoinTransactionView txhash={txhash} {...props} />;
}

module.exports = TransactionView;
