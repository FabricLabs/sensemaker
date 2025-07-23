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

class VideoContent extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      loading: false,
      error: null,
      videoUrl: null
    };

    this.videoRef = React.createRef();
  }

  componentDidMount () {
    this.setupVideoUrl();
  }

  componentDidUpdate (prevProps) {
    // Update video URL if latest_blob_id changes
    if (prevProps.latest_blob_id !== this.props.latest_blob_id) {
      this.setupVideoUrl();
    }
  }

  setupVideoUrl = () => {
    const { latest_blob_id } = this.props;

    if (latest_blob_id) {
      // Use the blob endpoint directly for video streaming
      this.setState({
        videoUrl: `/blobs/${latest_blob_id}`,
        error: null
      });
    } else {
      this.setState({
        error: { message: 'No video data available' },
        videoUrl: null
      });
    }
  };

  handleVideoError = (event) => {
    console.error('[VideoContent] Video load error:', event);
    
    const { mime_type } = this.props;
    let errorMessage = 'Failed to load video file';
    
    // Provide specific guidance for unsupported formats
    if (mime_type === 'video/x-ms-wmv' || mime_type === 'video/wmv') {
      errorMessage = 'WMV format is not supported by modern browsers. Please convert to MP4, WebM, or another supported format.';
    } else if (mime_type && !this.isSupportedVideoFormat(mime_type)) {
      errorMessage = `${mime_type} format may not be supported. Recommended formats: MP4, WebM, OGG.`;
    }
    
    this.setState({
      error: { message: errorMessage, mime_type: mime_type }
    });
  };

  isSupportedVideoFormat = (mimeType) => {
    const supportedFormats = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/avi',  // Sometimes supported
      'video/mov',  // Sometimes supported
      'video/mkv'   // Sometimes supported
    ];

    return supportedFormats.includes(mimeType);
  };

  handleVideoLoad = () => {
    console.log('[VideoContent] Video loaded successfully');
    this.setState({ error: null });
  };

  formatDuration = (seconds) => {
    if (!seconds || !isFinite(seconds)) return '0:00';

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  render () {
    const { title, mime_type } = this.props;
    const { videoUrl, error, loading } = this.state;

    return (
      <div className="video-content">
        <div style={{ marginBottom: '1em' }}>
          <Header as='h3' style={{ margin: 0, display: 'inline-block' }}>
            <Icon name='video' />
            Video Player
          </Header>
          {mime_type && (
            <Label size='small' style={{ marginLeft: '1em' }}>
              {mime_type}
            </Label>
          )}
        </div>

        {error && (
          <Message negative>
            <Message.Header>Video Playback Error</Message.Header>
            <p>{error.message}</p>
            {error.mime_type && (error.mime_type === 'video/x-ms-wmv' || error.mime_type === 'video/wmv') && (
              <div style={{ marginTop: '1em' }}>
                <strong>Suggestions:</strong>
                <ul style={{ marginTop: '0.5em', marginBottom: '1em' }}>
                  <li>Convert the file to MP4 using tools like VLC, HandBrake, or FFmpeg</li>
                  <li>Upload the converted file as a new document</li>
                  <li>Download the original file using the button below</li>
                </ul>
                {videoUrl && (
                  <Button
                    as='a'
                    href={videoUrl}
                    download
                    color='blue'
                    icon='download'
                    content='Download Original File'
                    style={{ marginTop: '0.5em' }}
                  />
                )}
              </div>
            )}
            {error.mime_type && error.mime_type !== 'video/x-ms-wmv' && error.mime_type !== 'video/wmv' && (
              <div style={{ marginTop: '1em' }}>
                <p><strong>Tip:</strong> If the video doesn't play, try converting it to MP4 format for better browser compatibility.</p>
                {videoUrl && (
                  <Button
                    as='a'
                    href={videoUrl}
                    download
                    color='blue'
                    icon='download'
                    content='Download File'
                    style={{ marginTop: '0.5em' }}
                  />
                )}
              </div>
            )}
          </Message>
        )}

        {loading && (
          <Message icon>
            <Icon name='circle notched' loading />
            <Message.Content>
              <Message.Header>Loading Video</Message.Header>
              <p>Preparing video player...</p>
            </Message.Content>
          </Message>
        )}

        {videoUrl && !error && (
          <Segment>
            <div style={{ textAlign: 'center', padding: '1em' }}>
              {title && (
                <Header as='h4' style={{ marginBottom: '1em' }}>
                  {title}
                </Header>
              )}

              <video
                ref={this.videoRef}
                controls
                preload="metadata"
                style={{
                  width: '100%',
                  maxWidth: '800px',
                  maxHeight: '600px',
                  backgroundColor: '#000'
                }}
                onError={this.handleVideoError}
                onLoadedMetadata={this.handleVideoLoad}
                onLoadedData={this.handleVideoLoad}
              >
                <source src={videoUrl} type={mime_type} />
                Your browser does not support the video element.
              </video>

              <div style={{ marginTop: '0.5em', fontSize: '0.9em', color: '#666' }}>
                <Icon name='info circle' />
                Use the controls to play, pause, adjust volume, and toggle fullscreen
              </div>
            </div>
          </Segment>
        )}

        {!videoUrl && !error && !loading && (
          <Message warning>
            <Message.Header>No Video Available</Message.Header>
            <p>No video content could be loaded for this document.</p>
          </Message>
        )}
      </div>
    );
  }
}

module.exports = VideoContent;