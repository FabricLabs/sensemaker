'use strict';

const React = require('react');
const {
  Button,
  Form,
  Header,
  Modal,
  Segment,
  Divider
} = require('semantic-ui-react');

// Local Components
const LoginForm = require('./LoginForm');
// const Key = require('@fabric/core/types/key');

class KeyManagementModal extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      open: false,
      activeOption: null,
      error: null
    };

    return this;
  }

  handleOpen = () => this.setState({ open: true });
  handleClose = () => this.setState({
    open: false,
    activeOption: null,
    error: null
  });

  handleGenerateKey = async () => {
    this.setState({ loading: true, error: null });
    try {
      // const key = new Key();
      // TODO: Store the key securely
      this.handleClose();
      this.props.onKeyGenerated(key);
    } catch (error) {
      this.setState({ error: error.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleImportKey = async () => {
    this.setState({ loading: true, error: null });
    try {
      const key = new Key({ seed: this.state.importKey });
      // TODO: Store the key securely
      this.handleClose();
      this.props.onKeyImported(key);
    } catch (error) {
      this.setState({ error: error.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  renderOptionButtons () {
    return (
      <Button.Group fluid vertical>
        {/* <Button color='blue' onClick={() => this.setState({ activeOption: 'login' })}> I already have a login</Button> */}
        <Button color='green' onClick={() => this.setState({ activeOption: 'import' })}> I already have a key</Button>
        <Button color='purple' onClick={() => this.setState({ activeOption: 'generate' })}> Generate a new key</Button>
      </Button.Group>
    );
  }

  renderLoginForm () {
    return (
      <div>
        <LoginForm {...this.props} />
        <Button.Group fluid>
          <Button onClick={() => this.setState({ activeOption: null })}>Back</Button>
        </Button.Group>
      </div>
    );
  }

  renderImportForm () {
    return (
      <Form>
        <Form.Field>
          <label>Import Existing Key</label>
          <input placeholder='Enter your key' value={this.state.importKey} onChange={(e) => this.setState({ importKey: e.target.value })} />
        </Form.Field>
        <Button.Group fluid>
          <Button color='green' onClick={this.handleImportKey} loading={this.state.loading} disabled={!this.state.importKey}>Import Key</Button>
          <Button.Or />
          <Button onClick={() => this.setState({ activeOption: null })}>
            Back
          </Button>
        </Button.Group>
      </Form>
    );
  }

  renderGenerateForm () {
    return (
      <Form>
        <Form.Field>
          <label>Generate New Key</label>
          <p>Click the button below to generate a new key.</p>
        </Form.Field>
        <Button.Group fluid>
          <Button color='purple' onClick={this.handleGenerateKey} loading={this.state.loading}>Generate Key</Button>
          <Button.Or />
          <Button onClick={() => this.setState({ activeOption: null })}>Back</Button>
        </Button.Group>
      </Form>
    );
  }

  render () {
    const { open, activeOption, error } = this.state;

    return (
      <Modal open={open} onOpen={this.handleOpen} onClose={this.handleClose}>
        <Modal.Header>Identity</Modal.Header>
        <Modal.Content>
          <Modal.Description>
            <Header>Choose an Option</Header>
            <p>Select how you would like to proceed with identity management.</p>
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <Segment basic>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {!activeOption && this.renderOptionButtons()}
            {activeOption === 'login' && this.renderLoginForm()}
            {activeOption === 'import' && this.renderImportForm()}
            {activeOption === 'generate' && this.renderGenerateForm()}
          </Segment>
        </Modal.Actions>
      </Modal>
    );
  }
}

module.exports = KeyManagementModal;
