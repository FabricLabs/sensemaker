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
  }

  componentDidUpdate (prevProps) {
    // Fetch history when source ID changes
    const currentResource = this.props.api?.resource || {};
    const prevResource = prevProps.api?.resource || {};

    if (prevResource.id !== currentResource.id && currentResource.id) {
      this.fetchHistory();
    }
  }

  async fetchHistory () {
    try {
      const sourceId = this.props.api?.resource?.id;
      if (!sourceId) {
        console.warn('[SOURCEVIEW]', 'No source ID available for fetching history');
        return;
      }

      const response = await fetch(`/sources/${sourceId}/history`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.props.auth?.token
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.statusText}`);
      }

      const retrievalHistory = await response.json();

      // Format it for display in the history table
      const history = retrievalHistory.map((item) => ({
        id: item.id || item.fabric_id,
        blob_id: item.blob_id || item.latest_blob_id,
        created_at: item.retrieved_at || item.created_at,
        bytes_changed: item.bytes_changed,
        blob_size: item.blob_size,
        documents: item.fabric_id ? [{
          id: item.fabric_id,
          title: item.title,
          summary: item.summary
        }] : []
      }));

      console.debug('[SOURCEVIEW]', 'Setting history from /history endpoint:', history);
      this.setState({ history });
    } catch (error) {
      console.error('[SOURCEVIEW]', 'Error fetching source history:', error);
      this.setState({ history: [] });
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
            <Table.HeaderCell>Bytes Changed</Table.HeaderCell>
            <Table.HeaderCell>Snapshots</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {history.map((retrieval, index) => (
            <Table.Row key={retrieval.id || index}>
              <Table.Cell>
                {retrieval.created_at ? new Date(retrieval.created_at).toLocaleString() : 'Unknown date'}
              </Table.Cell>
              <Table.Cell>
                <code>{retrieval.blob_id}</code>
              </Table.Cell>
              <Table.Cell>
                {retrieval.bytes_changed !== null && retrieval.bytes_changed !== undefined ? (
                  <span style={{
                    color: retrieval.bytes_changed > 0 ? '#d32f2f' : retrieval.bytes_changed < 0 ? '#388e3c' : '#666',
                    fontWeight: 'bold'
                  }}>
                    {retrieval.bytes_changed > 0 ? '+' : ''}{retrieval.bytes_changed.toLocaleString()} bytes
                  </span>
                ) : (
                  <span style={{ color: '#999', fontStyle: 'italic' }}>—</span>
                )}
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
      last_error,
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
            <Table.Row>
              <Table.Cell><strong>Last Error</strong></Table.Cell>
              <Table.Cell>
                {last_error && (
                  <Message negative>
                    <Message.Header>
                      <Icon name='warning circle' /> Sync Failed
                    </Message.Header>
                    <p>{last_error}</p>
                  </Message>
                )}
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
