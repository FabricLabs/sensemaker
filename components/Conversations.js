'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');
const { Segment, Pagination, Divider } = require('semantic-ui-react');

class Conversations extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      itemsPerPage: 15,
      windowWidth: window.innerWidth
    };
  }

  componentDidMount() {
    this.props.fetchConversations();
    window.addEventListener('resize', this.handleResize);
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handlePaginationChange = (e, { activePage }) => {
    this.setState({ currentPage: activePage });
  };
  handleResize = () => {
    this.setState({ windowWidth: window.innerWidth });
  };

  render() {
    const { loading, error, conversations } = this.props;
    const { currentPage, itemsPerPage, windowWidth } = this.state;


    if (loading) {
      return <div>Loading...</div>;
    }

    if (error) {
      return <div>Error: {error}</div>;
    }

    // Calculate conversations for current page
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentConversations = conversations.slice(indexOfFirstItem, indexOfLastItem);

    return (
      <Segment className='fade-in' fluid style={{ marginRight: '1em' }}>
        <h2>Conversations</h2>
        {currentConversations.map(conversation => (
          <div key={conversation.id}>
            <h4>
              <Link to={'/conversations/' + conversation.id}>
                {new Date(conversation.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })}{": "}
                {conversation.title}
              </Link>
            </h4>
            {/* <p>{conversation.content}</p> */}
           <Divider />
          </div>
        ))}
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
