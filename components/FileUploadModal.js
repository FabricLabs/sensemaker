'use strict';

const React = require('react');
const {
  Button,
  Form,
  Header,
  Modal,
  Message,
  Icon
} = require('semantic-ui-react');

class FileUploadModal extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      file: null,
      formatError: false,
      uploading: false,
      error: null
    };
  }

  handleFileChange = async (e) => {
    const files = e.target.files;
    this.setState({ formatError: false, error: null });
    if (files.length > 0) {
      const file = files[0];
      this.setState({ file: file, formatError: false });
    }
  };

  handleUpload = async () => {
    const { file } = this.state;
    if (!file) {
      this.setState({ error: 'Please select a file to upload' });
      return;
    }

    this.setState({ uploading: true, error: null });

    try {
      const uploaded = await this.props.uploadFile(file);
      this.setState({ uploading: false });
      this.props.onClose();
      this.props.navigate('/documents/' + uploaded.document_id);
    } catch (error) {
      this.setState({ 
        uploading: false, 
        error: error.message || 'Failed to upload file' 
      });
    }
  };

  render () {
    const { open, onClose } = this.props;
    const { file, uploading, error } = this.state;

    return (
      <Modal open={open} onClose={onClose}>
        <Modal.Header>Create a Document from a File</Modal.Header>
        <Modal.Content>
          <Form error={!!error}>
            <Form.Field>
              <label>Select File</label>
              <input
                type="file"
                onChange={this.handleFileChange}
              />
              <p className="help"></p>
            </Form.Field>
            {file && (
              <Message info>
                <Icon name="file" />
                Selected file: {file.name}
              </Message>
            )}
            {error && (
              <Message error content={error} />
            )}
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            positive
            onClick={this.handleUpload}
            loading={uploading}
            disabled={uploading || !file}
          >
            Upload
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }
}

module.exports = FileUploadModal;