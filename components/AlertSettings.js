'use strict';

const React = require('react');
const {
  Segment,
  Header,
  Form,
  Button,
  Icon,
  List,
  Modal,
  Message,
  Input,
  Select,
  TextArea
} = require('semantic-ui-react');

class AlertSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      topics: [],
      triggers: [],
      loading: true,
      error: null,
      showCreateModal: false,
      newAlert: {
        title: '',
        message: '',
        type: 'info',
        topic: '',
        trigger: {
          type: 'threshold',
          value: '',
          condition: 'above'
        }
      }
    };
  }

  componentDidMount() {
    this.fetchTopics();
    this.fetchTriggers();
  }

  fetchTopics = async () => {
    try {
      const response = await fetch('/api/topics');
      const data = await response.json();
      this.setState({ topics: data, loading: false });
    } catch (error) {
      this.setState({ error: error.message, loading: false });
    }
  };

  fetchTriggers = async () => {
    try {
      const response = await fetch('/api/triggers');
      const data = await response.json();
      this.setState({ triggers: data });
    } catch (error) {
      this.setState({ error: error.message });
    }
  };

  handleCreateAlert = async () => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.state.newAlert)
      });

      if (!response.ok) {
        throw new Error('Failed to create alert');
      }

      this.setState({
        showCreateModal: false,
        newAlert: {
          title: '',
          message: '',
          type: 'info',
          topic: '',
          trigger: {
            type: 'threshold',
            value: '',
            condition: 'above'
          }
        }
      });

      // Refresh alerts list
      if (this.props.onAlertCreated) {
        this.props.onAlertCreated();
      }
    } catch (error) {
      this.setState({ error: error.message });
    }
  };

  handleInputChange = (e, { name, value }) => {
    this.setState(prevState => ({
      newAlert: {
        ...prevState.newAlert,
        [name]: value
      }
    }));
  };

  handleTriggerChange = (e, { name, value }) => {
    this.setState(prevState => ({
      newAlert: {
        ...prevState.newAlert,
        trigger: {
          ...prevState.newAlert.trigger,
          [name]: value
        }
      }
    }));
  };

  render() {
    const { topics, triggers, loading, error, showCreateModal, newAlert } = this.state;

    return (
      <Segment loading={loading}>
        <Header as="h2">
          <Icon name="bell" />
          <Header.Content>
            Alert Settings
            <Header.Subheader>Configure your alert topics and triggers</Header.Subheader>
          </Header.Content>
        </Header>

        {error && (
          <Message negative>
            <Message.Header>Error</Message.Header>
            <p>{error}</p>
          </Message>
        )}

        <Button
          primary
          icon
          labelPosition="left"
          onClick={() => this.setState({ showCreateModal: true })}
          style={{ marginBottom: '1em' }}
        >
          <Icon name="plus" />
          Create New Alert
        </Button>

        <Modal
          open={showCreateModal}
          onClose={() => this.setState({ showCreateModal: false })}
          size="small"
        >
          <Modal.Header>Create New Alert</Modal.Header>
          <Modal.Content>
            <Form>
              <Form.Field>
                <label>Title</label>
                <Input
                  name="title"
                  value={newAlert.title}
                  onChange={this.handleInputChange}
                  placeholder="Alert title"
                />
              </Form.Field>

              <Form.Field>
                <label>Message</label>
                <TextArea
                  name="message"
                  value={newAlert.message}
                  onChange={this.handleInputChange}
                  placeholder="Alert message"
                />
              </Form.Field>

              <Form.Field>
                <label>Type</label>
                <Select
                  name="type"
                  value={newAlert.type}
                  onChange={this.handleInputChange}
                  options={[
                    { key: 'info', text: 'Info', value: 'info' },
                    { key: 'warning', text: 'Warning', value: 'warning' },
                    { key: 'error', text: 'Error', value: 'error' }
                  ]}
                />
              </Form.Field>

              <Form.Field>
                <label>Topic</label>
                <Select
                  name="topic"
                  value={newAlert.topic}
                  onChange={this.handleInputChange}
                  options={topics.map(topic => ({
                    key: topic.id,
                    text: topic.name,
                    value: topic.id
                  }))}
                  placeholder="Select a topic"
                />
              </Form.Field>

              <Form.Field>
                <label>Trigger Type</label>
                <Select
                  name="type"
                  value={newAlert.trigger.type}
                  onChange={this.handleTriggerChange}
                  options={[
                    { key: 'threshold', text: 'Threshold', value: 'threshold' },
                    { key: 'schedule', text: 'Schedule', value: 'schedule' },
                    { key: 'event', text: 'Event', value: 'event' }
                  ]}
                />
              </Form.Field>

              {newAlert.trigger.type === 'threshold' && (
                <>
                  <Form.Field>
                    <label>Value</label>
                    <Input
                      name="value"
                      value={newAlert.trigger.value}
                      onChange={this.handleTriggerChange}
                      placeholder="Threshold value"
                    />
                  </Form.Field>

                  <Form.Field>
                    <label>Condition</label>
                    <Select
                      name="condition"
                      value={newAlert.trigger.condition}
                      onChange={this.handleTriggerChange}
                      options={[
                        { key: 'above', text: 'Above', value: 'above' },
                        { key: 'below', text: 'Below', value: 'below' },
                        { key: 'equals', text: 'Equals', value: 'equals' }
                      ]}
                    />
                  </Form.Field>
                </>
              )}
            </Form>
          </Modal.Content>
          <Modal.Actions>
            <Button onClick={() => this.setState({ showCreateModal: false })}>
              Cancel
            </Button>
            <Button primary onClick={this.handleCreateAlert}>
              Create Alert
            </Button>
          </Modal.Actions>
        </Modal>

        <Header as="h3">Topics</Header>
        <List divided relaxed>
          {topics.map(topic => (
            <List.Item key={topic.id}>
              <List.Icon name="tag" size="large" verticalAlign="middle" />
              <List.Content>
                <List.Header>{topic.name}</List.Header>
                <List.Description>{topic.description}</List.Description>
              </List.Content>
            </List.Item>
          ))}
        </List>

        <Header as="h3">Triggers</Header>
        <List divided relaxed>
          {triggers.map(trigger => (
            <List.Item key={trigger.id}>
              <List.Icon name="bolt" size="large" verticalAlign="middle" />
              <List.Content>
                <List.Header>{trigger.name}</List.Header>
                <List.Description>{trigger.description}</List.Description>
              </List.Content>
            </List.Item>
          ))}
        </List>
      </Segment>
    );
  }
}

module.exports = AlertSettings;