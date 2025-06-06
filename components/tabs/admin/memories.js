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
    const { resource } = this.props;
    const { currentPage, windowWidth } = this.state;

    // Show loading state if resource is not yet loaded
    if (!resource || !resource.memories) {
      return (
        <adminMemoriesTab>
          <Message info>
            <Message.Header>Loading memories...</Message.Header>
            <p>Please wait while we fetch the data.</p>
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
                <Link to={'/memories/' + memory.id}>
                  <span><Label>{memory.creator_name || 'you'}</Label></span>&nbsp;
                  <abbr title={memory.created_at}>{new Date(memory.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })}</abbr>{": "}
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
