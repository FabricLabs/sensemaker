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
const truncateMiddle = require('../../functions/truncateMiddle');

// Components
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

class BitcoinBlockView extends React.Component {
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
    // this.props.fetchBitcoinStats();
    this.props.fetchBitcoinBlock(this.props.blockhash);
  }

  render () {
    const { bitcoin } = this.props;
    console.debug('[BITCOIN]', 'Service:', bitcoin);
    return (
      <div>
        <div className='uppercase'>
          <Button onClick={() => { history.back(); }} icon color='black'><Icon name='left chevron' /> Back</Button>
          <Breadcrumb style={{ marginLeft: '1em' }}>
            <Breadcrumb.Section><Link to='/services/bitcoin'>Bitcoin</Link></Breadcrumb.Section>
            <Breadcrumb.Divider />
            <Breadcrumb.Section><Link to='/services/bitcoin/blocks'>Blocks</Link></Breadcrumb.Section>
            <Breadcrumb.Divider />
            <Breadcrumb.Section active>#{bitcoin.block.height}</Breadcrumb.Section>
          </Breadcrumb>
        </div>
        <Segment className='fade-in' loading={bitcoin?.loading} style={{ maxHeight: '100%' }}>
          <Header as='h1'>Block #{bitcoin.block.height}</Header>
          <div><code>{bitcoin.block.hash}</code> <Button basic><Icon name='linkify' title='Hyperlink' /></Button></div>
          <div><small><Icon name='quote left' title='Previous Block' /> <Link to={`/services/bitcoin/blocks/${bitcoin.block.previousblockhash}`}><abbr title='Previous Block'>{bitcoin.block.previousblockhash}</abbr></Link></small></div>
          <Header as='h2'>{bitcoin.block.nTx} Transactions</Header>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Hash</Table.HeaderCell>
                <Table.HeaderCell>Inputs</Table.HeaderCell>
                <Table.HeaderCell>Outputs</Table.HeaderCell>
                <Table.HeaderCell textAlign='right'>Amount</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {bitcoin && bitcoin.block && bitcoin.block.tx && bitcoin.block.tx.length && bitcoin.block.tx.slice(0, 10).map((txid, index) => (
                <Table.Row key={index}>
                  <Table.Cell><Link to={`/services/bitcoin/transactions/` + txid}>{truncateMiddle(txid || '', 15, '…')}</Link></Table.Cell>
                  <Table.Cell>{0} inputs</Table.Cell>
                  <Table.Cell>{0} outputs</Table.Cell>
                  <Table.Cell textAlign='right'>{'0.00000000'} BTC</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Segment>
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

function BlockView (props) {
  const { blockhash } = useParams();
  return <BitcoinBlockView blockhash={blockhash} {...props} />;
}

module.exports = BlockView;
