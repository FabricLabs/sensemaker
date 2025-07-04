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
    const { token, onClose, navigate } = this.props;
    if (!file) {
      this.setState({ error: 'Please select a file to upload' });
      return;
    }

    this.setState({ uploading: true, error: null });

    try {
      // Step 1: Upload the file
      const uploaded = await this.props.uploadFile(file);
      console.debug('[FileUploadModal] Upload result:', uploaded);

      if (!uploaded) {
        throw new Error('File upload failed - no response received');
      }

      const fabric_id = uploaded.fabric_id || uploaded.id;
      if (!fabric_id) throw new Error('No fabric_id returned from upload.');

      // Step 2: Create the document using the fabric_id
      const response = await fetch('/documents', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: file.name,
          type: 'File',
          file_id: fabric_id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create document');
      }

      const document = await response.json();
      this.setState({ uploading: false });
      onClose();
      navigate('/documents/' + (document.id || document['@id'] || fabric_id));
    } catch (error) {
      this.setState({
        uploading: false,
        error: error.message || 'Failed to upload and create document'
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