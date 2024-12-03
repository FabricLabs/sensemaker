'use strict';

// Constants
const { BRAND_NAME } = require('../constants');

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

// Components
// Semantic UI
const {
  Button,
  Form,
  Segment,
  Header,
  Input,
  Icon,
  Table
} = require('semantic-ui-react');

// Local Components
const ChatBox = require('./ChatBox');
const GeneratedResponse = require('./GeneratedResponse');

class TaskHome extends React.Component {
  constructor (settings = {}) {
    super(settings);

    this.state = {
      loading: false
    };
  }

  componentDidMount () {
    this.props.fetchTasks().then(this.props.fetchResponse);
  }

  componentDidUpdate (prevProps) {
    const { tasks } = this.props;
  }

  handleTaskCompletionChange = (e) => {
    console.debug('task completion changed, target:', e.target);
    console.debug('task completion changed, value:', e.target.value);
    const now = new Date();
    // TODO: mark completion
    this.setState({ taskCompletion: e.target.value });
  }

  handleTaskInputChange = (e) => {
    this.setState({ taskTitle: e.target.value });
  }

  handleTaskSubmit = async (e) => {
    this.setState({ loading: true })
    const task = await this.props.createTask({ title: this.state.taskTitle });
    this.setState({ taskTitle: '', loading: false });
    this.props.fetchTasks();
  }

  render () {
    const { network, tasks, response } = this.props;
    return (
      <Segment className='fade-in' loading={network?.loading} style={{ maxHeight: '100%', height: '97vh' }}>
        <h2>Tasks</h2>
        <p>{BRAND_NAME} will monitor active tasks and perform background work to assist you in completing them.</p>
        <p>To get started, create a task below.</p>
        <Form huge fluid onSubmit={this.handleTaskSubmit}>
          <Form.Field fluid onChange={this.handleTaskInputChange} loading={this.state.loading}>
            <label>Task</label>
            <Input fluid type='text' name='title' placeholder='e.g., do the laundry, etc.' action={<Button primary content='Create Task &raquo;' />} />
          </Form.Field>
        </Form>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell></Table.HeaderCell>
              <Table.HeaderCell>Task</Table.HeaderCell>
              <Table.HeaderCell></Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {tasks && tasks.tasks.map((x) => {
              return (
                <Table.Row>
                  <Table.Cell><Input type='checkbox' name='task_is_complete' checked={(x.completed_at) ? true : false} onChange={this.handleTaskCompletionChange} /></Table.Cell>
                  <Table.Cell>{x.title}</Table.Cell>
                  <Table.Cell right aligned>
                    {(x.can_edit) ? (<Icon name='pencil' />) : null}
                    {(x.can_edit) ? (<Icon name='archive' />) : null}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
        <GeneratedResponse request={{
          query: 'Suggest next steps.',
          messages: [
            { role: 'user', content: `The following is a list of tasks: ${JSON.stringify(tasks.tasks)}` }
          ]
        }} chat={this.props.chat} fetchResponse={this.props.fetchResponse} {...this.props} />
        <ChatBox
            {...this.props}
            context={{ tasks: tasks, summary: response?.content }}
            messagesEndRef={this.messagesEndRef}
            includeFeed={true}
            placeholder={`Your request...`}
            resetInformationSidebar={this.props.resetInformationSidebar}
            messageInfo={this.props.messageInfo}
            thumbsUp={this.props.thumbsUp}
            thumbsDown={this.props.thumbsDown}
          />
      </Segment>
    );
  }

  _toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }

  toHTML () {
    return this._toHTML();
  }
}

module.exports = TaskHome;
