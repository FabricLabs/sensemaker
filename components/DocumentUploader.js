'use strict';

const { ALLOWED_UPLOAD_TYPES } = require('../constants');

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Button,
  Segment,
  Icon,
  Input,
  Form,
  Message
} = require('semantic-ui-react');

class DocumentUploader extends React.Component {
  constructor (settings = {}) {
    super(settings);
    this.state = {
      file: null,
      fileExists: false,
      file_id: null,
      formatError: false,
      uploading: false,
      errorMsg: '',
      uploadSuccess: false,
      unsupportedVideoWarning: false,
    };
  }

  componentDidUpdate (prevProps) {
    const { files, drafterSection } = this.props;
    if (files !== prevProps.files && this.state.uploading && !files.loading) {
      if (files.fileUploaded) {
        this.setState({ uploadSuccess: true, file_id: files.fileId });
        if (drafterSection) {
          this.props.attachFile(this.state.file);
        } else {
          this.props.fetchDocuments();
        }
      } else {
        this.setState({ errorMsg: files.error });
      }
      this.setState({
        uploading: false,
        file: null,
      });
    }
  }

  handleFileChange = async (e) => {
    const files = e.target.files;
    this.setState({ formatError: false, unsupportedVideoWarning: false });

    if (files.length > 0) {
      const file = files[0]; // Take only the first file
      if (this.isValidFileType(file.type)) {
        console.debug('File:', file.name, file.size, file.type); // Debugging log

        // Check if it's an unsupported video format
        const isUnsupportedVideo = this.isUnsupportedVideoFormat(file.type);

        this.setState({
          file: file,
          formatError: false,
          unsupportedVideoWarning: isUnsupportedVideo
        });
      } else {
        this.setState({ formatError: true, file: null, unsupportedVideoWarning: false });
      }
    }
  };

  handleUpload = async () => {
    this.setState({
      uploading: true,
      fileExists: false,
      file_id: null,
      formatError: false,
      errorMsg: '',
      uploadSuccess: false,
    });

    const uploaded = await this.props.uploadFile(this.state.file);
    this.props.navigate('/documents/' + uploaded.document_id);
  }

  isValidFileType (fileType) {
    return ALLOWED_UPLOAD_TYPES.includes(fileType);
  }

  isUnsupportedVideoFormat (fileType) {
    const unsupportedVideoFormats = [
      'video/x-ms-wmv',
      'video/wmv',
      'video/x-msvideo', // Some AVI variants
      'video/flv'        // Flash video
    ];
    return unsupportedVideoFormats.includes(fileType);
  }

  render () {
    const { files } = this.props;
    return (
      <Form className='documents-upload-form'>
        <Form.Field>
          <div style={{ maxWidth: '500px', gap: '0.5em', display: 'flex' }}>
            <Input type='file' name='file' accept={ALLOWED_UPLOAD_TYPES.join(',')} onChange={this.handleFileChange} style={{ cursor: 'pointer' }} />
            <Button
              icon='upload'
              content='Upload'
              disabled={!this.state.file}
              onClick={() => this.handleUpload()}
              loading={files.loading}
            />
          </div>
        </Form.Field>
        {this.state.formatError &&
          <Form.Field>
            <Message negative content='File format not allowed. Please upload images (PNG, JPG, TIFF, BMP), videos (MP4, AVI, MOV, MKV, WebM), audio (MP3, WAV, OGG, M4A, FLAC), or PDF files.' />
          </Form.Field>
        }
        {this.state.unsupportedVideoWarning &&
          <Form.Field>
            <Message warning>
              <Message.Header>Video Format Warning</Message.Header>
              <Message.Content>
                <p>This video format may not play in your browser.  WMV and some other formats are not supported by modern browsers.</p>
                <p><strong>Recommendation:</strong> Convert to MP4 format using tools like VLC, HandBrake, or FFmpeg for better compatibility.</p>
              </Message.Content>
            </Message>
          </Form.Field>
        }
        {this.state.errorMsg &&
          <Form.Field>
            <Message negative content={this.state.errorMsg} />
          </Form.Field>
        }
        {this.state.uploadSuccess &&
          <Form.Field>
            {this.props.drafterSection ? (
              <Message positive>
                <Message.Content>Document attached successfully!</Message.Content>
              </Message>
            ) : (
              <Message positive>
                <Message.Header>Document uploaded successfully!</Message.Header>
                <Message.Content>Sensemaker is processing your upload; you will be able to start conversations about this upload as soon as ingestion is complete.</Message.Content>
                <Message.Content>You will receive a notification when the process is complete. You can check your document <b><Link to={'/documents/' + files.fabric_id}>Here</Link></b></Message.Content>
              </Message>
            )}
          </Form.Field>
        }
      </Form>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = DocumentUploader;
