'use strict';

const React = require('react');
const { Link} = require('react-router-dom');

const {
  Divider, Label, Pagination, Message
} = require('semantic-ui-react');

class AdminMemoriesTab extends React.Component {
  constructor (props) {
    super(props);

    this.settings = Object.assign({
      state: {
        alias: 'SENSEMAKER',
        name: 'sensemaker',
        statistics: {
          counts: {
            memories: 0
          }
        },
        currentPage: 1,
        windowWidth: window.innerWidth
      }
    }, props);

    this.state = this.settings.state;
  }

  componentDidMount () {
    console.debug('AdminMemoriesTab mounted');
    this.props.fetchResource('/memories');
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResize);
  }

  handlePaginationChange = (e, { activePage }) => {
    this.setState({ currentPage: activePage });
  };

  handleResize = () => {
    this.setState({ windowWidth: window.innerWidth });
  };

  render () {
    const { resource, api } = this.props;
    const { currentPage, windowWidth } = this.state;
    const loading = api && api.loading === true;
    const fetchError = api && api.error;

    if (loading) {
      return (
        <adminMemoriesTab>
          <Message info>
            <Message.Header>Loading memories...</Message.Header>
            <p>Please wait while we fetch the data.</p>
          </Message>
        </adminMemoriesTab>
      );
    }

    if (fetchError) {
      const msg = fetchError.message || (typeof fetchError === 'string' ? fetchError : 'Request failed.');
      return (
        <adminMemoriesTab>
          <Message negative>
            <Message.Header>Could not load memories</Message.Header>
            <p>{msg}</p>
          </Message>
        </adminMemoriesTab>
      );
    }

    if (!resource || !Array.isArray(resource.memories)) {
      return (
        <adminMemoriesTab>
          <Message warning>
            <Message.Header>No memory data</Message.Header>
            <p>The server did not return a memories list.</p>
          </Message>
        </adminMemoriesTab>
      );
    }

    // Math for pagination of memory list
    const itemsPerPage = windowWidth < 480 ? 10 : windowWidth < 768 ? 15 : 20;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentMemories = resource.memories.slice(indexOfFirstItem, indexOfLastItem);

    return (
      <adminMemoriesTab>
        <container>
          {currentMemories && currentMemories.length > 0 ? (
            currentMemories.map(memory => (
              <div key={memory.id}>
                <Link to={'/memories/' + encodeURIComponent(memory.id)}>
                  <span><Label>{memory.creator_name || 'you'}</Label></span>&nbsp;
                  <abbr title={memory.created_at || ''}>{memory.created_at ? new Date(memory.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' }) : '—'}</abbr>{': '}
                  <span>{memory.title}</span>
                </Link>
                <Divider style={{ marginTop: '0.3em', marginBottom: '0.3em' }} />
              </div>
            ))
          ) : (
            <Message info>
              <Message.Header>No memories found</Message.Header>
              <p>There are currently no memories to display.</p>
            </Message>
          )}
        </container>
        {currentMemories && currentMemories.length > 0 && (
          <Pagination
            size='tiny'
            activePage={currentPage}
            totalPages={Math.ceil(resource.memories.length / itemsPerPage)}
            onPageChange={this.handlePaginationChange}
            ellipsisItem={(windowWidth > 480) ? undefined : null}
            firstItem={(windowWidth > 480) ? undefined : null}
            lastItem={(windowWidth > 480) ? undefined : null}
            boundaryRange={(windowWidth > 480) ? 1 : 0}
            style={{ marginTop: '1em' }}
          />
        )}
      </adminMemoriesTab>
    );
  }
}

module.exports = AdminMemoriesTab;
