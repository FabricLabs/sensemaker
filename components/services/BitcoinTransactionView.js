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
    // this.props.fetchBitcoinStats();
    this.props.fetchBitcoinTransaction(this.props.txhash);
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
            <Breadcrumb.Section><Link to='/services/bitcoin/transactions'>Transactions</Link></Breadcrumb.Section>
            <Breadcrumb.Divider />
            <Breadcrumb.Section active>{truncateMiddle(bitcoin.transaction.hash || '', 15, '…')}</Breadcrumb.Section>
          </Breadcrumb>
        </div>
        <Segment className='fade-in' loading={bitcoin?.loading} style={{ maxHeight: '100%' }}>
          <Header as='h1'>Transaction {bitcoin.transaction.hash}</Header>
          <div><code>{bitcoin.transaction.hash}</code> <Button basic><Icon name='linkify' title='Hyperlink' /></Button></div>
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
