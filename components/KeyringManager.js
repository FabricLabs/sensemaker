'use strict';

const React = require('react');
const {
  Button,
  Form,
  Header,
  Icon,
  Modal,
  Segment,
  Table,
  Message
} = require('semantic-ui-react');

const Key = require('@fabric/core/types/key');
const crypto = require('crypto');
const bip39 = require('bip39');
const { wordlists, mnemonicToSeedSync, generateMnemonic } = require('bip39');
const { ec: EC } = require('elliptic');
const { bech32m } = require('bech32');
const { BIP32Factory, TinySecp256k1Interface } = require('bip32');
const ecc = require('@bitcoinerlab/secp256k1');

// Create BIP32 instance with the correct ECC library
const bip32 = BIP32Factory(ecc);

class KeyringManager extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      phase: 'initial', // initial, create, import, setup, locked, unlocked
      passphrase: '',
      keys: [],
      showAddKeyModal: false,
      newKeyName: '',
      newKeyType: 'bitcoin',
      existingKey: '',
      error: null,
      mnemonic: '',
      showMnemonic: false
    };
  }

  componentDidMount () {
    // Check if we have a stored keyring
    const storedKeyring = localStorage.getItem('keyring');
    if (storedKeyring) {
      this.setState({ phase: 'locked' });
    }
  }

  handleCreateNew = async () => {
    try {
      // Generate a new mnemonic
      const mnemonic = bip39.generateMnemonic();

      this.setState({
        phase: 'create',
        mnemonic,
        showMnemonic: true
      });
    } catch (error) {
      console.error('Error creating new key:', error);
      this.setState({ error: error.message });
    }
  };

  handleImportExisting = () => {
    this.setState({ phase: 'import' });
  };

  handleSetupComplete = async () => {
    if (this.state.passphrase) {
      try {
        // Generate seed from mnemonic
        const seed = await bip39.mnemonicToSeed(this.state.mnemonic);

        // Create master key using BIP32
        const masterKey = bip32.fromSeed(seed);

        // Derive the first account key
        const accountKey = masterKey.derivePath("m/44'/0'/0'");

        // Create a new key object
        const newKey = {
          id: Date.now(),
          name: this.state.newKeyName || 'Default Key',
          type: this.state.newKeyType,
          xpub: accountKey.neutered().toBase58(),
          xprv: accountKey.toBase58(),
          createdAt: new Date().toISOString()
        };

        // Store the keyring data
        const keyringData = {
          keys: [newKey],
          passphraseHash: crypto.createHash('sha256').update(this.state.passphrase).digest('hex')
        };

        localStorage.setItem('keyring', JSON.stringify(keyringData));

        this.setState({
          phase: 'locked',
          keys: [newKey],
          mnemonic: '',
          showMnemonic: false
        });
      } catch (error) {
        console.error('Error completing setup:', error);
        this.setState({ error: error.message });
      }
    }
  };

  handleUnlock = () => {
    try {
      const storedKeyring = JSON.parse(localStorage.getItem('keyring'));
      if (storedKeyring && crypto.createHash('sha256').update(this.state.passphrase).digest('hex') === storedKeyring.passphraseHash) {
        this.setState({
          phase: 'unlocked',
          keys: storedKeyring.keys
        });
      } else {
        this.setState({ error: 'Invalid passphrase' });
      }
    } catch (error) {
      console.error('Error unlocking keyring:', error);
      this.setState({ error: error.message });
    }
  };

  handleLock = () => {
    this.setState({ 
      phase: 'locked',
      passphrase: '',
      keys: [] // Clear keys from memory
    });
  };

  handleImportKey = async () => {
    try {
      const importedKey = new Key({ seed: this.state.existingKey });
      const newKey = {
        id: Date.now(),
        name: this.state.newKeyName || 'Imported Key',
        type: this.state.newKeyType,
        xpub: importedKey.xpub,
        xprv: importedKey.xprv,
        createdAt: new Date().toISOString()
      };

      // Store the keyring data
      const keyringData = {
        keys: [newKey],
        passphraseHash: crypto.createHash('sha256').update(this.state.passphrase).digest('hex')
      };
      localStorage.setItem('keyring', JSON.stringify(keyringData));

      this.setState({ 
        phase: 'locked',
        keys: [newKey],
        existingKey: ''
      });
    } catch (error) {
      console.error('Error importing key:', error);
      this.setState({ error: error.message });
    }
  };

  render () {
    const { phase, passphrase, keys, showAddKeyModal, newKeyName, newKeyType, existingKey, error, mnemonic, showMnemonic } = this.state;

    return (
      <Modal open={this.props.open} onClose={this.props.onClose}>
        <Modal.Header>
          <Icon name="key" />
          Key Management
        </Modal.Header>
        <Modal.Content>
          {error && (
            <Message negative>
              <Message.Header>Error</Message.Header>
              <p>{error}</p>
            </Message>
          )}

          {phase === 'initial' && (
            <Segment>
              <Button.Group fluid vertical>
                <Button color='green' onClick={this.handleCreateNew}>Create New Key</Button>
                <Button color='blue' onClick={this.handleImportExisting}>Import Existing Key</Button>
              </Button.Group>
            </Segment>
          )}

          {phase === 'create' && (
            <Segment>
              <Form>
                <Form.Input
                  label="Key Name"
                  placeholder="Enter key name"
                  value={newKeyName}
                  onChange={(e) => this.setState({ newKeyName: e.target.value })}
                />
                <Form.Input
                  label="Passphrase"
                  type="password"
                  placeholder="Enter passphrase"
                  value={passphrase}
                  onChange={(e) => this.setState({ passphrase: e.target.value })}
                />
                {showMnemonic && (
                  <Message warning>
                    <Message.Header>Important: Save Your Mnemonic</Message.Header>
                    <p>Please write down these words in order and keep them safe:</p>
                    <code>{mnemonic}</code>
                  </Message>
                )}
                <Button primary onClick={this.handleSetupComplete}>Complete Setup</Button>
              </Form>
            </Segment>
          )}

          {phase === 'import' && (
            <Segment>
              <Form>
                <Form.Input
                  label="Key Name"
                  placeholder="Enter key name"
                  value={newKeyName}
                  onChange={(e) => this.setState({ newKeyName: e.target.value })}
                />
                <Form.Input
                  label="Existing Key"
                  placeholder="Enter existing key"
                  value={existingKey}
                  onChange={(e) => this.setState({ existingKey: e.target.value })}
                />
                <Form.Input
                  label="Passphrase"
                  type="password"
                  placeholder="Enter passphrase"
                  value={passphrase}
                  onChange={(e) => this.setState({ passphrase: e.target.value })}
                />
                <Button primary onClick={this.handleImportKey}>Import Key</Button>
              </Form>
            </Segment>
          )}

          {phase === 'locked' && (
            <Segment>
              <Form>
                <Form.Input
                  type="password"
                  placeholder="Enter passphrase"
                  value={passphrase}
                  onChange={(e) => this.setState({ passphrase: e.target.value })}
                />
                <Button primary onClick={this.handleUnlock}>Unlock</Button>
              </Form>
            </Segment>
          )}

          {phase === 'unlocked' && (
            <Segment>
              <Button.Group>
                <Button onClick={this.handleLock}>Lock</Button>
              </Button.Group>

              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Name</Table.HeaderCell>
                    <Table.HeaderCell>Type</Table.HeaderCell>
                    <Table.HeaderCell>Public Key</Table.HeaderCell>
                    <Table.HeaderCell>Created</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {keys.map((key) => (
                    <Table.Row key={key.id}>
                      <Table.Cell>{key.name}</Table.Cell>
                      <Table.Cell>{key.type}</Table.Cell>
                      <Table.Cell>{key.xpub}</Table.Cell>
                      <Table.Cell>{new Date(key.createdAt).toLocaleString()}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </Segment>
          )}
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={this.props.onClose}>Close</Button>
        </Modal.Actions>
      </Modal>
    );
  }
}

module.exports = KeyringManager;
