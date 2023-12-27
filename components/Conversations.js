'use strict';

// React
const React = require('react');
const ReactDOMServer = require('react-dom/server');

// Semantic UI
const { Link } = require('react-router-dom');
const { Label, Segment, Pagination, Divider, Button } = require('semantic-ui-react');

/**
 * The Jeeves UI.
 * @param {Object} props Properties for the component.
 **/
class Conversations extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      currentPage: 1,
      windowWidth: window.innerWidth
    };
  }

  componentDidMount () {
    this.props.fetchConversations();
    window.addEventListener('resize', this.handleResize);
  }
  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResize);
  }

  handlePaginationChange = (e, { activePage }) => {
    this.setState({ currentPage: activePage });
  }

  handleResize = () => {
    this.setState({ windowWidth: window.innerWidth });
  }

  render () {
    const { loading, error, conversations } = this.props;
    const { currentPage,  windowWidth } = this.state;


    if (loading) {
      return <div>Loading...</div>;
    }

    if (error) {
      return <div>Error: {error}</div>;
    }

    // Calculate conversations for current page
    const itemsPerPage = windowWidth < 480 ? 10 : windowWidth < 768 ? 15 : 20;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentConversations = conversations.slice(indexOfFirstItem, indexOfLastItem);

    return (
      <Segment className='fade-in' fluid style={{ marginRight: '1em' }}>
        <h2>Conversations</h2>
        {currentConversations ? currentConversations.map(conversation => (
          <div key={conversation.id}>
            <h4 style={{marginBottom:'0.5em'}}>
              <Link to={'/conversations/' + conversation.id}>
                {new Date(conversation.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })}{": "}
                {conversation.title}
              </Link>
            </h4> 
           <Divider style={{marginTop: '0.3em',marginBottom:'0.5em'}}/>
          </div>
        )) : <div>
            <div>We haven't had any conversations yet.</div>
            <Button as={Link} to='/conversations/new' primary>Ask a Question</Button>
          </div>}
        <Pagination
          size='tiny'
          activePage={currentPage}
          totalPages={Math.ceil(conversations.length / itemsPerPage)}
          onPageChange={this.handlePaginationChange}
          ellipsisItem={(windowWidth>480)? undefined : null}
          boundaryRange={(windowWidth>480) ? 1 : 0}
        />
      </Segment>
    );
  }
}

module.exports = Conversations;
