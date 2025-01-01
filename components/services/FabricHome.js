'use strict';

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Breadcrumb,
  Button,
  Header,
  Icon,
  Segment
} = require('semantic-ui-react');

const toRelativeTime = require('../../functions/toRelativeTime');
const truncateMiddle = require('../../functions/truncateMiddle');

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
      ...this.settings.state
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
    this.watcher = setInterval(() => {
      this.props.fetchFabricStats();
    }, 60000);
  }

  componentWillUnmount () {
    clearInterval(this.watcher);
  }

  render () {
    const { fabric } = this.props;
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
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = FabricHome;
