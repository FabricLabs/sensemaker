'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Button,
  Card,
  Form,
  Segment,
  Header,
  Label,
  List,
  Loader,
  Input,
  Divider,
  Icon,
  Table
} = require('semantic-ui-react');

const { createTask } = require('../actions/taskActions');
const CreateTaskModal = require('./CreateTaskModal');

class TaskView extends React.Component {
  constructor (settings = {}) {
    super(settings);

    this.state = {
      loading: false,
    };
  }

  componentDidMount () {
    this.props.fetchResource();
  }

  componentDidUpdate (prevProps) {
    const { task } = this.props;
    if (prevProps.task !== task) {
      // if (!task.loading) {
      //   this.setState({ loading: false });
      // }
    }
  }

  handleTaskChange = (e) => {
    console.debug('got change:', e.target.name, e.target.value);
    //createTask({ task: e.target.value });
  }

  render () {
    const { network, task } = this.props;
    // const { loading } = this.state;

    return (
      <Segment loading={network?.loading} style={{ maxHeight: '100%', height: '97vh' }}>
        <Header as='h1'></Header>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>#</Table.HeaderCell>
              <Table.HeaderCell></Table.HeaderCell>
              <Table.HeaderCell><code>Content-Type</code></Table.HeaderCell>
              <Table.HeaderCell>Title</Table.HeaderCell>
              <Table.HeaderCell>Content</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>{task.id}</Table.Cell>
              <Table.Cell><Input type='checkbox' name='task_is_complete' checked={true} /></Table.Cell>
              <Table.Cell><code>text/plain</code></Table.Cell>
              <Table.Cell><code>{task.title}</code></Table.Cell>
              <Table.Cell><code>{task.description}</code></Table.Cell>
            </Table.Row>
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

module.exports = TaskView;
