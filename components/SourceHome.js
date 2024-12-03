'use strict';

// Dependencies
const React = require('react');
const { Link } = require('react-router-dom');

// Semantic UI
const {
  Button,
  Header,
  Icon,
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
  }

  render () {
    const now = new Date();
    const { network, sources } = this.props;
    return (
      <Segment className='fade-in' loading={sources?.loading} style={{ maxHeight: '100%', height: '97vh' }}>
        <h2>Sources</h2>
        <p>Remote data sources can be added to improve coverage.</p>
        <div>
          <Button color='blue' as={Link} to='/services/discord/authorize'>
            <Icon name='discord' /> Discord
          </Button>
        </div>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Source</Table.HeaderCell>
              <Table.HeaderCell>URL</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {sources?.current?.map((source, index) => {
              return (
                <Table.Row key={index}>
                  <Table.Cell>{source.name}</Table.Cell>
                  <Table.Cell>{source.url}</Table.Cell>
                  <Table.Cell>
                    <a href={source.url} target='_blank'>View</a>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
        <ChatBox {...this.props} context={{ sources: sources?.current }} placeholder='Ask about these sources...' />
        <div>
          <Button floated='right' onClick={this.props.addPeer}>Add Peer <Icon name='add' /></Button>
          <Header as='h2'>Peers</Header>
        </div>
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
