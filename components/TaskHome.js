'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Button,
  Card,
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

class TaskHome extends React.Component {
  constructor (settings = {}) {
    super(settings);

    this.state = {
      loading: false,
    };
  }

  componentDidMount () {
    // this.props.fetchPeers();
  }

  componentDidUpdate (prevProps) {
    const { tasks } = this.props;
    if (prevProps.tasks !== tasks) {
      // if (!tasks.loading) {
      //   this.setState({ loading: false });
      // }
    }
  };

  render () {
    const { network, tasks } = this.props;
    // const { loading } = this.state;

    return (
      <Segment loading={network?.loading} style={{ maxHeight: '100%', height: '97vh' }}>
        <Header as='h1'>Task List</Header>
        <Card>
          <Card.Content>
            <Card.Header>Status</Card.Header>
            <Card.Meta>Connected</Card.Meta>
            <Card.Description>
              <Icon name='check' color='green' /> Connected to the network.
            </Card.Description>
          </Card.Content>
        </Card>
        <Divider />
        <Header as='h2'>Local</Header>
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
              <Table.Cell>1</Table.Cell>
              <Table.Cell><Input type='checkbox' name='task_is_complete' checked={true} /></Table.Cell>
              <Table.Cell><code>text/plain</code></Table.Cell>
              <Table.Cell><code>DO NO HARM TO HUMANS</code></Table.Cell>
              <Table.Cell><code>DO NO HARM TO HUMANS</code></Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
        <Divider />
        <Link to={"/tasks/new"}>
          <Button primary content='+ Add Task' />
        </Link>
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
