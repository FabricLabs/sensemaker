'use strict';

// Dependencies
const React = require('react');
const marked = require('marked');

// Components
const {
  Button,
  Icon,
  Message,
  Modal,
  Segment
} = require('semantic-ui-react');

class AnnouncementList extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      currentIndex: 0,
      modalOpen: false,
      modalLoading: false,
      error: null
    };
  }

  handlePrevious = () => {
    const { announcements } = this.props;
    if (!announcements || announcements.length <= 1) return;
    
    this.setState(prevState => ({
      currentIndex: prevState.currentIndex === 0 
        ? announcements.length - 1 
        : prevState.currentIndex - 1
    }));
  };

  handleNext = () => {
    const { announcements } = this.props;
    if (!announcements || announcements.length <= 1) return;
    
    this.setState(prevState => ({
      currentIndex: prevState.currentIndex === announcements.length - 1 
        ? 0 
        : prevState.currentIndex + 1
    }));
  };

  handleExpireClick = () => {
    this.setState({ modalOpen: true });
  };

  handleModalClose = () => {
    this.setState({ modalOpen: false, modalLoading: false, error: null });
  };

  handleExpireConfirm = async () => {
    const { announcements, editAnnouncement } = this.props;
    const { currentIndex } = this.state;
    const currentAnnouncement = announcements[currentIndex];

    this.setState({ modalLoading: true });

    try {
      const today = new Date();
      const dateString = today.toISOString().split('T')[0]; // Get just the date portion (YYYY-MM-DD)

      await editAnnouncement(currentAnnouncement.id, {
        expiration_date: dateString
      });

      this.setState({ modalOpen: false, modalLoading: false });
      this.fetchAnnouncements(); // Refresh announcements after expiring
    } catch (error) {
      console.error('Error expiring announcement:', error);
      this.setState({
        error: error.message || 'Failed to expire announcement. Please try again.',
        modalLoading: false
      });
    }
  };

  render () {
    const { announcements, isAdmin } = this.props;
    const { currentIndex, modalOpen, modalLoading, error } = this.state;
    
    if (!announcements || announcements.length === 0) {
      return null;
    }

    const currentAnnouncement = announcements[currentIndex];
    const showControls = announcements.length > 1;

    return (
      <Segment style={{ position: 'relative', padding: 0 }}>
        <Message info style={{
          margin: 0,
          borderRadius: showControls ? 0 : undefined
        }}>
          <Message.Header>
            <span>{currentAnnouncement?.title || 'Loading...'}</span>
          </Message.Header>
          <Message.Content>
            <span dangerouslySetInnerHTML={{ __html: marked.parse(currentAnnouncement?.body || 'Loading...') }} />
          </Message.Content>
        </Message>
        {showControls && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            zIndex: 10
          }}>
            {isAdmin && (
              <Button
                icon
                circular
                size="mini"
                onClick={this.handleExpireClick}
                title="Expire Announcement"
              >
                <Icon name="clock" />
              </Button>
            )}
            <Button
              icon
              circular
              size="mini"
              onClick={this.handlePrevious}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)'
              }}
            >
              <Icon name="chevron left" />
            </Button>
            <div style={{
              fontSize: '0.8em',
              color: '#666',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              padding: '2px 6px',
              borderRadius: '10px',
              minWidth: '30px',
              textAlign: 'center'
            }}>
              {currentIndex + 1} / {announcements.length}
            </div>
            <Button
              icon
              circular
              size="mini"
              onClick={this.handleNext}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)'
              }}
            >
              <Icon name="chevron right" />
            </Button>
          </div>
        )}
        <Modal
          open={modalOpen}
          onClose={this.handleModalClose}
          size="tiny"
        >
          <Modal.Header>
            Expire Announcement
          </Modal.Header>
          <Modal.Content>
            <p>Are you sure you want to expire this announcement? This action cannot be undone.</p>
            {error && (
              <Message error>
                <Message.Header>Error</Message.Header>
                <p>{error}</p>
              </Message>
            )}
          </Modal.Content>
          <Modal.Actions>
            <Button onClick={this.handleModalClose} disabled={modalLoading}>
              Cancel
            </Button>
            <Button
              negative
              onClick={this.handleExpireConfirm}
              loading={modalLoading}
              disabled={modalLoading}
            >
              Expire
            </Button>
          </Modal.Actions>
        </Modal>
      </Segment>
    );
  }
}

module.exports = AnnouncementList;
