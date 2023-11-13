'use strict';

const React = require('react');

const {
  Button,
  Card,
  Header,
  Label,
  Segment
} = require('semantic-ui-react');

const QueryCounter = require('./QueryCounter');

class JeevesUserSettings extends React.Component {

  constructor (props) {
    super(props);

    this.state = {
      username: '',
      email: '',
    };
  }

  // componentDidMount(){
  //   const dbRequest = indexedDB.open("JeevesSession", 1);
  
  //   dbRequest.onsuccess = (event) => {
  //       const db = event.target.result;      
  //       const transaction = db.transaction(['session'], 'readonly');
  //       const objectStore = transaction.objectStore('session');
  //       const request = objectStore.get('authSession');
    
  //       request.onsuccess = (event) => {
  //         if (request.result) {
  //           const session = request.result.value;
  //           this.setState({username: session.username, email: session.email});
  //         }
  //       };
    
  //       request.onerror = (event) => {
  //         console.error("IndexedDB error:", event.target.errorCode);
  //       };        
  //   };
  
  //   dbRequest.onerror = function(event) {
  //     console.error("IndexedDB error:", event.target.errorCode);
  //   };
  // }

  render () {
    // const { username } = this.props.login;
    // const { email } = this.props.auth;
    const { username,email } = this.props;  
    console.log(this.props);
    return (
      <jeeves-user-settings class='fade-in'>
        <Segment fluid style={{ marginRight: '1em' }}>
          <Header as='h1'>Settings</Header>
          <Header as='h2'>Account</Header>
          <Card>
            <Card.Content>
              <Header as='h3'>Profile</Header>
              <p>Email: {email}</p>
              <p>Username: {username}</p>
              <p>Password: <code>****</code> <Button size='tiny'>change</Button></p>
            </Card.Content>
          </Card>
          <Header as='h2'>Billing</Header>
          <Card>
            <Card.Content>
              <Header as='h4'>Usage</Header>
              <QueryCounter />
            </Card.Content>
          </Card>
          <Header as='h3'>Current Plan</Header>
          <Card>
            <Card.Content>
              <Header as='h4'>Guest Pass</Header>
              <p>
                <span>Free</span><br />
                <strong>Renewal:</strong> <Label>disabled</Label>
              </p>
            </Card.Content>
          </Card>
        </Segment>
      </jeeves-user-settings>
    );
  }
};

module.exports = JeevesUserSettings;
