'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Button,
  Card,
  Segment,
  Header,
  Label,
  List,
  Loader,
  Divider,
  Icon,
  Table,
  Input,
  Form,
  Tab,
  Modal,
  Message
} = require('semantic-ui-react');

const FabricMessage = require('@fabric/core/types/message');

class NetworkHome extends React.Component {
  constructor (settings = {}) {
    super(settings);

    this.state = {
      loading: false,
      sourceContent: '',
      showConnectModal: false,
      connectionString: '',
      connectingPeer: false,
      fabricPeers: [],
      peerStats: {},
      activeTabIndex: 0,
      localPeer: {
        id: null,
        pubkey: null,
        address: '127.0.0.1',
        port: '7771', // Fabric P2P port from settings
        protocol: 'tcp',
        connected: true
      }
    };

    // Bind methods
    this.handleBridgeMessage = this.handleBridgeMessage.bind(this);
    this.handleHashChange = this.handleHashChange.bind(this);
    this.handleTabChange = this.handleTabChange.bind(this);
  }

  getInitialTabIndex () {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'web') {
      return 1; // Web tab is at index 1
    }
    return 0; // Default to Fabric tab (index 0)
  }

  componentDidMount () {
    this.props.fetchPeers();
    this.props.fetchSources();

    // Load Fabric peers from settings if available
    this.loadFabricPeers();

    // Set up bridge message handler if bridge is available
    if (this.props.bridge) {
      this.props.bridge.onMessage = this.handleBridgeMessage;
    }

    // Set initial tab from hash
    const initialTabIndex = this.getInitialTabIndex();
    this.setState({ activeTabIndex: initialTabIndex });

    // Listen for hash changes
    window.addEventListener('hashchange', this.handleHashChange);
  }

  componentWillUnmount () {
    // Clean up bridge message handler
    if (this.props.bridge) {
      this.props.bridge.onMessage = null;
    }

    // Clean up hash change listener
    window.removeEventListener('hashchange', this.handleHashChange);
  }

  componentDidUpdate (prevProps) {
    const { peers, sources } = this.props;
    if (prevProps.peers !== peers || prevProps.sources !== sources) {
      // if (!peers.loading && !sources.loading) {
      //   this.setState({ loading: false });
      // }
    }

    // Set up bridge handler if it becomes available
    if (!prevProps.bridge && this.props.bridge) {
      this.props.bridge.onMessage = this.handleBridgeMessage;
    }
  }

  loadFabricPeers = async () => {
    // Load peers from Fabric service via HTTP GET endpoint
    this.setState({ loading: true });

    try {
      // Make HTTP GET request to /peers endpoint
      console.debug('[NETWORK:HOME]', 'Requesting peer list from /peers endpoint...');
      const response = await fetch('/peers', {
        headers: {
          'Accept': 'application/json'
        }
      });
      const data = await response.json();

      console.debug('[NETWORK:HOME]', 'Received peer list response:', data);
      this.setState({ loading: false });

      if (data.success) {
        this.setState({
          fabricPeers: data.peers || [],
          peerStats: data.stats || {}
        });
        console.log('[NETWORK:HOME]', 'Peer list loaded successfully:', data.peers.length, 'peers');
      } else {
        console.error('[NETWORK:HOME]', 'Failed to load peer list:', data.error);
        this.setState({ fabricPeers: [] }); // Fall back to empty list
      }
    } catch (error) {
      console.error('[NETWORK:HOME]', 'Error loading Fabric peers:', error);
      this.setState({
        loading: false,
        fabricPeers: []  // Fall back to empty list
      });
    }
  }

  handleBridgeMessage = (message) => {
    console.debug('[NETWORK:HOME]', 'Received bridge message:', message);

    if (message.type === 'GenericMessage' && message.content) {
      try {
        const result = JSON.parse(message.content);
        console.debug('[NETWORK:HOME]', 'Parsed message content:', result);

        // Handle JSON-RPC responses
        if (result.method === 'JSONCallResult' && result.params && result.params.length > 1) {
          const methodName = result.params[0];
          const responseData = result.params[1];

          if (methodName === 'connectPeer') {
            console.debug('[NETWORK:HOME]', 'Received connectPeer response:', responseData);
            this.setState({ connectingPeer: false });

            if (responseData.success) {
              // Refresh peer list after successful connection
              this.loadFabricPeers();
              this.setState({ showConnectModal: false });
              console.log('[NETWORK:HOME]', 'Peer connected successfully:', responseData);
            } else {
              console.error('[NETWORK:HOME]', 'Peer connection failed:', responseData.error);
            }
          }
        }
      } catch (e) {
        console.debug('[NETWORK:HOME]', 'Content is not JSON, skipping parse');
      }
    }
  }

  handleHashChange = () => {
    const newTabIndex = this.getInitialTabIndex();
    if (newTabIndex !== this.state.activeTabIndex) {
      this.setState({ activeTabIndex: newTabIndex });
    }
  }

  handleTabChange = (e, { activeIndex }) => {
    // Update hash based on tab index
    const hash = activeIndex === 1 ? 'web' : 'fabric';
    window.location.hash = hash;
    this.setState({ activeTabIndex: activeIndex });
  }

  connectToPeer = async (connectionString) => {
    if (!this.props.bridge) {
      console.error('[NETWORK:HOME]', 'Bridge not available for peer connection');
      return;
    }

    this.setState({ connectingPeer: true });

    try {
      // Parse connection string format: pubkey@host:port or host:port
      const parts = connectionString.split('@');
      let pubkey = null;
      let address = connectionString;

      if (parts.length === 2) {
        pubkey = parts[0];
        address = parts[1];
      }

      const [host, port] = address.split(':');

      // Create the RPC call payload for peer connection
      const message = FabricMessage.fromVector(['JSONCall', JSON.stringify({
        method: 'connectPeer',
        params: [{
          host: host,
          port: parseInt(port) || 7777,
          pubkey: pubkey
        }]
      })]);

      // Send message via bridge
      console.debug('[NETWORK:HOME]', 'Sending connectPeer message:', message);
      this.props.bridge.sendMessage(message.toBuffer());

      // The response will be handled by handleBridgeMessage
    } catch (error) {
      console.error('[NETWORK:HOME]', 'Error connecting to peer:', error);
      this.setState({ connectingPeer: false });
    }
  }

  render () {
    const { network, auth } = this.props;
    const { fabricPeers, connectingPeer, loading, peerStats, activeTabIndex } = this.state;

    // Check if user is admin
    const isAdmin = auth && auth.isAdmin;

    const panes = [
      {
        menuItem: { key: 'fabric', icon: 'hashtag', content: 'Fabric' },
        render: () => (
          <Tab.Pane>
            <Card>
              <Card.Content>
                <Card.Header>Status</Card.Header>
                <Card.Meta>Connected</Card.Meta>
                <Card.Description>
                  <Icon name='check' color='green' /> Connected to the network.
                  {peerStats && Object.keys(peerStats).length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <strong>Stats:</strong> {peerStats.connected || 0} connected, {peerStats.total || 0} total peers
                    </div>
                  )}
                </Card.Description>
              </Card.Content>
            </Card>
            <Divider />
            <Header as='h2'>
              Peers
              <Button
                floated='right'
                size='small'
                icon='refresh'
                loading={loading}
                onClick={this.loadFabricPeers}
                content='Refresh'
              />
            </Header>
            {loading ? (
              <Segment>
                <Loader active inline='centered'>Loading peers...</Loader>
              </Segment>
            ) : (
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Peer</Table.HeaderCell>
                    <Table.HeaderCell>Alias</Table.HeaderCell>
                    <Table.HeaderCell>Address</Table.HeaderCell>
                    <Table.HeaderCell>Port</Table.HeaderCell>
                    <Table.HeaderCell>Protocol</Table.HeaderCell>
                    <Table.HeaderCell>Connected</Table.HeaderCell>
                    <Table.HeaderCell>Controls</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {/* Display Fabric peers from service */}
                  {fabricPeers.map(instance => {
                    return (<Table.Row key={instance.id}>
                      <Table.Cell>
                        <Link to={"/peers/" + instance.id}>{instance.title}</Link>
                        {instance.isLocal && <Label size='mini' color='blue'>Local</Label>}
                      </Table.Cell>
                      <Table.Cell>
                        {instance.alias ? (
                          <strong>{instance.alias}</strong>
                        ) : (
                          <span style={{color: '#999'}}>-</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>{instance.address}</Table.Cell>
                      <Table.Cell>{instance.port}</Table.Cell>
                      <Table.Cell>{instance.protocol}</Table.Cell>
                      <Table.Cell>{instance.connected ? <Icon name='check' color='green' /> : <Icon name='close' color='red' />}</Table.Cell>
                      <Table.Cell>
                        {!instance.isLocal && (
                          <Button size='small' disabled={!instance.connected}>
                            <Icon name='stop' />
                          </Button>
                        )}
                      </Table.Cell>
                    </Table.Row>)
                  })}
                  {/* Display network peers if available */}
                  {network && network.peers && network.peers
                    .map(instance => {
                      return (<Table.Row key={instance.id}>
                        <Table.Cell><Link to={"/peers/" + instance.id}>{instance.title}</Link></Table.Cell>
                        <Table.Cell>
                          {instance.alias ? (
                            <strong>{instance.alias}</strong>
                          ) : (
                            <span style={{color: '#999'}}>-</span>
                          )}
                        </Table.Cell>
                        <Table.Cell>{instance.address}</Table.Cell>
                        <Table.Cell>{instance.port}</Table.Cell>
                        <Table.Cell>{instance.protocol}</Table.Cell>
                        <Table.Cell>{instance.connected ? <Icon name='check' color='green' /> : <Icon name='close' color='red' />}</Table.Cell>
                        <Table.Cell><Button size='small'><Icon name='stop' /></Button></Table.Cell>
                      </Table.Row>)
                    })}
                  {fabricPeers.length === 0 && (!network || !network.peers || network.peers.length === 0) && (
                    <Table.Row>
                      <Table.Cell colSpan="7" textAlign="center">
                        No peers found. {loading ? 'Loading...' : 'Click Refresh to reload.'}
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table>
            )}
            <Divider />
            {/* Only show Connect Peer button for admins */}
            {isAdmin && (
              <Button primary content='+ Connect Peer' onClick={() => this.setState({
                showConnectModal: true,
                connectionString: ''
              })} />
            )}
            {!isAdmin && (
              <Message info>
                <Message.Header>Administrator Required</Message.Header>
                <p>Only administrators can add new peer connections.</p>
              </Message>
            )}
            <Modal
              open={this.state.showConnectModal}
              onClose={() => this.setState({ showConnectModal: false })}
              size='small'
            >
              <Modal.Header>Connect to Peer</Modal.Header>
              <Modal.Content>
                <Form>
                  <Form.Field>
                    <label>Connection String</label>
                    <Input
                      fluid
                      placeholder='e.g., pubkey@host:port or host:port'
                      value={this.state.connectionString}
                      onChange={(e) => this.setState({ connectionString: e.target.value })}
                    />
                    <div style={{ marginTop: '0.5em', fontSize: '0.9em', color: '#666' }}>
                      Enter a peer address in the format <code>host:port</code> or <code>pubkey@host:port</code>
                    </div>
                  </Form.Field>
                </Form>
              </Modal.Content>
              <Modal.Actions>
                <Button onClick={() => this.setState({ showConnectModal: false })}>
                  Cancel
                </Button>
                <Button
                  primary
                  loading={connectingPeer}
                  disabled={!this.state.connectionString.trim() || connectingPeer}
                  onClick={() => {
                    this.connectToPeer(this.state.connectionString.trim());
                  }}
                >
                  {connectingPeer ? 'Connecting...' : 'Try Connection'}
                </Button>
              </Modal.Actions>
            </Modal>
          </Tab.Pane>
        )
      },
      {
        menuItem: { key: 'web', icon: 'globe', content: 'Web' },
        render: () => (
          <Tab.Pane>
            <Header as='h2'>Sources</Header>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>URL</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell>Last Updated</Table.HeaderCell>
                  <Table.HeaderCell>Controls</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {this.props.sources?.loading ? (
                  <Table.Row>
                    <Table.Cell colSpan="4" textAlign="center">
                      <Loader active inline='centered'>Loading sources...</Loader>
                    </Table.Cell>
                  </Table.Row>
                ) : Array.isArray(this.props.sources?.sources) && this.props.sources.sources.length > 0 ? (
                  this.props.sources.sources.map((source) => {
                    const lastUpdated = source.last_retrieved || source.updated_at || source.created_at;
                    const hasError = source.last_error;
                    return (<Table.Row key={source.id}>
                      <Table.Cell><code><Link to={"/sources/" + source.id}>{source.content}</Link></code></Table.Cell>
                      <Table.Cell>
                        {hasError ? (
                          <Label color='red' title={source.last_error}>
                            <Icon name='warning circle' />
                            Failed
                          </Label>
                        ) : source.status === 'active' ? (
                          <Icon name='check' color='green' />
                        ) : (
                          <Icon name='close' color='red' />
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        {lastUpdated ? (
                          <abbr title={lastUpdated}>{new Date(lastUpdated).toLocaleString()}</abbr>
                        ) : (
                          <span style={{ color: '#999' }}>Never</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Button.Group>
                          <Button icon='play' disabled={source.status === 'active'} onClick={() => {
                            // TODO: Implement startSource action
                            console.warn('startSource not yet implemented');
                          }} />
                          <Button icon='stop' disabled={source.status !== 'active'} onClick={() => {
                            // TODO: Implement stopSource action
                            console.warn('stopSource not yet implemented');
                          }} />
                        </Button.Group>
                      </Table.Cell>
                    </Table.Row>)
                  })
                ) : (
                  <Table.Row>
                    <Table.Cell colSpan="4" textAlign="center">
                      No sources configured. Add one below.
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
            <Divider />
            <Form>
              <Form.Field>
                <label>Add Source URL</label>
                <Input
                  fluid
                  placeholder='e.g., https://goon.vc, etc.'
                  value={this.state.sourceContent || ''}
                  onChange={(e) => this.setState({ sourceContent: e.target.value })}
                  action={
                    <Button
                      onClick={async () => {
                        if (this.state.sourceContent) {
                          await this.props.createSource({ content: this.state.sourceContent });
                          this.setState({ sourceContent: '' });
                          // Sources will be automatically refetched by the createSource action
                        }
                      }}
                    >
                      Add Source
                    </Button>
                  }
                />
              </Form.Field>
            </Form>
          </Tab.Pane>
        )
      }
    ];

    return (
      <div loading={network.loading}>
        <Header as='h1'>Network</Header>
        {network && network.offers && network.offers.map((offer) => (
          <Message key={offer.id}>
            <Message.Header>0.00000000 BTC</Message.Header>
            <Message.Content>
                <code>{offer.id}</code>
                <code>{offer.id}</code>
                <code>{offer.type}</code>
                <code>{offer.status === 'active' ? <Icon name='check' color='green' /> : <Icon name='close' color='red' />}</code>
                <code>{offer.created ? new Date(offer.created).toLocaleString() : 'Never'}</code>
                <Button.Group>
                  <Button icon='play' disabled={offer.status === 'active'} onClick={() => this.props.startOffer(offer.id)} />
                  <Button icon='stop' disabled={offer.status !== 'active'} onClick={() => this.props.stopOffer(offer.id)} />
                </Button.Group>
              </Message.Content>
          </Message>
        ))}
        <Tab
          panes={panes}
          activeIndex={activeTabIndex}
          onTabChange={this.handleTabChange}
        />
      </div>
    );
  }

  _toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }

  toHTML () {
    return this._toHTML();
  }
}

module.exports = NetworkHome;
