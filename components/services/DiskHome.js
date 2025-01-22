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
  Segment,
  Table
} = require('semantic-ui-react');

const DiskTable = require('./disk/DiskTable');

// Functions
const toRelativeTime = require('../../functions/toRelativeTime');
// const truncateMiddle = require('../../functions/truncateMiddle');

class DiskHome extends React.Component {
  constructor (props) {
    super(props);

    // Settings
    this.settings = Object.assign({
      debug: false,
      disk: {},
      state: {
        disk: {}
      }
    }, props);

    // React State
    this.state = {
      ...this.settings.state
    };

    // Fabric State
    this._state = {
      disk: {},
      content: this.settings.state
    };

    return this;
  }

  componentDidMount () {
    this.props.fetchDiskStats();
    this.watcher = setInterval(() => {
      this.props.fetchDiskStats();
    }, 60000);
  }

  componentWillUnmount () {
    clearInterval(this.watcher);
  }

  render () {
    const { disk } = this.props;
    console.debug('[DISK]', 'Service:', disk);
    return (
      <div style={{ maxHeight: '100%', minHeight: '100%', overflowY: 'auto' }}>
        <div className='uppercase'>
          <Button onClick={() => { history.back(); }} icon color='black'><Icon name='left chevron' /> Back</Button>
          <Breadcrumb style={{ marginLeft: '1em' }}>
            <Breadcrumb.Section><Link to='/services/disk'>Disk</Link></Breadcrumb.Section>
          </Breadcrumb>
        </div>
        <Segment className='fade-in' loading={disk?.loading} style={{ maxHeight: '100%' }}>
          <Header as='h1' style={{ marginTop: 0 }}><Icon name='disk' />Disk</Header>
          <p>Browse your local filesystem.</p>
        </Segment>
        <DiskTable loading={disk.loading} disk={disk} {...this.props} />
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = DiskHome;
