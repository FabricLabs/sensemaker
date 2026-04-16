'use strict';

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

// Components
// Semantic UI
const {
  Breadcrumb,
  Button,
  Form,
  Header,
  Icon,
  Input,
  Segment,
  Table
} = require('semantic-ui-react');

// Local Components
const ChatBox = require('../ChatBox');

const toRelativeTime = require('../../functions/toRelativeTime');
const truncateMiddle = require('../../functions/truncateMiddle');
const { ENABLE_NETWORK } = require('../../constants');

class FabricHome extends React.Component {
  constructor (props) {
    super(props);

    // Settings
    this.settings = Object.assign({
      debug: false,
      fabric: {},
      state: {
        fabric: {}
      }
    }, props);


    // React State
    this.state = {
      ...this.settings.state,
      peerContent: ''
    };

    // Fabric State
    this._state = {
      fabric: {},
      content: this.settings.state
    };

    return this;
  }

  componentDidMount () {
    this.props.fetchFabricStats();
    if (typeof this.props.fetchPeers === 'function') {
      this.props.fetchPeers();
    }
    this.watcher = setInterval(() => {
      this.props.fetchFabricStats();
    }, 60000);
  }

  componentWillUnmount () {
    clearInterval(this.watcher);
  }

  handlePeerInputChange = (e) => {
    this.setState({ peerContent: e.target.value });
  };

  handlePeerSubmit = async () => {
    const raw = (this.state.peerContent || '').trim();
    if (!raw || typeof this.props.createPeer !== 'function') return;
    const addr = raw.replace(/^fabric:/i, '').trim();
    try {
      await this.props.createPeer({ address: addr });
      this.setState({ peerContent: '' });
      if (typeof this.props.fetchPeers === 'function') this.props.fetchPeers();
    } catch (err) {
      console.error('[FABRIC]', 'Add peer failed:', err);
    }
  };

  render () {
    const { fabric, peers: peersState, auth } = this.props;
    const reduxPeers = (peersState && Array.isArray(peersState.peers) && peersState.peers) || [];
    const isAdmin = !!(auth && auth.isAdmin);
    const canManagePeers = ENABLE_NETWORK && isAdmin;
    console.debug('[FABRIC]', 'Service:', fabric);
    return (
      <div>
        <div className='uppercase'>
          <Button onClick={() => { history.back(); }} icon color='black'><Icon name='left chevron' /> Back</Button>
          <Breadcrumb style={{ marginLeft: '1em' }}>
            <Breadcrumb.Section><Link to='/services/fabric'>Fabric</Link></Breadcrumb.Section>
          </Breadcrumb>
        </div>
        <Segment className='fade-in' loading={fabric?.loading} style={{ maxHeight: '100%' }}>
          <Header as='h1' style={{ marginTop: 0 }}><Icon name='cloud' />Fabric</Header>
          <p>Fabric is peer-to-peer alternative to the World Wide Web.</p>
        </Segment>
        <Segment className='fade-in' loading={fabric?.loading} style={{ maxHeight: '100%' }}>
          <Header as='h2'>Popular Documents</Header>
          <ul>
            {fabric?.documents?.map((doc, index) => {
              return (
                <li key={index}>
                  <Link to={`/services/fabric/documents/${doc.id}`}>{doc.title}</Link> - {truncateMiddle(doc.content, 100)} - {toRelativeTime(doc.createdAt)}
                </li>
              );
            })}
          </ul>
        </Segment>
        <Header as='h2'>Peers</Header>
        {canManagePeers ? (
          <Form huge fluid>
            <Form.Field fluid>
              <label>Address</label>
              <Input
                fluid
                placeholder='host:7777 or pubkey@host:7777'
                value={this.state.peerContent}
                onChange={this.handlePeerInputChange}
                action={<Button type='button' onClick={this.handlePeerSubmit} labelPosition='right'>Add Peer <Icon name='add' /></Button>}
              />
            </Form.Field>
          </Form>
        ) : (
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            Adding Fabric peers from this page requires an administrator account (use Network in the sidebar when available).
          </p>
        )}
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Peer</Table.HeaderCell>
              <Table.HeaderCell>Address</Table.HeaderCell>
              <Table.HeaderCell>Port</Table.HeaderCell>
              <Table.HeaderCell>Protocol</Table.HeaderCell>
              <Table.HeaderCell>Connected</Table.HeaderCell>
              <Table.HeaderCell>Controls</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {reduxPeers.map(instance => {
              return (<Table.Row key={instance.id}>
                <Table.Cell>
                  {canManagePeers ? (
                    <Link to={'/peers/' + instance.id}>{instance.title}</Link>
                  ) : (
                    <span title='Open Network (admin) for peer details and controls.'>{instance.title}</span>
                  )}
                </Table.Cell>
                <Table.Cell>{instance.address}</Table.Cell>
                <Table.Cell>{instance.port}</Table.Cell>
                <Table.Cell>{instance.protocol}</Table.Cell>
                <Table.Cell>{instance.connected ? <Icon name='check' color='green' /> : <Icon name='close' color='red' />}</Table.Cell>
                <Table.Cell>
                  <Button disabled title='Disconnect controls are managed from Network (admin).'>
                    <Icon name='stop' />
                  </Button>
                </Table.Cell>
              </Table.Row>);
            })}
          </Table.Body>
        </Table>
        <ChatBox {...this.props} context={{ fabric: fabric }} placeholder='Ask about Fabric...' />
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = FabricHome;
