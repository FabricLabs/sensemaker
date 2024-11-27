'use strict';

// Dependencies
const React = require('react');

// Semantic UI
const {
  Header,
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
    const { sources } = this.props;
    return (
      <Segment className='fade-in' loading={sources?.loading} style={{ maxHeight: '100%', height: '97vh' }}>
        <Header as='h1'>Sources</Header>
        <p>Remote data sources can be added to improve coverage.</p>
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
