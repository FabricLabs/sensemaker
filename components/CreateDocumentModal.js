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
  Progress
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
      this.setState({ loading: false, progress: 0 });
      this.props.onClose();
      this.props.navigate('/documents/' + document['@id'] + '?mode=edit');
    } catch (error) {
      this.setState({ loading: false, error: error.message, progress: 0 });
    }
  };

  render () {
    const { open, onClose } = this.props;
    const { title, summary, selectedType, documentTypes, loading, error, useAI, progress } = this.state;

    return (
      <Modal open={open} onClose={onClose}>
        <Modal.Header>Create New Document</Modal.Header>
        <Modal.Content>
          <Form error={!!error}>
            <Form.Field>
              <label>Document Title</label>
              <input
                placeholder="Enter document title"
                value={title}
                onChange={(e) => this.setState({ title: e.target.value })}
              />
            </Form.Field>
            <Form.Field>
              <label>Summary (Optional)</label>
              <textarea
                placeholder="Enter a summary of the document content"
                value={summary}
                onChange={(e) => this.setState({ summary: e.target.value })}
                rows={3}
              />
            </Form.Field>
            <Form.Field>
              <label>Document Type</label>
              <Dropdown
                placeholder="Select document type"
                fluid
                selection
                options={documentTypes}
                value={selectedType}
                onChange={(e, { value }) => this.setState({ selectedType: value })}
              />
            </Form.Field>
            <Form.Field>
              <Checkbox
                label="Use AI to generate document content"
                checked={useAI}
                onChange={(e, { checked }) => this.setState({ useAI: checked })}
              />
            </Form.Field>
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