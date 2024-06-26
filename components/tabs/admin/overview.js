'use strict';

const React = require('react');
const {
  Header,
  Icon,
  List,
  Statistic,
} = require('semantic-ui-react');

class AdminOverviewTab extends React.Component {
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
    const { stats } = this.props;
    const inquiriesWaiting = stats?.inquiries?.waiting ?? 0;
    const invitationsTotal = stats?.invitations?.total ?? 0;
    const usersTotal = stats?.users?.total ?? 0;

    return ( 
      <adminOverviewTab>
        <Header as='h4'>Metrics</Header>
        <Statistic>
          <Statistic.Value>???</Statistic.Value>
          <Statistic.Label><abbr title="0 of 0 comments were positive">Accuracy</abbr></Statistic.Label>
        </Statistic>
        <Statistic>
          <Statistic.Value>{usersTotal}</Statistic.Value>
          <Statistic.Label>Users</Statistic.Label>
        </Statistic>
        <Statistic>
          <Statistic.Value>0</Statistic.Value>
          <Statistic.Label>Conversations</Statistic.Label>
        </Statistic>
        <Statistic>
          <Statistic.Value>0</Statistic.Value>
          <Statistic.Label>Messages</Statistic.Label>
        </Statistic>
        <Statistic>
          <Statistic.Value>0</Statistic.Value>
          <Statistic.Label><abbr title="Feedback on a message, with sentiment and (optionally) rating, content, etc.">Comments</abbr></Statistic.Label>
        </Statistic>
        <Statistic>
          <Statistic.Value>{inquiriesWaiting}</Statistic.Value>
          <Statistic.Label>Waiting</Statistic.Label>
        </Statistic>
        <Statistic>
          <Statistic.Value>{invitationsTotal}</Statistic.Value>
          <Statistic.Label>Invited</Statistic.Label>
        </Statistic>
        <Header as='h4'>Resources</Header>
        <List>
          <List.Item>
            <Icon name='file alternate outline' />
            <a href="/courts.sql">Courts (SQL)</a>
          </List.Item>
        </List>
      </adminOverviewTab>
    )
  }
}

module.exports = AdminOverviewTab;
