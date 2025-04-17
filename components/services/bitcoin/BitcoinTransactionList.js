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
  Segment,
  Table
} = require('semantic-ui-react');

class BitcoinBlockLists extends React.Component {
  constructor (props = {}) {
    super(props);

    return this;
  }

  componentDidMount () {
    this.props.fetchBitcoinBlocks();
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
          </Breadcrumb>
        </div>
        <Segment className='fade-in' loading={bitcoin?.loading} style={{ maxHeight: '100%' }}>
          <Header as='h1'>Blocks</Header>
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
              {bitcoin && bitcoin.blocks && bitcoin.blocks.length && bitcoin.blocks.slice(0, 14).map((block, index) => (
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
        </Segment>
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = BitcoinBlockLists;
