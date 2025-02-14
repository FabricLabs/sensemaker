'use strict';

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const {
  Link,
  useParams
} = require('react-router-dom');

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

class DiskPath extends React.Component {
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
    const path = window.location.pathname.split('/').slice(3).join('/');
    this.props.fetchDiskPath(path);
    this.watcher = setInterval(() => {
      this.props.fetchDiskPath(path);
    }, 60000);
  }

  componentWillUnmount () {
    clearInterval(this.watcher);
  }

  render () {
    const { disk } = this.props;
    console.debug('[DISK]', 'Service:', disk);
    const parts = window.location.pathname.split('/');
    return (
      <div style={{ maxHeight: '100%', minHeight: '100%', overflowY: 'auto' }}>
        <div className='uppercase'>
          <Button onClick={() => { history.back(); }} icon color='black'><Icon name='left chevron' /> Back</Button>
          <Breadcrumb style={{ marginLeft: '1em' }}>
            <Breadcrumb.Section><Link to='/services/disk'>Disk</Link></Breadcrumb.Section>
            <Breadcrumb.Divider />
            {parts.slice(3).map((part, index) => {
              return (
                <Breadcrumb.Section key={index}>
                  <Link to={`/services/disk/${parts.slice(3, index + 1).join('/')}`}>{part}</Link>
                </Breadcrumb.Section>
              );
            }).join(<Breadcrumb.Divider />)}
          </Breadcrumb>
        </div>
        {disk.object?.isFile ? (
          <Segment className='fade-in' loading={disk?.loading} style={{ maxHeight: '100%' }}>
            <Header as='h2'>{disk.object?.name || 'Loading...'}</Header>
            <div>
              <code>
                <pre>{disk.object?.content || 'Loading...'}</pre>
              </code>
            </div>
          </Segment>
        ) : null}
        {disk.object?.isDirectory ? (
          <DiskTable loading={disk.loading} disk={disk} {...this.props} />
        ) : null}
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}



function PathView (props) {
  const { path } = useParams();
  return <DiskPath path={path} {...props} />;
}

module.exports = PathView;
