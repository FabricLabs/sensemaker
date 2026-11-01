'use strict';

const React = require('react');
const {
  Button,
  Dropdown,
  Form,
  Header,
  Modal,
  Message,
  Icon
} = require('semantic-ui-react');

const {
  FILE_DOCUMENT_TYPES,
  SNIFF_BYTES,
  detectDocumentType
} = require('../functions/detectDocumentType');

const SOURCE_LABELS = {
  content: 'file contents',
  extension: 'file extension',
  mime: 'browser-reported type',
  default: 'no recognizable hints'
};

class FileUploadModal extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      file: null,
      detected: null,
      selectedType: null,
      formatError: false,
      uploading: false,
      error: null
    };
  }

  handleFileChange = async (e) => {
    const files = e.target.files;
    this.setState({ formatError: false, error: null, detected: null, selectedType: null });
    if (!files.length) {
      this.setState({ file: null });
      return;
    }

    const file = files[0];
    this.setState({ file });

    let bytes = null;
    try {
      bytes = new Uint8Array(await file.slice(0, SNIFF_BYTES).arrayBuffer());
    } catch (err) {
      console.warn('[FileUploadModal] Could not read file header:', err);
    }

    const detected = detectDocumentType({ name: file.name, mime: file.type, bytes });
    if (this.state.file !== file) return;
    this.setState({ detected, selectedType: detected.type });
  };

  handleUpload = async () => {
    const { file, selectedType } = this.state;
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
          type: selectedType || undefined,
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
    const { file, detected, selectedType, uploading, error } = this.state;

    const typeOptions = FILE_DOCUMENT_TYPES.map((t) => ({
      key: t.name,
      value: t.name,
      text: (detected && detected.type === t.name) ? `${t.name} (detected)` : t.name,
      description: t.description
    }));

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
            </Form.Field>
            {file && (
              <Message info>
                <Icon name="file" />
                Selected file: {file.name}
              </Message>
            )}
            {file && (
              <Form.Field>
                <label>Document Type</label>
                <Dropdown
                  selection
                  fluid
                  loading={!detected}
                  options={typeOptions}
                  value={selectedType}
                  onChange={(e, { value }) => this.setState({ selectedType: value })}
                />
                {detected && (
                  <p className="help">
                    Detected <strong>{detected.type}</strong> ({detected.mime}) from {SOURCE_LABELS[detected.source] || detected.source}.
                  </p>
                )}
              </Form.Field>
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
            disabled={uploading || !file || !selectedType}
          >
            Upload
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }
}

module.exports = FileUploadModal;
