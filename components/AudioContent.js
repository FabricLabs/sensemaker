'use strict';

const React = require('react');
const {
  Header,
  Icon,
  Message,
  Segment,
  Button,
  Label
} = require('semantic-ui-react');

class AudioContent extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      loading: false,
      error: null,
      audioUrl: null
    };
    
    this.audioRef = React.createRef();
  }

  componentDidMount() {
    this.setupAudioUrl();
  }

  componentDidUpdate(prevProps) {
    // Update audio URL if latest_blob_id changes
    if (prevProps.latest_blob_id !== this.props.latest_blob_id) {
      this.setupAudioUrl();
    }
  }

  setupAudioUrl = () => {
    const { latest_blob_id } = this.props;
    
    if (latest_blob_id) {
      // Use the blob endpoint directly for audio streaming
      this.setState({
        audioUrl: `/blobs/${latest_blob_id}`,
        error: null
      });
    } else {
      this.setState({
        error: { message: 'No audio data available' },
        audioUrl: null
      });
    }
  };

  handleAudioError = (event) => {
    console.error('[AudioContent] Audio load error:', event);
    this.setState({ 
      error: { message: 'Failed to load audio file' }
    });
  };

  handleAudioLoad = () => {
    console.log('[AudioContent] Audio loaded successfully');
    this.setState({ error: null });
  };

  formatDuration = (seconds) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  render() {
    const { title, mime_type } = this.props;
    const { audioUrl, error, loading } = this.state;

    return (
      <div className="audio-content">
        <div style={{ marginBottom: '1em' }}>
          <Header as='h3' style={{ margin: 0, display: 'inline-block' }}>
            <Icon name='music' />
            Audio Player
          </Header>
          {mime_type && (
            <Label size='small' style={{ marginLeft: '1em' }}>
              {mime_type}
            </Label>
          )}
        </div>

        {error && (
          <Message negative>
            <Message.Header>Audio Error</Message.Header>
            <p>{error.message}</p>
          </Message>
        )}

        {loading && (
          <Message icon>
            <Icon name='circle notched' loading />
            <Message.Content>
              <Message.Header>Loading Audio</Message.Header>
              <p>Preparing audio player...</p>
            </Message.Content>
          </Message>
        )}

        {audioUrl && !error && (
          <Segment>
            <div style={{ textAlign: 'center', padding: '1em' }}>
              {title && (
                <Header as='h4' style={{ marginBottom: '1em' }}>
                  {title}
                </Header>
              )}

              <audio
                ref={this.audioRef}
                controls
                preload="metadata"
                style={{ width: '100%', maxWidth: '500px' }}
                onError={this.handleAudioError}
                onLoadedMetadata={this.handleAudioLoad}
                onLoadedData={this.handleAudioLoad}
              >
                <source src={audioUrl} type={mime_type} />
                Your browser does not support the audio element.
              </audio>
              
              <div style={{ marginTop: '0.5em', fontSize: '0.9em', color: '#666' }}>
                <Icon name='info circle' />
                Use the controls to play, pause, and adjust volume
              </div>
            </div>
          </Segment>
        )}

        {!audioUrl && !error && !loading && (
          <Message warning>
            <Message.Header>No Audio Available</Message.Header>
            <p>No audio content could be loaded for this document.</p>
          </Message>
        )}
      </div>
    );
  }
}

module.exports = AudioContent;