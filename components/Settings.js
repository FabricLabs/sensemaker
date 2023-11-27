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
  Modal,
  Message
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
      allValid: true,
      invalidOldPassword: false,
      passwordUpdated: false,
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
    return (this.state.newPassword && this.state.confirmNewPassword && this.state.newPassword === this.state.confirmNewPassword);
  }

  handleInputChange = (e, { name, value }) => {
    this.setState({ [name]: value }, () => {
        const isValidPassword = this.validateNewPassword(this.state.newPassword);
        const isMatched = this.validatePasswordsMatch();
        const isAllValid = (isValidPassword && isMatched && this.state.newPassword !== this.state.oldPassword);
        this.setState({ isNewPasswordValid: isValidPassword, passwordMatch: isMatched, allValid: isAllValid });   
    });
  };

  // Handle form submission
  handlePasswordSubmit = async () => {
    const { oldPassword, newPassword, confirmNewPassword, allValid } = this.state;
    if (allValid) {
      try {
        const response = await fetch('/passwordChange', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.props.auth.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ oldPassword, newPassword }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message);
        }
        this.setState({ passwordUpdated: true });
        //falta comparar que la password nueva sea distinta a la vieja, probablemente deba arreglar en el endpoint para que ya compare la pass nueva todo en
        //el mismo endpoing, tener en cuenta esto
      } catch (error) {
        if (error.message == 'Invalid password.') {
          this.setState({ invalidOldPassword: true });
        }
        console.log(error.message);
      }
    }

    // this.togglePasswordModal();
  };

  renderPasswordChangeModal = () => {
    const { 
      isPasswordModalOpen, 
      oldPassword, 
      newPassword, 
      confirmNewPassword,
      isNewPasswordValid,
      passwordMatch, 
      allValid,
      invalidOldPassword,
      passwordUpdated } = this.state;


   // const passwordInputStyle = isNewPasswordValid ? { borderColor: 'green' } : { borderColor: 'red' };
    const passwordError = (isNewPasswordValid || !newPassword) ? null : {
      content: 'The password must be at least 8 characters, include a capital letter and a number.',
      pointing: 'above',
    };

    const passwordNotMatchError = (passwordMatch || !confirmNewPassword) ? null : {
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
              //  style={passwordInputStyle}
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

            {(allValid && newPassword && !invalidOldPassword) && (
              <p style={{ color: 'green' }}>Both passwords are correct</p>
            )}
            {(oldPassword === newPassword) && (
              <p style={{ color: 'red' }}>Old password and new password must be different</p>
            )}
{/* 
              {invalidOldPassword && (
                <p style={{ color: 'red' }}>Old password is invalid</p>
            )} */}
            <Modal.Actions>
              {invalidOldPassword && (
                <Message negative> 
                  <Message.Header>Password error</Message.Header>
                  <p>Your old password is not correct, please try again.</p>           
                </Message>
              )}
              {passwordUpdated && (
                <Message positive> 
                  <Message.Header>Password updated</Message.Header>
                  <p>Your new password has been changed successfully. Use your new password to log in.</p>           
                </Message>
              )}
              
              <Button content="Close" icon='close' size='small' secondary onClick={this.togglePasswordModal} />
              <Button content="Submit" type='submit' size='small' primary disabled={!allValid} />
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
                  <Table.Cell textAlign='center'><Button primary disabled={true}>Change</Button></Table.Cell>
                  
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
