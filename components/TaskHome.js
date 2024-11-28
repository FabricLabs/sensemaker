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
    if (prevProps.tasks !== tasks) {
      // if (!tasks.loading) {
      //   this.setState({ loading: false });
      // }
    }
  }

  handleTaskInputChange = (e) => {
    console.debug('got change:', e);
    this.setState({ taskTitle: e.target.value });
  }

  handleTaskSubmit = async (e) => {
    console.debug('got submit:', e);
    this.setState({ loading: true })
    const task = await this.props.createTask({ title: this.state.taskTitle });
    console.debug('task:', task);
    this.setState({ title: '', loading: false });
    this.props.fetchTasks();
  }

  render () {
    const { network, tasks } = this.props;
    // const { loading } = this.state;
    return (
      <Segment className='fade-in' loading={network?.loading} style={{ maxHeight: '100%', height: '97vh' }}>
        <h2>Tasks</h2>
        <p>{BRAND_NAME} will monitor active tasks and perform background work to assist you in completing them.</p>
        <p>To get started, create a task below.</p>
        <Form large fluid onSubmit={this.handleTaskSubmit}>
          <Form.Group inline onChange={this.handleTaskInputChange} loading={this.state.loading}>
            <Form.Field>
              <label>Task</label>
              <Input type='text' name='title' placeholder='e.g., do the laundry, etc.' />
            </Form.Field>
            <Form.Field>
              <Button primary content='Create Task' />
            </Form.Field>
          </Form.Group>
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
                  <Table.Cell><Input type='checkbox' name='task_is_complete' checked={(x.completed_at) ? true : false} /></Table.Cell>
                  <Table.Cell>{x.title}</Table.Cell>
                  <Table.Cell right aligned>
                    <Icon name='pencil' />
                    <Icon name='archive' />
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
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
