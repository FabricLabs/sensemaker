'use strict';

const React = require('react');
const {
  Button,
  Form,
  Header,
  Message,
  Modal
} = require('semantic-ui-react');

class DisplayNameChangeModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newDisplayName: this.props.currentDisplayName,
      error: null,
      loading: false
    };
  }

  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value });
  }

  handleSubmit = async () => {
    const { newDisplayName } = this.state;
    const { token } = this.props;

    if (!newDisplayName) {
      this.setState({ error: 'Display name cannot be empty' });
      return;
    }

    this.setState({ loading: true, error: null });

    try {
      const response = await fetch('/settings/USER_DISPLAY_NAME', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ displayName: newDisplayName })
      });

      if (!response.ok) {
        throw new Error('Failed to update display name');
      }

      // Close modal and refresh page to show updated display name
      this.props.toggleDisplayNameModal();
      window.location.reload();
    } catch (error) {
      this.setState({
        error: error.message,
        loading: false
      });
    }
  }

  render () {
    const { open, toggleDisplayNameModal } = this.props;
    const { newDisplayName, error, loading } = this.state;

    return (
      <Modal open={open} onClose={toggleDisplayNameModal}>
        <Modal.Header>Change Display Name</Modal.Header>
        <Modal.Content>
          <Form error={!!error}>
            <Form.Input
              label="New Display Name"
              name="newDisplayName"
              value={newDisplayName}
              onChange={this.handleChange}
              placeholder="Enter new display name"
              autoComplete="off"
            />
            {error && <Message error content={error} />}
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={toggleDisplayNameModal}>Cancel</Button>
          <Button
            positive
            loading={loading}
            onClick={this.handleSubmit}
            content="Update Display Name"
          />
        </Modal.Actions>
      </Modal>
    );
  }
}

module.exports = DisplayNameChangeModal; 