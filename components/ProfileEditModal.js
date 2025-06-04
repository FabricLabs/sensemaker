'use strict';

const React = require('react');
const {
  Button,
  Form,
  Header,
  Icon,
  Modal,
  Message,
  Image
} = require('semantic-ui-react');
const crypto = require('crypto');

class ProfileEditModal extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      displayName: props.auth?.displayName || '',
      biography: props.auth?.biography || '',
      avatar: props.auth?.avatar || '',
      isSubmitting: false,
      error: null,
      success: false,
      blobs: {}, // Store file contents by hash
      names: {} // Map filenames to blob hashes
    };
  }

  handleInputChange = (e, { name, value }) => {
    this.setState({ [name]: value });
  };

  handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const fileContent = reader.result;
        // Compute SHA-256 hash of the file content
        const hash = crypto.createHash('sha256').update(fileContent).digest('hex');

        // Store the file content and update the mapping
        this.setState(prevState => ({
          blobs: {
            ...prevState.blobs,
            [hash]: fileContent
          },
          names: {
            ...prevState.names,
            [file.name]: hash
          },
          avatar: fileContent // Keep the avatar URL for display
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    this.setState({ isSubmitting: true, error: null });

    try {
      // TODO: Implement the API call to update profile
      // await this.props.updateProfile({
      //   displayName: this.state.displayName,
      //   biography: this.state.biography,
      //   avatar: this.state.avatar
      // });
      
      this.setState({ success: true });
      setTimeout(() => {
        this.props.onClose();
      }, 1500);
    } catch (error) {
      this.setState({ error: error.message });
    } finally {
      this.setState({ isSubmitting: false });
    }
  };

  render () {
    const { open, onClose } = this.props;
    const { displayName, biography, avatar, isSubmitting, error, success } = this.state;

    return (
      <Modal
        open={open}
        onClose={onClose}
        size="small"
      >
        <Modal.Header>Edit Profile</Modal.Header>
        <Modal.Content>
          <Form onSubmit={this.handleSubmit}>
            <Form.Field>
              <label>Avatar</label>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1em' }}>
                <Image
                  src={avatar || '/default-avatar.png'}
                  size="small"
                  circular
                  style={{ marginRight: '1em' }}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={this.handleAvatarChange}
                  style={{ display: 'none' }}
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload">
                  <Button as="span" icon labelPosition="left">
                    <Icon name="upload" />
                    Upload New Avatar
                  </Button>
                </label>
              </div>
            </Form.Field>
            
            <Form.Input
              label="Display Name"
              name="displayName"
              value={displayName}
              onChange={this.handleInputChange}
              placeholder="Enter your display name"
            />

            <Form.TextArea
              label="Biography"
              name="biography"
              value={biography}
              onChange={this.handleInputChange}
              placeholder="Tell us about yourself"
            />

            {error && (
              <Message negative>
                <Message.Header>Error</Message.Header>
                <p>{error}</p>
              </Message>
            )}

            {success && (
              <Message positive>
                <Message.Header>Success</Message.Header>
                <p>Profile updated successfully!</p>
              </Message>
            )}

            <Modal.Actions>
              <Button onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                primary
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Save Changes
              </Button>
            </Modal.Actions>
          </Form>
        </Modal.Content>
      </Modal>
    );
  }
}

module.exports = ProfileEditModal; 