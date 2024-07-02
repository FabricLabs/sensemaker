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
            <Input type='file' name='file' accept={ALLOWED_UPLOAD_TYPES.join(',')} onChange={this.handleFileChange} style={{ cursor: 'pointer' }} />
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
            {this.props.drafterSection ? (
              <Message positive>
                <Message.Content>
                  Document attached successfully!
                </Message.Content>
              </Message>
            ) : (
              <Message positive>
                <Message.Header>Document uploaded successfully!</Message.Header>
                <Message.Content>
                  Novo is processing your Document, you will be able to start conversations about this conversation as soon the ingestion is complete.
                </Message.Content>
                <Message.Content>
                  You will receive a notification when the process is complete. You can check your document <b><Link to={'/documents/' + files.fabric_id}>Here</Link></b>
                </Message.Content>
              </Message>
            )}
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
