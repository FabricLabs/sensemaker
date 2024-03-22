'use strict';

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
    const { documents } = this.props;
    if (documents !== prevProps.documents && this.state.uploading && !documents.loading) {
      if (documents.fileUploaded) {
        this.setState({ uploadSuccess: true, file_id: documents.fileId });
      } else {
        this.setState({ errorMsg: documents.error });
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
    await this.props.uploadDocument(this.state.file);
  }

  isValidFileType(fileType) {
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/tiff',
      'image/bmp',
      'application/pdf',
    ];

    return allowedTypes.includes(fileType);
  }

  render() {
    const { documents } = this.props;
    return (
      <Form className='documents-upload-form'>
        <Form.Field>
          <div style={{ maxWidth: '500px', gap: '0.5em', display: 'flex' }}>
            <Input type='file' name='file' onChange={this.handleFileChange} />
            <Button
              icon='upload'
              disabled={!this.state.file}
              onClick={() => this.handleUpload()}
              loading={documents.loading}
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
              <Link to={'/conversations/documents/' + documents.file_id}>
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
