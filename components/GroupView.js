'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Breadcrumb,
  Button,
  Card,
  Form,
  Header,
  Icon,
  Input,
  List,
  Segment
} = require('semantic-ui-react');

class GroupView extends React.Component {
  constructor (settings = {}) {
    super(settings);
    this.state = {};
  }

  componentDidMount () {
    this.props.fetchGroup();
  }

  handleGroupMemberCompletionChange = (e) => {
    console.debug('group completion changed, target:', e.target);
    console.debug('group completion changed, value:', e.target.value);
    const now = new Date();
    // TODO: mark completion
    this.setState({ groupCompletion: e.target.value });
  }

  handleGroupMemberInputChange = (e) => {
    this.setState({ groupMemberName: e.target.value });
  }

  handleGroupMemberSubmit = async (e) => {
    this.setState({ loading: true })
    const group = await this.props.addMemberToGroup({ name: this.state.groupMemberName });
    this.setState({ groupMemberName: '', loading: false });
    this.props.fetchGroups();
  }

  render () {
    const { groups } = this.props;
    return (
      <div>
        <div>
          <Button onClick={() => { history.back(); }} icon color='black'><Icon name='left chevron' /> Back</Button>
          <Breadcrumb style={{ marginLeft: '1em' }}>
            <Breadcrumb.Section><Link to='/groups'>Groups</Link></Breadcrumb.Section>
            <Breadcrumb.Divider />
            <Breadcrumb.Section active>{groups.current.name}</Breadcrumb.Section>
          </Breadcrumb>
        </div>
        <Segment loading={groups.loading} style={{ maxHeight: '100%', height: 'auto' }}>
          <Header as='h2'>{groups.current.name}</Header>
          <p>foo</p>
          <h3>Members</h3>
          <Form>
            <Form.Field>
              <label>Member Name</label>
              <Input
                placeholder='Member Name'
                value={this.state.groupMemberName}
                onChange={this.handleGroupMemberInputChange}
              />
            </Form.Field>
            <Button type='submit' onClick={this.handleGroupMemberSubmit}>Add Member</Button>
          </Form>
          <List>
            {groups.current && groups.current.members && groups.current.members.map((member) => (
              <List.Item key={member.id}>
                <List.Content>
                  <List.Header>{member.name}</List.Header>
                  <List.Description>{member.email}</List.Description>
                </List.Content>
              </List.Item>
            ))}
          </List>
        </Segment>
      </div>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = GroupView;
