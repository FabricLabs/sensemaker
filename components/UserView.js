'use strict';

const React = require('react');
const { Link } = require('react-router-dom');

const {
  Button,
  Card,
  Grid,
  Header,
  Icon,
  List,
  Segment
} = require('semantic-ui-react');

class UserView extends React.Component {
  constructor (props) {
    super(props);
  }

  componentDidMount () {
    this.props.fetchUser(this.props.username);
  }

  render () {
    return (
      <div>
        <div>
          <Button onClick={() => { history.back(); }} icon color='black'><Icon name='left chevron' /> Back</Button>
        </div>
        <Grid columns={2}>
          <Grid.Column width={4}>
            <Card floated='left'>
              <Card.Content>
                <Card.Header as='h1'>{this.props.username}</Card.Header>
                <Card.Meta><abbr title={(new Date()).toISOString()}>{(new Date()).toISOString()}</abbr></Card.Meta>
              </Card.Content>
            </Card>
          </Grid.Column>
          <Grid.Column width={12}>
            <Segment style={{ marginLeft: '300px' }}>
              <div>{this.props.biography || 'This user has not yet created a public profile.'}</div>
            </Segment>
          </Grid.Column>
        </Grid>
        <Segment>
          <Header as='h2'>Network</Header>
          <List>
            <List.Item><Link to='/users/sensemaker'>sensemaker</Link></List.Item>
          </List>
        </Segment>
        <Segment attached='bottom'>
          <Header as='h2'>Conversations</Header>
        </Segment>
      </div>
    );
  }

  toHTML () {
    return React.createElement('div', null, 'UserView');
  }
}

module.exports = UserView;
