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

const toRelativeTime = require('../../functions/toRelativeTime');
const truncateMiddle = require('../../functions/truncateMiddle');

class MatrixHome extends React.Component {
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
      <div style={{ minHeight: '100%', maxHeight: '100%', overflowX: 'auto' }}>
        <div className='uppercase'>
          <Button onClick={() => { history.back(); }} icon color='black'><Icon name='left chevron' /> Back</Button>
          <Breadcrumb style={{ marginLeft: '1em' }}>
            <Breadcrumb.Section><Link to='/services/matrix'>Matrix</Link></Breadcrumb.Section>
          </Breadcrumb>
        </div>
        <Segment className='fade-in' loading={matrix?.loading} style={{ maxHeight: '100%' }}>
          <Header as='h1' style={{ marginTop: 0 }}><Icon name='hashtag' />Matrix</Header>
          <p>Matrix is a decentralized chat network.</p>
        </Segment>
        <Header as='h2'>Rooms</Header>
        <Card.Group loading={matrix?.loading}>
          {matrix?.rooms?.slice(0, 10).map((doc, index) => {
            return (
              <Card key={index} as={Link} to={`/services/matrix/rooms/${doc.room_id}`}>
                <Card.Content>
                  <Card.Header>{doc.name}</Card.Header>
                  <p>{doc.topic}</p>
                </Card.Content>
                <Card.Content extra>
                  <Label><code>{doc.canonical_alias}</code></Label>
                  <Label><Icon name='users' /><abbr title={doc.num_joined_members + ' members'}>{Number(doc.num_joined_members).toLocaleString()}</abbr></Label>
                </Card.Content>
              </Card>
            );
          })}
        </Card.Group>
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = MatrixHome;
