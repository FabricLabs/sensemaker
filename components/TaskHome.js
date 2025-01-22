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
  Table,
  Transition
} = require('semantic-ui-react');

// Local Components
const ChatBox = require('./ChatBox');
const GeneratedResponse = require('./GeneratedResponse');
const HeaderBar = require('./HeaderBar');

class TaskHome extends React.Component {
  constructor (settings = {}) {
    super(settings);

    this.state = {
      loading: false
    };
  }

  componentDidMount () {
    this.props.fetchTasks();
  }

  componentDidUpdate (prevProps) {
    const { tasks } = this.props;
  }

  handleTaskCompletionChange = (e) => {
    const now = new Date();
    this.props.updateTask(e.target.id, { completed_at: now });
    this.setState({ taskCompletion: now });
    // TODO: also receive events from WebSocket
    this.props.fetchTasks();
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
      <sensemaker-task-home class='fade-in' style={{ height: '100%' }}>
        <Segment className='fade-in' loading={network?.loading} style={{ maxHeight: '100%' }}>
          <h2>Tasks</h2>
          <p>{BRAND_NAME} will monitor active tasks and perform background work to assist you in completing them.</p>
          <p>To get started, create a task below.</p>
          <Form huge fluid onSubmit={this.handleTaskSubmit}>
            <Form.Field fluid onChange={this.handleTaskInputChange} loading={this.state.loading}>
              <label>Task</label>
              <Input fluid type='text' name='title' placeholder='e.g., do the laundry, etc.' action={<Button primary content='Create Task &raquo;' />} />
            </Form.Field>
          </Form>
          <Table compact>
            <Table.Header fullWidth={true}>
              <Table.Row>
                <Table.HeaderCell><Input type='checkbox' disabled={true} title='Not yet enabled.' style={{ transform: 'scale(1.5)', marginLeft: '1em' }} /></Table.HeaderCell>
                <Table.HeaderCell>Task</Table.HeaderCell>
                <Table.HeaderCell></Table.HeaderCell>
                <Table.HeaderCell textAlign='right'>
                  <Button.Group>
                    <Button basic active><Icon name='asterisk' /> All</Button>
                    <Button basic disabled><Icon name='sun' /> Active</Button>
                    <Button basic disabled><Icon name='disk' /> Archive</Button>
                  </Button.Group>
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body animation='fade right'>
              {tasks && tasks.tasks.map((x) => {
                return (
                  <Table.Row className='fade-in' key={x.id}>
                    <Table.Cell collapsing><Input id={x.id} type='checkbox' name='task_is_complete' checked={(x.completed_at) ? true : false} onChange={this.handleTaskCompletionChange} className='desktop-only' style={{ transform: 'scale(1.5)', marginLeft: '1em' }} /></Table.Cell>
                    <Table.Cell collapsing>{x.title}</Table.Cell>
                    <Table.Cell collapsing></Table.Cell>
                    <Table.Cell collapsing textAlign='right'>
                      <Button.Group basic className='desktop-only'>
                        {(x.can_edit) ? (<Button icon disabled={true}><Icon name='pencil' /></Button>) : null}
                        {(x.can_edit) ? (<Button icon disabled={true}><Icon name='archive' /></Button>) : null}
                        <Button icon disabled={true}><Icon name='thumbtack' /></Button>
                      </Button.Group>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
          <GeneratedResponse
            request={{
              query: 'Suggest next steps for completing the list of tasks.  Respond directly to the user.',
              messages: [
                {
                  role: 'user',
                  content: `The following is a list of tasks: ${JSON.stringify(
                    tasks.tasks.filter((x) => {
                      return (x.completed_at) ? false : true;
                    }).map((x) => {
                      return {
                        title: x.title,
                        due_date: x.due_date
                      }
                    })
                  )}`
                }
              ]
            }}
            chat={this.props.chat}
            context={{ tasks: tasks.tasks, summary: response?.content }}
            fetchResponse={this.props.fetchResponse}
            placeholder={'Let\'s start with...'}
            {...this.props}
          />
        </Segment>
      </sensemaker-task-home>
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
