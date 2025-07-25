'use strict';

const React = require('react');

class Changelog extends React.Component {
  constructor (...settings) {
    super(settings);
  }

  componentDidMount () {
    this.props.fetchAnnouncements();
  }

  render () {
    const {
      announcements,
      announTitle,
      announBody
    } = this.props;

    const announcementStyle = {
      minHeight: '5.5em',
      maxHeight: '14em',
      overflow: 'auto',
      marginTop: 0,
    };

    return (
      <div className="changelog fade-in">
        <h1>The Changelog</h1>
        <p>Stay up-to-date with the latest changes.</p>
        <h2>Announcements</h2>
        {(announTitle || announBody) && (
          <Message info style={announcementStyle} className='slide-down'>
            <Message.Header as='h3'>
              <span dangerouslySetInnerHTML={{ __html: marked.parse(announTitle) }} />
            </Message.Header>
            <Message.Content>
              <span dangerouslySetInnerHTML={{ __html: marked.parse(announBody) }} />
            </Message.Content>
          </Message>
        )}

        {announcements && announcements.length > 0 && (
          <Message.Group>
            {announcements.map((announcement, index) => (
              <Message key={index} info style={announcementStyle} className='slide-down'>
                <Message.Header>
                  <span dangerouslySetInnerHTML={{ __html: marked.parse(announcement.title) }} />
                </Message.Header>
                <Message.Content>
                  <span dangerouslySetInnerHTML={{ __html: marked.parse(announcement.body) }} />
                </Message.Content>
              </Message>
            ))}
          </Message.Group>
        )}

        {/* TODO: populate from GitHub releases */}
        <h2>Releases</h2>
        <ul>
          <li>0.2.0-RC2: Improved support for tasking, simplified UI, reduced attack surface.</li>
          <li>0.2.0-RC1: Exclusive access!</li>
        </ul>
      </div>
    );
  }
}

module.exports = Changelog;
