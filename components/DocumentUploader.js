'use strict';

const ALLOWED_UPLOAD_TYPES = [
  'image/png',
  'image/jpeg',
  'image/tiff',
  'image/bmp',
  'application/pdf',
];

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
  constructor(settings = {}) {
    super(settings);
    this.state = {
      file: null,
      fileExists: false,
      file_id: null,
      formatError: false,
      uploading: false,
      errorMsg: '',
      uploadSuccess: false,
    };
  }

  componentDidUpdate(prevProps) {
    const { files } = this.props;
    if (files !== prevProps.files && this.state.uploading && !files.loading) {
      if (files.fileUploaded) {
        this.setState({ uploadSuccess: true, file_id: files.fileId });
        this.props.fetchDocuments();
      } else {
        this.setState({ errorMsg: files.error });
      }
    }
  }

  handleFileChange = async (e) => {
    const files = e.target.files;
    this.setState({ formatError: false });

    if (files.length > 0) {
      const file = files[0]; // Take only the first file
      if (this.isValidFileType(file.type)) {
        console.debug('File:', file.name, file.size, file.type); // Debugging log
        this.setState({ file: file, formatError: false });
      } else {
        this.setState({ formatError: true, file: null });
      }
    }
  };

  handleUpload = async () => {
    this.setState({
      uploading: true,
      file: null,
      fileExists: false,
      file_id: null,
      formatError: false,
      errorMsg: '',
      uploadSuccess: false,
    });
    await this.props.uploadFile(this.state.file);
  }

  isValidFileType(fileType) {
    return ALLOWED_UPLOAD_TYPES.includes(fileType);
  }

  render() {
    const { files } = this.props;
    return (
      <Form className='documents-upload-form'>
        <Form.Field>
          <div style={{ maxWidth: '500px', gap: '0.5em', display: 'flex' }}>
            <Input type='file' name='file' accept={ALLOWED_UPLOAD_TYPES.join(',')} onChange={this.handleFileChange} style={{cursor: 'pointer'}}/>
            <Button
              icon='upload'
              disabled={!this.state.file}
              onClick={() => this.handleUpload()}
              loading={files.loading}
            >
              Upload
            </Button>
          </div>
        </Form.Field>
        {this.state.formatError &&
          <Form.Field>
            <Message negative content='File format not allowed. Please upload PNG, JPG, TIFF, BMP, PDF' />
          </Form.Field>
        }
        {this.state.errorMsg &&
          <Form.Field>
            <Message negative content={this.state.errorMsg} />
          </Form.Field>
        }
        {this.state.uploadSuccess &&
          <Form.Field>
            <Message positive>
              <Message.Content>
                Document uploaded successfully! Now you can start a new conversation about this document.
              </Message.Content>
              <Link to={'/conversations/documents/' + files.fabric_id} onClick={()=>this.props.resetChat()}>
                <Button
                  primary
                  content='Start Conversation'
                  style={{ marginTop: '1em' }}
                />
              </Link>
            </Message>
          </Form.Field>
        }
      </Form>
    );
  }

  toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = DocumentUploader;
