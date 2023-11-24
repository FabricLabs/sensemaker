'use strict';

const React = require('react');

const {
  Button,
  Card,
  Header,
  Label,
  Segment,
  Table,
  Form,
  Modal
} = require('semantic-ui-react');

const QueryCounter = require('./QueryCounter');

class JeevesUserSettings extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      username: this.props.auth.username,
      email: this.props.auth.email,
      isPasswordModalOpen: false,
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: '',
      isNewPasswordValid: true,
      passwordMatch: true,
    };
  }

  // Toggle the modal
  togglePasswordModal = () => {
    this.setState(prevState => ({
      isPasswordModalOpen: !prevState.isPasswordModalOpen
    }));
  };


  // Handle input change
  handleInputChange = (e, { name, value }) => {
    this.setState({ [name]: value });
  };
  validateNewPassword = (newPassword) => {
    const hasEightCharacters = newPassword.length >= 8;
    const hasCapitalLetter = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    return hasEightCharacters && hasCapitalLetter && hasNumber;
  };

  validatePasswordsMatch = () =>{
    return (this.state.newPassword === this.state.confirmNewPassword);
  }

  handleInputChange = (e, { name, value }) => {
    this.setState({ [name]: value }, () => {
      if (name === 'newPassword') {
        const isValid = this.validateNewPassword(this.state.newPassword);
        this.setState({ isNewPasswordValid: isValid });
      }
      if (name === 'confirmNewPassword') {
        const isMatched = this.validatePasswordsMatch();
        this.setState({ passwordMatch: isMatched })
      }

      console.log('pass1: ', this.state.newPassword, 'pass2: ', this.state.confirmNewPassword);
    });
  };

  // Handle form submission
  handlePasswordSubmit = async () => {
    const { oldPassword, newPassword, confirmNewPassword } = this.state; 
    
    try {
      const password = oldPassword
      const response = await fetch('/passwordCheck', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.props.auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
 
      const respuesta = await response.json();    
      console.log(respuesta);     

      //falta comparar que la password nueva sea distinta a la vieja, probablemente deba arreglar en el endpoint para que ya compare la pass nueva todo en
      //el mismo endpoing, tener en cuenta esto
    } catch (error) {
     console.log(error.message);
    }
    
   // this.togglePasswordModal();
  };

  renderPasswordChangeModal = () => {
    const { isPasswordModalOpen, oldPassword, newPassword, confirmNewPassword,isNewPasswordValid,passwordMatch } = this.state;

    const passwordInputStyle = isNewPasswordValid ? { borderColor: 'green' } : { borderColor: 'red' };

    const passwordError = isNewPasswordValid ? null : {
      content: 'The password must be at least 8 characters, include a capital letter and a number.',
      pointing: 'above',
    };

    const passwordNotMatchError = passwordMatch ? null : {
      content: 'Both passwords must match.',
      pointing: 'above',
    };


    return (
      <Modal
        open={isPasswordModalOpen}
        onClose={this.togglePasswordModal}
        size='medium'
      >
        <Modal.Header>Change Your Password</Modal.Header>
        <Modal.Content>
          <Form onSubmit={this.handlePasswordSubmit}>
            <Form.Input
              label='Old Password'
              type='password'
              name='oldPassword'
              onChange={this.handleInputChange}
              required
            />
            <Form.Input
              label='New Password'
              type='password'
              name='newPassword'
              value={newPassword}
              style={passwordInputStyle}
              error={passwordError}
              onChange={this.handleInputChange}
              required
            />
            <Form.Input
              label='Confirm New Password'
              type='password'
              name='confirmNewPassword'
              value={confirmNewPassword}
              error={passwordNotMatchError}
              onChange={this.handleInputChange}
              required
            />

          {(isNewPasswordValid && passwordMatch && newPassword && confirmNewPassword) && (
            <p style={{ color: 'green' }}>Both passwords are correct</p>
          )}
            <Modal.Actions>
              <Button content="Close" icon='close' size='small' secondary onClick={this.togglePasswordModal}/> 
              <Button content="Submit" type='submit' size='small' primary/>
            </Modal.Actions>
          </Form>
        </Modal.Content>
      </Modal>
    );
  };

  render () {

    const { username,email } = this.state;  
    
    return (
      <jeeves-user-settings class='fade-in'>
        <Segment fluid style={{ marginRight: '1em' }} textAlign='center'>
          <Header as='h1' textAlign='center'>Settings</Header>
          {/* <Header as='h2'>Account</Header>
          <Card>
            <Card.Content>
              <Header as='h3'>Profile</Header>
              <p>Email: {email}</p>
              <p>Username: {username}</p>
              <p>Password: <code>****</code> <Button size='tiny'>change</Button></p>
            </Card.Content>
          </Card> */}
          <container className='settings-container' >            
            <Header as='h2'>Account</Header>
            <Table size='small'>
              <Table.Header>
                <Table.Row>
                <Table.HeaderCell>
                  <Header as='h3'>Profile</Header>
                </Table.HeaderCell>
                <Table.HeaderCell/>
                <Table.HeaderCell/>
                </Table.Row>               
              </Table.Header>
              <Table.Body>
                <Table.Row>
                  <Table.Cell><Header as='h4'>Username:</Header></Table.Cell>
                  <Table.Cell><p>{username}</p></Table.Cell>
                  <Table.Cell/>
                </Table.Row>
                <Table.Row>
                  <Table.Cell><Header as='h4'>Email:</Header></Table.Cell>
                  <Table.Cell><p>{email}</p></Table.Cell>
                  <Table.Cell textAlign='center'><Button primary>Change</Button></Table.Cell>
                  
                </Table.Row>
                <Table.Row>
                  <Table.Cell><Header as='h4'>Password:</Header></Table.Cell>
                  <Table.Cell><code>*******</code> </Table.Cell>
                  <Table.Cell textAlign='center' onClick={this.togglePasswordModal}><Button primary>Change</Button></Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>
          </container>
          <container className='billing-container'>
            <div>
            <Header as='h2'>Billing</Header>
            <Card>
              <Card.Content>
                <Header as='h4'>Usage</Header>
                <QueryCounter />
              </Card.Content>
            </Card>
          </div>
          <div>
          <Header as='h2'>Current Plan</Header>
          <Card>
            <Card.Content>
              <Header as='h4'>Guest Pass</Header>
              <p>
                <span>Free</span><br />
                <strong>Renewal:</strong> <Label>disabled</Label>
              </p>
            </Card.Content>
          </Card>
          </div>
          </container>
        </Segment>
        {this.renderPasswordChangeModal()}
      </jeeves-user-settings>
    );
  }
};

module.exports = JeevesUserSettings;
