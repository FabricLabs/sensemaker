'use strict';

// Dependencies
const React = require('react');
const { Link } = require('react-router-dom');

// Semantic UI
const {
  Button,
  Divider,
  Form,
  Header,
  Icon,
  Input,
  Label,
  Segment,
  Table
} = require('semantic-ui-react');

// Fabric Types
const Actor = require('@fabric/core/types/actor');

// Local Components
const ChatBox = require('./ChatBox');

// TODO: reduce to a web component (no react)
class SourceHome extends React.Component {
  constructor (props) {
    super(props);

    // Settings
    this.creation = new Date();
    this.settings = Object.assign({
      clock: 0,
      debug: false,
      interval: 1000
    }, props);

    // State
    this.heart = null;
    this.style = this.props.style || {};
    this.state = {
      content: {
        clock: this.settings.clock,
        interval: this.settings.interval
      }
    };

    // Fabric State
    this._state = {
      content: JSON.parse(JSON.stringify(this.state))
    };

    return this;
  }

  // TODO: reconcile with Fabric API
  commit () {
    return new Actor({
      content: this._state.content
    });
  }

  componentDidMount () {
    this.start();
    this.props.fetchPeers();
    this.props.fetchSources();
  }

  handleSourceInputChange = (e) => {
    this.setState({ sourceContent: e.target.value });
  }

  handleSourceSubmit = async (e) => {
    this.setState({ loading: true })
    const group = await this.props.createSource({ content: this.state.sourceContent });
    this.setState({ sourceContent: '', loading: false });
    this.props.fetchSources();
  }

  handlePeerInputChange = (e) => {
    this.setState({ peerAddress: e.target.value });
  }

  handlePeerSubmit = async (e) => {
    this.setState({ loading: true })
    const group = await this.props.createPeer({ address: this.state.peerAddress });
    this.setState({ peerAddress: '', loading: false });
    this.props.fetchSources();
  }

  render () {
    const now = new Date();
    const { network, peers, sources } = this.props;
    return (
      <Segment className='fade-in' loading={sources?.loading} style={{ maxHeight: '100%', height: '97vh' }}>
        <h2>Sources</h2>
        <p>Remote data sources can be added to improve coverage.</p>
        <div>
          <Button.Group>
            <Button color='orange' as={Link} to='/services/bitcoin'><Icon name='bitcoin' /> Bitcoin</Button>
            <Button color='blue' as={Link} to='/services/discord'><Icon name='discord' /> Discord</Button>
            <Button color='green' as={Link} to='/services/fabric'><Icon name='cloud' /> Fabric</Button>
            <Button color='white' as={Link} to='/services/github'><Icon name='github alt' /> GitHub</Button>
            <Button color='black' as={Link} to='/services/matrix'><Icon name='hashtag' /> Matrix</Button>
          </Button.Group>
        </div>
        <Divider />
        <Form huge fluid>
          <Form.Field fluid>
            <label>Link</label>
            <Input fluid placeholder='e.g., https://goon.vc, etc.' value={this.state.sourceContent} onChange={this.handleSourceInputChange} action={<Button onClick={this.handleSourceSubmit}>Create Source</Button>} />
          </Form.Field>
        </Form>
        <Table style={{ clear: 'both' }}>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>URL</Table.HeaderCell>
              <Table.HeaderCell>Recurrence</Table.HeaderCell>
              <Table.HeaderCell>Last Retrieved</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {sources?.sources?.map((source, index) => {
              return (
                <Table.Row key={index} id={source.id}>
                  <Table.Cell>{source.name}</Table.Cell>
                  <Table.Cell><a href={source.content} target='_blank'><code>{source.content}</code> <Icon name='external alternate' /></a></Table.Cell>
                  <Table.Cell>{source.recurrence}</Table.Cell>
                  <Table.Cell textAlign='center'>
                      {source.last_retrieved ? (
                        <Label><Link to={`/blobs/${source.latest_blob_id}`} target='_blank'><Icon name='file' /> {source.last_retrieved}</Link></Label>
                      ) : (<p>Initializing...</p>)}
                  </Table.Cell>
                  <Table.Cell textAlign='right'>
                    <Button.Group>
                      <Button icon labelPosition='left'><Icon name='sync' /> Sync</Button>
                      <Button icon labelPosition='right'>Discuss <Icon name='right chevron' /></Button>
                    </Button.Group>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
        <ChatBox {...this.props} context={{ sources: sources?.sources }} placeholder='Ask about these sources...' />
        <Divider />
        <Header as='h2'>Peers</Header>
        <Form huge fluid>
          <Form.Field fluid>
            <label>Address</label>
            <Input fluid placeholder='fabric:10.0.0.1:7777' value={this.state.peerContent} onChange={this.handlePeerInputChange} action={<Button onClick={this.handlePeerSubmit} labelPosition='right'>Add Peer <Icon name='add' /></Button>} />
          </Form.Field>
        </Form>
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
            {network && network.peers && network.peers
              .map(instance => {
                return (<Table.Row>
                  <Table.Cell><Link to={"/peers/" + instance.id}>{instance.title}</Link></Table.Cell>
                  <Table.Cell>{instance.address}</Table.Cell>
                  <Table.Cell>{instance.port}</Table.Cell>
                  <Table.Cell>{instance.protocol}</Table.Cell>
                  <Table.Cell>{instance.connected ? <Icon name='check' color='green' /> : <Icon name='close' color='red' />}</Table.Cell>
                  <Table.Cell><Button><Icon name='stop' /></Button></Table.Cell>
                </Table.Row>)
              })}
          </Table.Body>
        </Table>
      </Segment>
    );
  }

  start () {
    this._state.content.status = 'STARTING';
    // this.heart = setInterval(this.tick.bind(this), this.settings.interval);
    this._state.content.status = 'STARTED';
    this.commit();
  }

  stop () {
    this._state.content.status = 'STOPPING';
    clearInterval(this.heart);
    this._state.content.status = 'STOPPED';
    this.commit();
  }
}

module.exports = SourceHome;
