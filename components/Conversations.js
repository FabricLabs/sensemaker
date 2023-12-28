'use strict';

// React
const React = require('react');
const ReactDOMServer = require('react-dom/server');

// Semantic UI
const { Link } = require('react-router-dom');
const { Label, Segment, Pagination, Divider, Button } = require('semantic-ui-react');

// Components
const ChatBox = require('./ChatBox');

/**
 * The Jeeves UI.
 * @param {Object} props Properties for the component.
 **/
class Conversations extends React.Component {
  constructor (props) {
    super(props);

    this.messagesEndRef = React.createRef();

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

    const componentStyle = {
      display: 'absolute',
      top: '1em',
      left: 'calc(350px + 1em)',
      height: 'calc(100vh - 5rem)', // Set a maximum height
      bottom: '1em',
      paddingRight: '0em',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',  
      paddingBottom: '0'     
    };

    return (
      <Segment className='fade-in' fluid>
        <h2>Conversations</h2>
        {(currentConversations && currentConversations.length) ? currentConversations.map(conversation => (
          <div key={conversation.id}>
            <h4 style={{marginBottom:'0.5em'}}>
              <Link to={'/conversations/' + conversation.id}>
                {new Date(conversation.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })}{": "}
                {conversation.title}
              </Link>
            </h4> 
           <Divider style={{marginTop: '0.3em',marginBottom:'0.5em'}}/>
          </div>
        )) : <div  ref={this.messagesEndRef} style={componentStyle}>
          {/* <div style={{marginBottom: '2em'}}>We haven't had any conversations yet.</div> */}
          {/* <Button as={Link} to='/conversations/new' primary>Ask a Question</Button> */}
          <ChatBox 
            {...this.props}
            messagesEndRef={this.messagesEndRef}
            includeFeed={true}
            placeholder={'Ask me anything...'}
          />

        </div>}
        {(currentConversations.length > itemsPerPage) ? <Pagination
          size='tiny'
          activePage={currentPage}
          totalPages={Math.ceil(conversations.length / itemsPerPage)}
          onPageChange={this.handlePaginationChange}
          ellipsisItem={(windowWidth>480)? undefined : null}
          boundaryRange={(windowWidth>480) ? 1 : 0}
        /> : null}
      </Segment>
    );
  }
}

module.exports = Conversations;
