'use strict';

const React = require('react');
const {
  Button,
  Form,
  Header,
  Modal,
  Message,
  Dropdown,
  Checkbox,
  Progress,
  Icon
} = require('semantic-ui-react');

class CreateDocumentModal extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      title: '',
      summary: '',
      selectedType: 'Markdown',
      documentTypes: [],
      loading: false,
      error: null,
      useAI: false,
      progress: 0
    };
  }

  componentDidMount () {
    this.fetchDocumentTypes();
    // If defaultType is provided, set selectedType accordingly
    if (this.props.defaultType && this.state.selectedType !== this.props.defaultType) {
      this.setState({ selectedType: this.props.defaultType });
    }
  }

  componentDidUpdate(prevProps) {
    // If the modal is opened and defaultType changes, update selectedType
    if (
      this.props.open &&
      this.props.defaultType &&
      (prevProps.defaultType !== this.props.defaultType || !prevProps.open)
    ) {
      if (this.state.selectedType !== this.props.defaultType) {
        this.setState({ selectedType: this.props.defaultType });
      }
    }
  }

  fetchDocumentTypes = async () => {
    try {
      const response = await fetch('/documents', {
        method: 'OPTIONS',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + this.props.token
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch document types');
      }

      const data = await response.json();
      const types = data.content?.types || [];
      this.setState({ documentTypes: types.map((x) => {
        return {
          key: x.name,
          text: x.name,
          value: x.name
        }
      }) });
    } catch (error) {
      this.setState({ error: error.message });
    }
  };

  handleSubmit = async () => {
    const { title, summary, selectedType, useAI } = this.state;

    if (!title || !selectedType) {
      this.setState({ error: 'Please fill in all fields' });
      return;
    }

    this.setState({ loading: true, error: null, progress: useAI ? 10 : 100 });

    try {
      let content = '';

      if (useAI) {
        try {
          this.setState({ progress: 30 });
          const completionResponse = await fetch('/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Authorization': 'Bearer ' + this.props.token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messages: [
                {
                  role: 'user',
                  content: `Generate a ${selectedType} document about the following topic: ${title}${summary ? '. Additional context: ' + summary : ''}`
                }
              ]
            })
          });

          if (!completionResponse.ok) {
            throw new Error('Failed to generate content');
          }

          this.setState({ progress: 70 });
          const completionData = await completionResponse.json();
          content = completionData.choices[0].message.content;
          this.setState({ progress: 90 });
        } catch (error) {
          this.setState({ loading: false, error: 'Failed to generate content: ' + error.message });
          return;
        }
      }

      this.setState({ progress: 100 });
      const response = await fetch('/documents', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + this.props.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          type: selectedType,
          content: content || undefined,
          summary: summary || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create document');
      }

      const document = await response.json();

      // If created from within a folder, add to that folder
      if (this.props.folderId) {
        await this.addDocumentToFolder(document['@id'], this.props.folderId);
      }

      this.setState({ loading: false, progress: 0 });

      // Call onSuccess callback if provided
      if (this.props.onSuccess) {
        this.props.onSuccess(document);
      }

      this.props.onClose();

      // Navigate appropriately based on document type
      const isFolder = selectedType === 'Folder';
      const navigationPath = isFolder
        ? `/documents/${document['@id']}`
        : `/documents/${document['@id']}?mode=edit`;

      this.props.navigate(navigationPath);
    } catch (error) {
      this.setState({ loading: false, error: error.message, progress: 0 });
    }
  };

  addDocumentToFolder = async (documentId, folderId) => {
    try {
      // Fetch the current folder document
      const folderResponse = await fetch(`/documents/${folderId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + this.props.token
        }
      });

      if (!folderResponse.ok) {
        throw new Error('Failed to fetch folder');
      }

      const folder = await folderResponse.json();
      let folderItems = [];

      try {
        folderItems = JSON.parse(folder.content || '[]');
        if (!Array.isArray(folderItems)) folderItems = [];
      } catch (error) {
        console.warn('Failed to parse folder content:', error);
        folderItems = [];
      }

      // Add the new document to the folder if not already present
      if (!folderItems.includes(documentId)) {
        folderItems.push(documentId);

        // Update the folder document
        const updateResponse = await fetch(`/documents/${folderId}`, {
          method: 'PATCH',
          headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + this.props.token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: JSON.stringify(folderItems)
          })
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to update folder');
        }

        console.log('Document successfully added to folder');
      }
    } catch (error) {
      console.error('Failed to add document to folder:', error);
      // Don't throw error here to avoid disrupting the document creation flow
    }
  };

  render () {
    const { open, onClose, folderId, folderTitle, defaultType } = this.props;
    const { title, summary, selectedType, documentTypes, loading, error, useAI, progress } = this.state;

    // Determine modal title based on type
    const isCreatingFolder = selectedType === 'Folder';
    const modalTitle = folderId
      ? `Create ${isCreatingFolder ? 'Folder' : 'Document'} in "${folderTitle || 'Folder'}"`
      : `Create New ${isCreatingFolder ? 'Folder' : 'Document'}`;

    return (
      <Modal open={open} onClose={onClose}>
        <Modal.Header>
          {modalTitle}
        </Modal.Header>
        <Modal.Content>
          {folderId && (
            <Message info>
              <Icon name="info circle" />
              This document will be automatically added to the folder "{folderTitle || 'Folder'}".
            </Message>
          )}
          <Form error={!!error}>
            <Form.Field>
              <label>{selectedType === 'Folder' ? 'Folder Name' : 'Document Title'}</label>
              <input
                placeholder={selectedType === 'Folder' ? 'Enter folder name' : 'Enter document title'}
                value={title}
                onChange={(e) => this.setState({ title: e.target.value })}
              />
            </Form.Field>
            <Form.Field>
              <label>Summary (Optional)</label>
              <textarea
                placeholder={selectedType === 'Folder' ? 'Enter a description of the folder purpose' : 'Enter a summary of the document content'}
                value={summary}
                onChange={(e) => this.setState({ summary: e.target.value })}
                rows={3}
              />
            </Form.Field>
            {selectedType !== 'Folder' && (
              <Form.Field>
                <label>Document Type</label>
                <Dropdown
                  placeholder="Select document type"
                  fluid
                  selection
                  options={documentTypes}
                  value={selectedType}
                  onChange={(e, { value }) => this.setState({ selectedType: value })}
                  disabled={!!defaultType}
                />
              </Form.Field>
            )}
            {selectedType !== 'Folder' && (
              <Form.Field>
                <Checkbox
                  label="Use AI to generate document content"
                  checked={useAI}
                  onChange={(e, { checked }) => this.setState({ useAI: checked })}
                />
              </Form.Field>
            )}
            {error && (
              <Message error content={error} />
            )}
            {loading && progress > 0 && (
              <Progress percent={progress} indicating>
                {progress === 100 ? 'Creating document...' : 'Generating content...'}
              </Progress>
            )}
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            positive
            onClick={this.handleSubmit}
            loading={loading}
            disabled={loading}
          >
            Create
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }
}

module.exports = CreateDocumentModal;