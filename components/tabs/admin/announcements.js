'use strict';

const React = require('react');
const {
  Header,
  Icon,
  List,
  Statistic,
} = require('semantic-ui-react');

const AnnouncementCreator = require('../../AnnouncementCreator');

class AdminAnnouncementsTab extends React.Component {
  constructor(props) {
    super(props);

    this.settings = Object.assign({
      state: {
        alias: 'SENSEMAKER',
        name: 'sensemaker',
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
    return ( 
      <sensemaker-announcements>
        <p>Announcements are displayed to all users of this node.</p>
        <AnnouncementCreator />
      </sensemaker-announcements>
    )
  }
}

module.exports = AdminAnnouncementsTab;
