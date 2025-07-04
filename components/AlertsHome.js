'use strict';

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');

// Semantic UI
const {
  Segment,
  Header,
  List,
  Icon,
  Message,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tab,
  Dropdown
} = require('semantic-ui-react');

class AlertsHome extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      modalOpen: false,
      editModalOpen: false,
      editingTrigger: null,
      activeTab: this.getInitialTab(),
      formStep: 1, // Track form progress
      newTrigger: {
        name: this.generateTriggerName(),
        description: 'Keyword-based trigger for monitoring specific terms',
        type: 'keyword',
        config: {
          keywords: [],
          topic: '',
          value: '',
          condition: '',
          cron: '',
          timezone: '',
          event_type: ''
        },
        active: true
      }
    };

    return this;
  }

  getInitialTab () {
    const hash = window.location.hash.replace('#', '');
    return hash || 'alerts';
  }

  componentDidMount () {
    console.log('AlertsHome componentDidMount');
    this.props.fetchAlerts();
    console.log('AlertsHome componentDidMount 2');
    this.props.fetchTriggers();
    console.log('AlertsHome componentDidMount 3');
    window.addEventListener('hashchange', this.handleHashChange);
  }

  componentWillUnmount () {
    window.removeEventListener('hashchange', this.handleHashChange);
  }

  handleHashChange = () => {
    this.setState({ activeTab: this.getInitialTab() });
  };

  handleTabClick = (e, { name }) => {
    window.location.hash = name;
    this.setState({ activeTab: name });
  };

  handleOpenModal = () => this.setState({ modalOpen: true });
  handleCloseModal = () => this.setState({ modalOpen: false });

  generateTriggerName = () => {
    const randomHex = Math.random().toString(16).substring(2, 8);
    return `trigger-${randomHex}-0000`;
  };

  handleInputChange = (e, { name, value }) => {
    this.setState(prevState => ({
      newTrigger: {
        ...prevState.newTrigger,
        [name]: value
      },
      formStep: name === 'type' ? 2 : prevState.formStep // Move to next step when type is selected
    }));
  };

  handleConfigChange = (e, { name, value }) => {
    this.setState(prevState => ({
      newTrigger: {
        ...prevState.newTrigger,
        config: {
          ...prevState.newTrigger.config,
          [name]: value
        }
      },
      formStep: 3 // Move to final step when config is changed
    }));
  };

  handleKeywordAdd = (e, { value }) => {
    if (!value) return;
    this.setState(prevState => ({
      newTrigger: {
        ...prevState.newTrigger,
        config: {
          ...prevState.newTrigger.config,
          keywords: [...new Set([...(prevState.newTrigger.config.keywords || []), value])]
        }
      }
    }));
  };

  handleKeywordRemove = (keywordToRemove) => {
    this.setState(prevState => ({
      newTrigger: {
        ...prevState.newTrigger,
        config: {
          ...prevState.newTrigger.config,
          keywords: prevState.newTrigger.config.keywords.filter(k => k !== keywordToRemove)
        }
      }
    }));
  };

  handleSubmit = () => {
    const { newTrigger } = this.state;
    // Clean up config based on type
    const config = { ...newTrigger.config };
    if (newTrigger.type === 'keyword') {
      delete config.topic;
      delete config.value;
      delete config.condition;
      delete config.cron;
      delete config.timezone;
      delete config.event_type;
    } else if (newTrigger.type === 'topic') {
      delete config.keywords;
      delete config.value;
      delete config.condition;
      delete config.cron;
      delete config.timezone;
      delete config.event_type;
    } else if (newTrigger.type === 'threshold') {
      delete config.keywords;
      delete config.topic;
      delete config.cron;
      delete config.timezone;
      delete config.event_type;
    } else if (newTrigger.type === 'schedule') {
      delete config.keywords;
      delete config.topic;
      delete config.value;
      delete config.condition;
      delete config.event_type;
    } else if (newTrigger.type === 'event') {
      delete config.keywords;
      delete config.topic;
      delete config.value;
      delete config.condition;
      delete config.cron;
      delete config.timezone;
    }

    this.props.createTrigger({
      ...newTrigger,
      config
    });
    this.handleCloseModal();
    this.setState({
      newTrigger: {
        name: this.generateTriggerName(),
        description: 'Keyword-based trigger for monitoring specific terms',
        type: 'keyword',
        config: {
          keywords: [],
          topic: '',
          value: '',
          condition: '',
          cron: '',
          timezone: '',
          event_type: ''
        },
        active: true
      },
      formStep: 1
    });
  };

  handleOpenEditModal = (trigger) => {
    this.setState({
      editModalOpen: true,
      editingTrigger: { ...trigger }
    });
  };

  handleCloseEditModal = () => {
    this.setState({
      editModalOpen: false,
      editingTrigger: null
    });
  };

  handleEditInputChange = (e, { name, value }) => {
    this.setState(prevState => ({
      editingTrigger: {
        ...prevState.editingTrigger,
        [name]: value
      }
    }));
  };

  handleEditConfigChange = (e, { name, value }) => {
    this.setState(prevState => ({
      editingTrigger: {
        ...prevState.editingTrigger,
        config: {
          ...prevState.editingTrigger.config,
          [name]: value
        }
      }
    }));
  };

  handleEditKeywordAdd = (e, { value }) => {
    if (!value) return;
    this.setState(prevState => ({
      editingTrigger: {
        ...prevState.editingTrigger,
        config: {
          ...prevState.editingTrigger.config,
          keywords: [...new Set([...(prevState.editingTrigger.config.keywords || []), value])]
        }
      }
    }));
  };

  handleEditKeywordRemove = (keywordToRemove) => {
    this.setState(prevState => ({
      editingTrigger: {
        ...prevState.editingTrigger,
        config: {
          ...prevState.editingTrigger.config,
          keywords: prevState.editingTrigger.config.keywords.filter(k => k !== keywordToRemove)
        }
      }
    }));
  };

  handleEditSubmit = () => {
    const { editingTrigger } = this.state;
    if (!editingTrigger) return;

    // Clean up config based on type
    const config = { ...editingTrigger.config };
    if (editingTrigger.type === 'keyword') {
      delete config.topic;
      delete config.value;
      delete config.condition;
      delete config.cron;
      delete config.timezone;
      delete config.event_type;
    } else if (editingTrigger.type === 'topic') {
      delete config.keywords;
      delete config.value;
      delete config.condition;
      delete config.cron;
      delete config.timezone;
      delete config.event_type;
    } else if (editingTrigger.type === 'threshold') {
      delete config.keywords;
      delete config.topic;
      delete config.cron;
      delete config.timezone;
      delete config.event_type;
    } else if (editingTrigger.type === 'schedule') {
      delete config.keywords;
      delete config.topic;
      delete config.value;
      delete config.condition;
      delete config.event_type;
    } else if (editingTrigger.type === 'event') {
      delete config.keywords;
      delete config.topic;
      delete config.value;
      delete config.condition;
      delete config.cron;
      delete config.timezone;
    }

    // Ensure we have a valid trigger object
    const updatedTrigger = {
      ...editingTrigger,
      config
    };

    // Call the updateTrigger prop with the cleaned trigger
    this.props.updateTrigger(updatedTrigger.id, updatedTrigger);
    this.handleCloseEditModal();
  };

  renderConfigFields = () => {
    const { newTrigger, formStep } = this.state;
    const { config } = newTrigger;

    if (formStep < 2) return null;

    switch (newTrigger.type) {
      case 'keyword':
        return (
          <Form.Field>
            <label>Keywords</label>
            <Dropdown
              placeholder='Add keywords'
              fluid
              multiple
              search
              selection
              allowAdditions
              value={config.keywords || []}
              options={(config.keywords || []).map(keyword => ({
                key: keyword,
                text: keyword,
                value: keyword
              }))}
              onAddItem={(e, { value }) => this.handleKeywordAdd(e, { value })}
              onChange={(e, { value }) => {
                this.setState(prevState => ({
                  newTrigger: {
                    ...prevState.newTrigger,
                    config: {
                      ...prevState.newTrigger.config,
                      keywords: value
                    }
                  },
                  formStep: 3
                }));
              }}
            />
          </Form.Field>
        );
      case 'topic':
        return (
          <Form.Field>
            <label>Topic</label>
            <Input
              name='topic'
              value={config.topic}
              onChange={this.handleConfigChange}
              placeholder='Enter topic'
            />
          </Form.Field>
        );
      case 'threshold':
        return (
          <>
            <Form.Field>
              <label>Value</label>
              <Input
                name='value'
                value={config.value}
                onChange={this.handleConfigChange}
                placeholder='Enter threshold value'
              />
            </Form.Field>
            <Form.Field>
              <label>Condition</label>
              <Select
                name='condition'
                value={config.condition}
                onChange={this.handleConfigChange}
                options={[
                  { key: 'gt', text: 'Greater Than', value: 'gt' },
                  { key: 'lt', text: 'Less Than', value: 'lt' },
                  { key: 'eq', text: 'Equals', value: 'eq' }
                ]}
                placeholder='Select condition'
              />
            </Form.Field>
          </>
        );
      case 'schedule':
        return (
          <>
            <Form.Field>
              <label>Cron Expression</label>
              <Input
                name='cron'
                value={config.cron}
                onChange={this.handleConfigChange}
                placeholder='Enter cron expression (e.g., 0 * * * *)'
              />
            </Form.Field>
            <Form.Field>
              <label>Timezone</label>
              <Input
                name='timezone'
                value={config.timezone}
                onChange={this.handleConfigChange}
                placeholder='Enter timezone (e.g., UTC)'
              />
            </Form.Field>
          </>
        );
      case 'event':
        return (
          <Form.Field>
            <label>Event Type</label>
            <Input
              name='event_type'
              value={config.event_type}
              onChange={this.handleConfigChange}
              placeholder='Enter event type'
            />
          </Form.Field>
        );
      default:
        return null;
    }
  };

  renderEditConfigFields = () => {
    const { editingTrigger } = this.state;
    if (!editingTrigger) return null;
    const { config } = editingTrigger;

    switch (editingTrigger.type) {
      case 'keyword':
        return (
          <Form.Field>
            <label>Keywords</label>
            <Dropdown
              placeholder='Add keywords'
              fluid
              multiple
              search
              selection
              allowAdditions
              value={config.keywords || []}
              options={(config.keywords || []).map(keyword => ({
                key: keyword,
                text: keyword,
                value: keyword
              }))}
              onAddItem={(e, { value }) => this.handleEditKeywordAdd(e, { value })}
              onChange={(e, { value }) => {
                this.setState(prevState => ({
                  editingTrigger: {
                    ...prevState.editingTrigger,
                    config: {
                      ...prevState.editingTrigger.config,
                      keywords: value
                    }
                  }
                }));
              }}
            />
          </Form.Field>
        );
      case 'topic':
        return (
          <Form.Field>
            <label>Topic</label>
            <Input
              name='topic'
              value={config.topic || ''}
              onChange={this.handleEditConfigChange}
              placeholder='Enter topic'
            />
          </Form.Field>
        );
      case 'threshold':
        return (
          <>
            <Form.Field>
              <label>Value</label>
              <Input
                name='value'
                value={config.value || ''}
                onChange={this.handleEditConfigChange}
                placeholder='Enter threshold value'
              />
            </Form.Field>
            <Form.Field>
              <label>Condition</label>
              <Select
                name='condition'
                value={config.condition || ''}
                onChange={this.handleEditConfigChange}
                options={[
                  { key: 'gt', text: 'Greater Than', value: 'gt' },
                  { key: 'lt', text: 'Less Than', value: 'lt' },
                  { key: 'eq', text: 'Equals', value: 'eq' }
                ]}
                placeholder='Select condition'
              />
            </Form.Field>
          </>
        );
      case 'schedule':
        return (
          <>
            <Form.Field>
              <label>Cron Expression</label>
              <Input
                name='cron'
                value={config.cron || ''}
                onChange={this.handleEditConfigChange}
                placeholder='Enter cron expression (e.g., 0 * * * *)'
              />
            </Form.Field>
            <Form.Field>
              <label>Timezone</label>
              <Input
                name='timezone'
                value={config.timezone || ''}
                onChange={this.handleEditConfigChange}
                placeholder='Enter timezone (e.g., UTC)'
              />
            </Form.Field>
          </>
        );
      case 'event':
        return (
          <Form.Field>
            <label>Event Type</label>
            <Input
              name='event_type'
              value={config.event_type || ''}
              onChange={this.handleEditConfigChange}
              placeholder='Enter event type'
            />
          </Form.Field>
        );
      default:
        return null;
    }
  };

  render () {
    const { alerts = { alerts: [] }, loading, error } = this.props;
    const { triggers = [], creating, updating } = this.props.triggers;
    const { modalOpen, editModalOpen, newTrigger, editingTrigger, activeTab } = this.state;

    console.log('AlertsHome render:', { alerts, loading, error });

    // Show loading state while fetching data
    if (loading) {
      return (
        <Segment loading>
          <Header as='h1'>
            <Icon name='exclamation triangle' />
            <Header.Content>
              Alerts
              <Header.Subheader>Loading alerts...</Header.Subheader>
            </Header.Content>
          </Header>
        </Segment>
      );
    }

    const triggerTypes = [
      { key: 'keyword', text: 'Keyword', value: 'keyword' },
      { key: 'topic', text: 'Topic', value: 'topic' },
      { key: 'threshold', text: 'Threshold', value: 'threshold' },
      { key: 'schedule', text: 'Schedule', value: 'schedule' },
      { key: 'event', text: 'Event', value: 'event' }
    ];

    const panes = [
      {
        menuItem: { key: 'alerts', icon: 'bell', content: 'Alerts' },
        render: () => {
          console.log('Alerts tab render:', { alerts, loading, error });
          return (
            <Tab.Pane>
              {error && (
                <Message negative>
                  <Message.Header>Error</Message.Header>
                  <p>{error}</p>
                </Message>
              )}

              <Message>
                <p>You can automate alerts using <a href='#triggers'>Triggers</a>.</p>
              </Message>

              {!loading && !error && (!alerts.alerts || alerts.alerts.length === 0) && (
                <Message positive>
                  <Message.Header>All Clear!</Message.Header>
                  <p>There are no unresolved alerts at this time.</p>
                </Message>
              )}

              {!loading && !error && alerts.alerts && alerts.alerts.length > 0 && (
                <List divided relaxed>
                  {alerts.alerts.map((alert, index) => (
                    <List.Item key={index}>
                      <List.Icon name='warning sign' size='large' verticalAlign='middle' />
                      <List.Content>
                        <List.Header>{alert.title || 'Alert'}</List.Header>
                        <List.Description>{alert.message}</List.Description>
                        {alert.timestamp && (
                          <List.Description>
                            <small>{new Date(alert.timestamp).toLocaleString()}</small>
                          </List.Description>
                        )}
                      </List.Content>
                    </List.Item>
                  ))}
                </List>
              )}
            </Tab.Pane>
          );
        }
      },
      {
        menuItem: { key: 'triggers', icon: 'bolt', content: 'Triggers' },
        render: () => (
          <Tab.Pane>
            <Header as='h2'>
              Triggers
              <Button
                primary
                floated='right'
                onClick={this.handleOpenModal}
                icon='plus'
                content='Create Trigger'
              />
            </Header>
            <p>Triggers are used to create alerts based on specific conditions.  For example, you can create a trigger to alert you when a specific keyword is mentioned on social media.</p>

            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Name</Table.HeaderCell>
                  <Table.HeaderCell>Description</Table.HeaderCell>
                  <Table.HeaderCell>Type</Table.HeaderCell>
                  <Table.HeaderCell>Active</Table.HeaderCell>
                  <Table.HeaderCell>Last Triggered</Table.HeaderCell>
                  <Table.HeaderCell>Actions</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {triggers.map((trigger, index) => (
                  <Table.Row key={index}>
                    <Table.Cell>{trigger.name}</Table.Cell>
                    <Table.Cell>{trigger.description}</Table.Cell>
                    <Table.Cell>{trigger.type}</Table.Cell>
                    <Table.Cell>{trigger.active ? 'Yes' : 'No'}</Table.Cell>
                    <Table.Cell>{trigger.lastTriggered ? new Date(trigger.lastTriggered).toLocaleString() : 'Never'}</Table.Cell>
                    <Table.Cell>
                      <Button.Group size='small'>
                        <Button icon='edit' onClick={() => this.handleOpenEditModal(trigger)} />
                        <Button icon='trash' />
                      </Button.Group>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </Tab.Pane>
        )
      }
    ];

    return (
      <div className='fade-in' loading={loading} style={{ maxHeight: '100%', height: '97vh' }}>
        <Header as='h1'>
          <Icon name='exclamation triangle' />
          <Header.Content>
            Alerts
            <Header.Subheader>System notifications and important updates</Header.Subheader>
          </Header.Content>
        </Header>

        <Tab 
          panes={panes} 
          activeIndex={activeTab === 'alerts' ? 0 : 1}
          onTabChange={(e, { activeIndex }) => {
            const tabName = activeIndex === 0 ? 'alerts' : 'triggers';
            this.handleTabClick(e, { name: tabName });
          }}
        />

        <Modal
          open={modalOpen}
          onClose={this.handleCloseModal}
          size='small'
        >
          <Modal.Header>Create New Trigger</Modal.Header>
          <Modal.Content>
            <Form>
              <Form.Field>
                <label>Type</label>
                <Select
                  name='type'
                  value={newTrigger.type}
                  onChange={this.handleInputChange}
                  options={[
                    { key: 'keyword', text: 'Keyword', value: 'keyword' }
                  ]}
                  placeholder='Select trigger type'
                />
              </Form.Field>
              {this.renderConfigFields()}
              {this.state.formStep >= 3 && (
                <>
                  <Form.Field>
                    <label>Description</label>
                    <Input
                      name='description'
                      value={newTrigger.description}
                      onChange={this.handleInputChange}
                      placeholder='Enter trigger description'
                    />
                  </Form.Field>
                  <Form.Field>
                    <label>Name</label>
                    <Input
                      name='name'
                      value={newTrigger.name}
                      onChange={this.handleInputChange}
                      placeholder='Enter trigger name'
                    />
                  </Form.Field>
                </>
              )}
            </Form>
          </Modal.Content>
          <Modal.Actions>
            <Button onClick={this.handleCloseModal}>Cancel</Button>
            <Button
              primary
              onClick={this.handleSubmit}
              loading={creating}
              disabled={!newTrigger.name || !newTrigger.type}
            >
              Create
            </Button>
          </Modal.Actions>
        </Modal>

        <Modal
          open={editModalOpen}
          onClose={this.handleCloseEditModal}
          size='small'
        >
          <Modal.Header>Edit Trigger</Modal.Header>
          <Modal.Content>
            <Form>
              <Form.Field>
                <label>Name</label>
                <Input
                  name='name'
                  value={editingTrigger?.name || ''}
                  onChange={this.handleEditInputChange}
                  placeholder='Enter trigger name'
                />
              </Form.Field>
              <Form.Field>
                <label>Description</label>
                <Input
                  name='description'
                  value={editingTrigger?.description || ''}
                  onChange={this.handleEditInputChange}
                  placeholder='Enter trigger description'
                />
              </Form.Field>
              <Form.Field>
                <label>Type</label>
                <Select
                  name='type'
                  value={editingTrigger?.type || ''}
                  onChange={this.handleEditInputChange}
                  options={triggerTypes}
                  placeholder='Select trigger type'
                />
              </Form.Field>
              {this.renderEditConfigFields()}
            </Form>
          </Modal.Content>
          <Modal.Actions>
            <Button onClick={this.handleCloseEditModal}>Cancel</Button>
            <Button
              primary
              onClick={this.handleEditSubmit}
              loading={updating}
              disabled={!editingTrigger?.name || !editingTrigger?.type}
            >
              Save Changes
            </Button>
          </Modal.Actions>
        </Modal>
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = AlertsHome;
