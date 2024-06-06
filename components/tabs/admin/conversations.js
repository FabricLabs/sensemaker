'use strict';

const React = require('react');
const { Link} = require('react-router-dom');

const {
  Divider, Label, Pagination
} = require('semantic-ui-react');


class AdminConversationsTab extends React.Component {
  constructor(props) {
    super(props);

    this.settings = Object.assign({
      state: {
        alias: 'JEEVES',
        name: 'jeeves',
        statistics: {
          counts: {
            waitlist: 0,
            pending: 0, // pending invitations
            users: 0,
            conversations: 0,
            messages: 0,
            courts: 0,
            cases: 0,
            documents: 0
          }
        },
        waitlistSignupCount: 0,
        currentPage: 1,
        windowWidth: window.innerWidth
      }
    }, props);

    this.state = this.settings.state;
  }

  componentDidMount() {
    this.props.fetchAdminStats();
    //this is not doing anything yet
    //this.props.fetchAllConversationsFromAPI();
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

  render () {
    const { conversations } = this.props;

    const { currentPage, windowWidth, } = this.state;

    // Math for pagination of conversation list
    const itemsPerPage = windowWidth < 480 ? 10 : windowWidth < 768 ? 15 : 20;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentConversations = conversations.slice(indexOfFirstItem, indexOfLastItem);

    return ( 
      <adminConversationsTab>
        <container>
          {currentConversations.map(conversation => (
            <div key={conversation.id}>
              <Link to={'/conversations/' + conversation.id}>
                <span><Label>{conversation.creator_name || 'you'}</Label></span>&nbsp;
                <abbr title={conversation.created_at}>{new Date(conversation.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })}</abbr>{": "}
                <span>{conversation.title}</span>
              </Link>
              <Divider style={{ marginTop: '0.3em', marginBottom: '0.3em' }} />
            </div>
          ))}
        </container>
        <Pagination
          size='tiny'
          activePage={currentPage}
          totalPages={Math.ceil(conversations.length / itemsPerPage)}
          onPageChange={this.handlePaginationChange}
          ellipsisItem={(windowWidth > 480) ? undefined : null}
          firstItem={(windowWidth > 480) ? undefined : null}
          lastItem={(windowWidth > 480) ? undefined : null}
          boundaryRange={(windowWidth > 480) ? 1 : 0}
          style={{ marginTop: '1em' }}
        />
      </adminConversationsTab>
    )
  }
}

module.exports = AdminConversationsTab;