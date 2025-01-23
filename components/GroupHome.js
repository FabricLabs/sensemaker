'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

// Components
// Semantic UI
const {
  Button,
  Card,
  Form,
  Header,
  Icon,
  Input,
  List,
  Segment
} = require('semantic-ui-react');

// Local Components
const ChatBox = require('./ChatBox');

class GroupHome extends React.Component {
  constructor (settings = {}) {
    super(settings);
    this.state = {};
  }

  componentDidMount () {
    this.props.fetchGroups();
  }

  handleGroupCompletionChange = (e) => {
    console.debug('group completion changed, target:', e.target);
    console.debug('group completion changed, value:', e.target.value);
    const now = new Date();
    // TODO: mark completion
    this.setState({ groupCompletion: e.target.value });
  }

  handleGroupInputChange = (e) => {
    this.setState({ groupName: e.target.value });
  }

  handleGroupSubmit = async (e) => {
    this.setState({ loading: true })
    const group = await this.props.createGroup({ name: this.state.groupName });
    this.setState({ groupName: '', loading: false });
    this.props.fetchGroups();
  }

  render () {
    const { groups } = this.props;
    return (
      <Segment loading={groups.loading} style={{ maxHeight: '100%', height: '97vh' }} class='fade-in'>
        <Header as='h1'>GROUPS</Header>
        <p>Sensemaker utilizes groups to manage sharing and alert distribution.  Create a group here to begin syncing.</p>
        <div>
          <Form huge fluid>
            <Form.Field fluid>
              <label>Group Name</label>
              <Input fluid placeholder='Group Name' value={this.state.groupName} onChange={this.handleGroupInputChange} action={<Button onClick={this.handleGroupSubmit}>Create Group</Button>} />
            </Form.Field>
          </Form>
          <Card.Group style={{ marginTop: '1em' }}>
            {groups && groups.groups && groups.groups.map((group) => (
              <Card key={group.id} as={Link} to={`/groups/${group.id}`} className='fade-in'>
                <Card.Content>
                  <Card.Header>{group.name}</Card.Header>
                  <Card.Meta>Members: {group?.members?.length}</Card.Meta>
                  <Card.Description>
                    <List>
                      {group.members && group.members.map((member) => (
                        <List.Item key={member.id}>
                          <List.Icon name='user' />
                          <List.Content>
                            <List.Header>{member.name}</List.Header>
                            <List.Description>{member.email}</List.Description>
                          </List.Content>
                        </List.Item>
                      ))}
                    </List>
                  </Card.Description>
                </Card.Content>
              </Card>
            ))}
          </Card.Group>
          <ChatBox {...this.props} context={{ groups: groups?.groups }} placeholder='Ask about these groups...' />
        </div>
      </Segment>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = GroupHome;
