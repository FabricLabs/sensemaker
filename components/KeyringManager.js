const React = require('react');
const {
  Button,
  Form,
  Header,
  Icon,
  Modal,
  Segment,
  Table
} = require('semantic-ui-react');

// const Key = require('@fabric/core/types/key');

class KeyringManager extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      phase: 'initial', // initial, create, import, setup, locked, unlocked
      passphrase: '',
      keys: [],
      showAddKeyModal: false,
      newKeyName: '',
      newKeyType: 'bitcoin',
      existingKey: ''
    };
  }

  componentDidMount() {
    // Check if we have a stored keyring
    const storedKeyring = localStorage.getItem('keyring');
    if (storedKeyring) {
      this.setState({ phase: 'locked' });
    }
  }

  handleCreateNew = () => {
    this.setState({ phase: 'create' });
  };

  handleImportExisting = () => {
    this.setState({ phase: 'import' });
  };

  handleSetupComplete = () => {
    if (this.state.passphrase) {
      // Store the keyring data
      const keyringData = {
        keys: this.state.keys,
        passphraseHash: this.state.passphrase // TODO: Implement proper hashing
      };
      localStorage.setItem('keyring', JSON.stringify(keyringData));
      this.setState({ phase: 'locked' });
    }
  };

  handleUnlock = () => {
    const storedKeyring = JSON.parse(localStorage.getItem('keyring'));
    if (storedKeyring && this.state.passphrase === storedKeyring.passphraseHash) {
      this.setState({ 
        phase: 'unlocked',
        keys: storedKeyring.keys
      });
    }
  };

  handleLock = () => {
    this.setState({ 
      phase: 'locked',
      passphrase: '',
      keys: [] // Clear keys from memory
    });
  };

  handleAddKey = () => {
    if (this.state.newKeyName) {
      const newKey = {
        id: Date.now(),
        name: this.state.newKeyName,
        type: this.state.newKeyType,
        createdAt: new Date().toISOString()
      };
      
      this.setState({
        keys: [...this.state.keys, newKey],
        showAddKeyModal: false,
        newKeyName: ''
      });
    }
  };

  render() {
    const { phase, passphrase, keys, showAddKeyModal, newKeyName, newKeyType, existingKey } = this.state;

    const renderContent = () => {
      switch (phase) {
        case 'initial':
          return (
            <Segment>
              <Header as='h3'>Welcome to Key Management</Header>
              <p>Choose an option to get started:</p>
              <Button.Group vertical fluid>
                <Button primary onClick={this.handleCreateNew}>
                  <Icon name='plus' /> Create New Key
                </Button>
                <Button secondary onClick={this.handleImportExisting}>
                  <Icon name='upload' /> Import Existing Key
                </Button>
              </Button.Group>
            </Segment>
          );

        case 'create':
          return (
            <Segment>
              <Header as='h3'>Create New Key</Header>
              <Form>
                <Form.Field>
                  <label>Key Name</label>
                  <input
                    value={newKeyName}
                    onChange={(e) => this.setState({ newKeyName: e.target.value })}
                    placeholder='Enter a name for this key'
                  />
                </Form.Field>
                <Form.Field>
                  <label>Key Type</label>
                  <select
                    value={newKeyType}
                    onChange={(e) => this.setState({ newKeyType: e.target.value })}
                  >
                    <option value='bitcoin'>Bitcoin</option>
                    <option value='ethereum'>Ethereum</option>
                    <option value='generic'>Generic</option>
                  </select>
                </Form.Field>
                <Button primary onClick={this.handleAddKey}>
                  Create Key
                </Button>
              </Form>
            </Segment>
          );

        case 'import':
          return (
            <Segment>
              <Header as='h3'>Import Existing Key</Header>
              <Form>
                <Form.Field>
                  <label>Key Data</label>
                  <textarea
                    value={existingKey}
                    onChange={(e) => this.setState({ existingKey: e.target.value })}
                    placeholder='Paste your key data here'
                  />
                </Form.Field>
                <Button primary onClick={() => {
                  // TODO: Implement key import
                  this.setState({ phase: 'setup' });
                }}>
                  Import Key
                </Button>
              </Form>
            </Segment>
          );

        case 'setup':
          return (
            <Segment>
              <Header as='h3'>Setup Passphrase</Header>
              <Form>
                <Form.Field>
                  <label>Passphrase</label>
                  <input
                    type='password'
                    value={passphrase}
                    onChange={(e) => this.setState({ passphrase: e.target.value })}
                    placeholder='Create a passphrase to protect your keys'
                  />
                </Form.Field>
                <Button primary onClick={this.handleSetupComplete}>
                  Complete Setup
                </Button>
              </Form>
            </Segment>
          );

        case 'locked':
          return (
            <Segment>
              <Header as='h3'>Unlock Keyring</Header>
              <Form>
                <Form.Field>
                  <label>Passphrase</label>
                  <input
                    type='password'
                    value={passphrase}
                    onChange={(e) => this.setState({ passphrase: e.target.value })}
                    placeholder='Enter passphrase to unlock'
                  />
                </Form.Field>
                <Button primary onClick={this.handleUnlock}>
                  Unlock
                </Button>
              </Form>
            </Segment>
          );

        case 'unlocked':
          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1em' }}>
                <Header as='h3'>Your Keys</Header>
                <Button.Group>
                  <Button icon color='black' onClick={this.handleLock}>
                    <Icon name='lock' /> Lock
                  </Button>
                  <Button icon color='green' onClick={() => this.setState({ showAddKeyModal: true })}>
                    <Icon name='add' /> Add Key
                  </Button>
                </Button.Group>
              </div>
              
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Name</Table.HeaderCell>
                    <Table.HeaderCell>Type</Table.HeaderCell>
                    <Table.HeaderCell>Created</Table.HeaderCell>
                    <Table.HeaderCell>Actions</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {keys.map(key => (
                    <Table.Row key={key.id}>
                      <Table.Cell>{key.name}</Table.Cell>
                      <Table.Cell>{key.type}</Table.Cell>
                      <Table.Cell>{new Date(key.createdAt).toLocaleString()}</Table.Cell>
                      <Table.Cell>
                        <Button.Group size='small'>
                          <Button icon><Icon name='pencil' /></Button>
                          <Button icon><Icon name='trash' /></Button>
                        </Button.Group>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <Modal
        open={this.props.open}
        onClose={this.props.onClose}
        size='large'
      >
        <Modal.Header>
          <Icon name='key' /> Key Management
        </Modal.Header>
        <Modal.Content>
          {renderContent()}
        </Modal.Content>

        <Modal open={showAddKeyModal} onClose={() => this.setState({ showAddKeyModal: false })}>
          <Modal.Header>Add New Key</Modal.Header>
          <Modal.Content>
            <Form>
              <Form.Field>
                <label>Key Name</label>
                <input
                  value={newKeyName}
                  onChange={(e) => this.setState({ newKeyName: e.target.value })}
                  placeholder='Enter a name for this key'
                />
              </Form.Field>
              <Form.Field>
                <label>Key Type</label>
                <select
                  value={newKeyType}
                  onChange={(e) => this.setState({ newKeyType: e.target.value })}
                >
                  <option value='bitcoin'>Bitcoin</option>
                  <option value='ethereum'>Ethereum</option>
                  <option value='generic'>Generic</option>
                </select>
              </Form.Field>
            </Form>
          </Modal.Content>
          <Modal.Actions>
            <Button negative onClick={() => this.setState({ showAddKeyModal: false })}>
              Cancel
            </Button>
            <Button positive onClick={this.handleAddKey}>
              Add Key
            </Button>
          </Modal.Actions>
        </Modal>
      </Modal>
    );
  }
}

module.exports = KeyringManager; 