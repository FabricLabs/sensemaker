'use strict';

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Breadcrumb,
  Button,
  Card,
  Header,
  Icon,
  Label,
  Segment
} = require('semantic-ui-react');

const toRelativeTime = require('../../../functions/toRelativeTime');
const truncateMiddle = require('../../../functions/truncateMiddle');

class MatrixRoom extends React.Component {
  constructor (props) {
    super(props);

    // Settings
    this.settings = Object.assign({
      debug: false,
      matrix: {},
      state: {
        matrix: {
          channels: [],
          servers: [],
          users: []
        }
      }
    }, props);


    // React State
    this.state = {
      ...this.settings.state
    };

    // Fabric State
    this._state = {
      matrix: {
        channels: {},
        servers: {},
        users: {}
      },
      content: this.settings.state
    };

    return this;
  }

  componentDidMount () {
    this.props.fetchMatrixStats();
    this.watcher = setInterval(() => {
      this.props.fetchMatrixStats();
    }, 60000);
  }

  componentWillUnmount () {
    clearInterval(this.watcher);
  }

  render () {
    const { matrix } = this.props;
    console.debug('[MATRIX]', 'Service:', matrix);
    return (
      <div style={{ minHeight: '100%', maxHeight: '100%', overflow: 'auto' }}>
        <div className='uppercase'>
          <Button onClick={() => { history.back(); }} icon color='black'><Icon name='left chevron' /> Back</Button>
          <Breadcrumb style={{ marginLeft: '1em' }}>
            <Breadcrumb.Section><Link to='/services/matrix'>Matrix</Link></Breadcrumb.Section>
          </Breadcrumb>
        </div>
        <Segment className='fade-in' loading={matrix?.loading} style={{ maxHeight: '100%' }}>
          <Header as='h1' style={{ marginTop: 0 }}><Icon name='hashtag' />{matrix.room?.name || 'unknown room'}</Header>
          <p>{matrix.room?.description}</p>
        </Segment>
        <div>
          {matrix.room && matrix.room.messages && matrix.room.messages.map((message, index) => {
            return (
              <Segment key={message.id} loading={matrix.loading} style={{ maxHeight: '100%', height: 'auto' }}>
                <Header as='h3'>{message.sender}</Header>
                <p>{message.body}</p>
                <Label as='span' color='grey' size='tiny'>{toRelativeTime(message.timestamp)}</Label>
              </Segment>
            );
          })}
        </div>
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = MatrixRoom;
