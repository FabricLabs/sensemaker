'use strict';

// Dependencies
const React = require('react');
const marked = require('marked');

// Components
const {
  Button,
  Icon,
  Message,
  Segment
} = require('semantic-ui-react');

class AnnouncementList extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      currentIndex: 0
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

  render () {
    const { announcements } = this.props;
    const { currentIndex } = this.state;
    
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
      </Segment>
    );
  }
}

module.exports = AnnouncementList; 