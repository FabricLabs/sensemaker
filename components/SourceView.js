'use strict';

// Dependencies
const React = require('react');
const { Link } = require('react-router-dom');

// Semantic UI
const {
  Button,
  Divider,
  Form,
  Header,
  Icon,
  Input,
  Label,
  Message,
  Segment,
  Table
} = require('semantic-ui-react');

// Fabric Types
const Actor = require('@fabric/core/types/actor');

// Local Components
const ChatBox = require('./ChatBox');

// TODO: reduce to a web component (no react)
class SourceView extends React.Component {
  constructor (props) {
    super(props);

    // Settings
    this.creation = new Date();
    this.settings = Object.assign({
      clock: 0,
      debug: false,
      interval: 1000
    }, props);

    // State
    this.heart = null;
    this.style = this.props.style || {};
    this.state = {
      content: {
        clock: this.settings.clock,
        interval: this.settings.interval
      },
      isEditing: false,
      editForm: {
        name: '',
        description: '',
        content: '',
        recurrence: ''
      },
      history: []
    };

    // Fabric State
    this._state = {
      content: JSON.parse(JSON.stringify(this.state))
    };

    return this;
  }

  // TODO: reconcile with Fabric API
  commit () {
    return new Actor({
      content: this._state.content
    });
  }

  componentDidMount () {
    this.start();
    this.props.fetchResource();
    this.fetchHistory();
  }

  async fetchHistory () {
    try {
      const response = await fetch(`/sources/${this.props.api.resource.id}/history`);
      const history = await response.json();

      // For each history item, fetch associated documents
      const historyWithDocuments = await Promise.all(
        history.map(async (retrieval) => {
          try {
            // Search for documents with the same fabric_id as the blob
            const docResponse = await fetch(`/api/documents?fabric_id=${retrieval.blob_id}`);
            const documents = await docResponse.json();
            return {
              ...retrieval,
              documents: documents || []
            };
          } catch (error) {
            console.error(`Error fetching documents for blob ${retrieval.blob_id}:`, error);
            return {
              ...retrieval,
              documents: []
            };
          }
        })
      );

      this.setState({ history: historyWithDocuments });
    } catch (error) {
      console.error('Error fetching source history:', error);
    }
  }

  handleEditSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement API call to update the source
    this.setState({ isEditing: false });
  }

  handleInputChange = (e, { name, value }) => {
    this.setState(prevState => ({
      editForm: {
        ...prevState.editForm,
        [name]: value
      }
    }));
  }

  renderEditForm = () => {
    const { editForm } = this.state;
    const { resource } = this.props.api;

    return (
      <Form onSubmit={this.handleEditSubmit}>
        <Form.Field>
          <label>Name</label>
          <Input
            name="name"
            value={editForm.name || resource.name || ''}
            onChange={this.handleInputChange}
            placeholder="Enter source name"
          />
        </Form.Field>
        <Form.Field>
          <label>Description</label>
          <Input
            name="description"
            value={editForm.description || resource.description || ''}
            onChange={this.handleInputChange}
            placeholder="Enter description"
          />
        </Form.Field>
        <Form.Field>
          <label>Content URL</label>
          <Input
            name="content"
            value={editForm.content || resource.content || ''}
            onChange={this.handleInputChange}
            placeholder="Enter content URL"
          />
        </Form.Field>
        <Form.Field>
          <label>Recurrence</label>
          <Input
            name="recurrence"
            value={editForm.recurrence || resource.recurrence || ''}
            onChange={this.handleInputChange}
            placeholder="Enter recurrence (e.g., daily, weekly)"
          />
        </Form.Field>
        <Button.Group>
          <Button type="submit" positive>Save</Button>
          <Button.Or />
          <Button onClick={() => this.setState({ isEditing: false })}>Cancel</Button>
        </Button.Group>
      </Form>
    );
  }

  renderHistory () {
    const { history } = this.state;
    if (!history || history.length === 0) {
      return (
        <Message info>
          <Message.Header>No Retrieval History</Message.Header>
          <p>This source has not been retrieved yet.</p>
        </Message>
      );
    }

    return (
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Date</Table.HeaderCell>
            <Table.HeaderCell>Content</Table.HeaderCell>
            <Table.HeaderCell>Snapshots</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {history.map((retrieval, index) => (
            <Table.Row key={retrieval.id || index}>
              <Table.Cell>
                {new Date(retrieval.created_at).toLocaleString()}
              </Table.Cell>
              <Table.Cell>
                <code>{retrieval.blob_id}</code>
              </Table.Cell>
              <Table.Cell>
                {retrieval.documents && retrieval.documents.length > 0 ? (
                  <div>
                    {retrieval.documents.map((doc, docIndex) => (
                      <div key={doc.id || docIndex} style={{ marginBottom: '4px' }}>
                        <Link to={`/documents/${doc.id}`}>
                          <Icon name='file text' />
                          {doc.title || doc.filename || `Document ${doc.id}`}
                        </Link>
                        {doc.fabric_type && (
                          <Label size='mini' color='blue' style={{ marginLeft: '8px' }}>
                            {doc.fabric_type}
                          </Label>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: '#999', fontStyle: 'italic' }}>
                    No documents created
                  </span>
                )}
              </Table.Cell>
              <Table.Cell>
                <Button.Group size='tiny'>
                  <Button
                    icon='eye'
                    content='View Snapshot'
                    onClick={() => window.open(`/blobs/${retrieval.blob_id}`, '_blank')}
                  />
                  <Button.Or />
                  <Button
                    icon='download'
                    content='Download'
                    onClick={() => window.open(`/api/blobs/${retrieval.blob_id}`, '_blank')}
                  />
                </Button.Group>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    );
  }

  render () {
    const { api, network, peers, sources } = this.props;
    const resource = api?.resource || {};
    const {
      id,
      name,
      description,
      content,
      recurrence,
      last_retrieved,
      can_edit
    } = resource;

    if (this.state.isEditing) {
      return (
        <Segment className='fade-in' style={{ maxHeight: '100%', height: '97vh' }}>
          <Header as='h2' dividing>Edit Source</Header>
          {this.renderEditForm()}
        </Segment>
      );
    }

    return (
      <Segment className='fade-in' loading={sources?.loading} style={{ maxHeight: '100%', height: '97vh' }}>
        <Header as='h2' dividing>
          {name || 'Untitled Source'}
          {can_edit && (
            <Button
              floated='right'
              size='tiny'
              icon='edit'
              content='Edit'
              onClick={() => this.setState({ isEditing: true })}
            />
          )}
        </Header>

        <Table basic='very' celled>
          <Table.Body>
            <Table.Row>
              <Table.Cell width={3}><strong>ID</strong></Table.Cell>
              <Table.Cell>{id}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell><strong>Content</strong></Table.Cell>
              <Table.Cell>
                <a href={content} target="_blank" rel="noopener noreferrer">
                  {content}
                </a>
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell><strong>Description</strong></Table.Cell>
              <Table.Cell>{description || 'No description provided'}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell><strong>Recurrence</strong></Table.Cell>
              <Table.Cell>
                <Label color='blue'>{recurrence}</Label>
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell><strong>Last Retrieved</strong></Table.Cell>
              <Table.Cell>
                {last_retrieved ? new Date(last_retrieved).toLocaleString() : 'Never'}
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>

        <Divider />

        <Header as='h3' dividing>
          Retrieval History
          <Button
            floated='right'
            size='tiny'
            icon='refresh'
            content='Refresh'
            onClick={() => this.fetchHistory()}
          />
        </Header>

        {this.renderHistory()}

        <Divider />

        <ChatBox {...this.props} context={{ source: resource }} placeholder='Ask about this source...' />
      </Segment>
    );
  }

  start () {
    this._state.content.status = 'STARTING';
    // this.heart = setInterval(this.tick.bind(this), this.settings.interval);
    this._state.content.status = 'STARTED';
    this.commit();
  }

  stop () {
    this._state.content.status = 'STOPPING';
    clearInterval(this.heart);
    this._state.content.status = 'STOPPED';
    this.commit();
  }
}

module.exports = SourceView;
