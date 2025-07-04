'use strict';

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

// Components
// Semantic UI
const {
  Button,
  Card,
  Form,
  Segment,
  Header,
  Label,
  List,
  Loader,
  Input,
  Divider,
  Icon,
  StatisticValue,
  StatisticLabel,
  Statistic,
  Table
} = require('semantic-ui-react');

class WalletHome extends React.Component {
  constructor (settings = {}) {
    super(settings);

    this.state = {
      loading: false
    };

    return this;
  }

  componentDidMount () {
    this.props.fetchKeys();
  }

  toggleCreateKeyModal () {
    console.debug('creating modal...');
  }

  togglePaymentCreateModal () {
    console.debug('creating modal...');
  }

  render () {
    const { network, wallet = {} } = this.props;
    console.debug('wallet:', wallet);
    // const { loading } = this.state;
    return (
      <Segment className='fade-in' loading={network?.loading} style={{ maxHeight: '100%', height: '97vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center' }}>
          <h1 style={{ marginTop: '0' }}>Wallet</h1>
          <Button.Group>
            <Button icon color='black' onClick={this.togglePaymentCreateModal.bind(this)}><Icon name='send' /> &nbsp; Pay... </Button>
            <Button icon color='green' onClick={this.toggleCreateKeyModal.bind(this)}>Add Funds <Icon name='add' /></Button>
          </Button.Group>
        </div>
        <Header as='h2'>Overview</Header>
        <Statistic>
          <StatisticValue>{wallet?.balance ?? 0}</StatisticValue>
          <StatisticLabel>balance</StatisticLabel>
        </Statistic>
        <Statistic>
          <StatisticValue>{wallet?.spendable ?? 0}</StatisticValue>
          <StatisticLabel>spendable</StatisticLabel>
        </Statistic>
        <Statistic>
          <StatisticValue>{wallet?.unconfirmed ?? 0}</StatisticValue>
          <StatisticLabel>unconfirmed</StatisticLabel>
        </Statistic>
        <Header as='h2'>Unspent Transactions</Header>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell></Table.HeaderCell>
              <Table.HeaderCell></Table.HeaderCell>
              <Table.HeaderCell></Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {wallet && wallet.utxos && wallet.utxos.map((x) => {
              return (
                <Table.Row>
                  <Table.Cell></Table.Cell>
                  <Table.Cell>{x.title}</Table.Cell>
                  <Table.Cell>
                    <Icon name='note' />
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
        <Header as='h2'>Keys</Header>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell></Table.HeaderCell>
              <Table.HeaderCell></Table.HeaderCell>
              <Table.HeaderCell></Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {wallet && wallet.keys && wallet.keys.map((x) => {
              return (
                <Table.Row>
                  <Table.Cell></Table.Cell>
                  <Table.Cell>{x.title}</Table.Cell>
                  <Table.Cell>
                    <Icon name='pencil' />
                    <Icon name='archive' />
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
        {/* <ChatBox {...this.props} context={{ keys: keys.keys }} placeholder='Ask about these keys...' /> */}
      </Segment>
    );
  }

  _toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }

  toHTML () {
    return this._toHTML();
  }
}

module.exports = WalletHome;
