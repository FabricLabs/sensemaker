'use strict';

const React = require('react');
const {
  Button,
  Checkbox,
  Form,
  Message
} = require('semantic-ui-react');

const { SCOPES } = require('../functions/oauthScopes');

const GRANT_LABELS = {
  authorization_code: 'Authorization code (users sign in with Sensemaker)',
  refresh_token: 'Refresh tokens',
  client_credentials: 'Client credentials (bots and services acting as you)'
};

/**
 * Create / edit form for an Application. `onSubmit(fields)` returns a promise;
 * a rejection is shown as the form error.
 */
class ApplicationForm extends React.Component {
  constructor (props) {
    super(props);
    const application = props.application || {};
    this.state = {
      name: application.name || '',
      description: application.description || '',
      homepage_url: application.homepage_url || '',
      icon_url: application.icon_url || '',
      type: application.type || 'confidential',
      pubkey: application.pubkey || '',
      redirect_uris: (application.redirect_uris || []).join('\n'),
      grant_types: application.grant_types || ['authorization_code', 'refresh_token'],
      scopes: application.scopes || ['openid', 'profile'],
      saving: false,
      error: null
    };
  }

  toggle (field, value) {
    const list = this.state[field];
    this.setState({ [field]: list.includes(value) ? list.filter((v) => v !== value) : list.concat(value) });
  }

  handleSubmit = async () => {
    const editing = !!this.props.application;
    const fields = {
      name: this.state.name,
      description: this.state.description,
      homepage_url: this.state.homepage_url,
      icon_url: this.state.icon_url,
      redirect_uris: this.state.redirect_uris.split(/\s+/).filter(Boolean),
      grant_types: this.state.grant_types,
      scopes: this.state.scopes
    };
    if (!editing) fields.type = this.state.type;
    if (this.state.type === 'confidential') fields.pubkey = this.state.pubkey.trim();

    this.setState({ saving: true, error: null });
    try {
      await this.props.onSubmit(fields);
      this.setState({ saving: false });
    } catch (err) {
      this.setState({ saving: false, error: err.message || String(err) });
    }
  };

  render () {
    const editing = !!this.props.application;
    const { type, grant_types, scopes, saving, error } = this.state;
    const grantOptions = Object.keys(GRANT_LABELS).filter((g) => type === 'confidential' || g !== 'client_credentials');

    return (
      <Form onSubmit={this.handleSubmit} error={!!error} loading={saving}>
        <Form.Input label='Name' required value={this.state.name} onChange={(e, { value }) => this.setState({ name: value })} />
        <Form.TextArea label='Description' rows={2} value={this.state.description} onChange={(e, { value }) => this.setState({ description: value })} />
        <Form.Group widths='equal'>
          <Form.Input label='Homepage URL' value={this.state.homepage_url} onChange={(e, { value }) => this.setState({ homepage_url: value })} />
          <Form.Input label='Icon URL' value={this.state.icon_url} onChange={(e, { value }) => this.setState({ icon_url: value })} />
        </Form.Group>
        {!editing && (
          <Form.Group inline>
            <label>Type</label>
            <Form.Radio label='Confidential (bot, server, Fabric service)' checked={type === 'confidential'} onChange={() => this.setState({ type: 'confidential' })} />
            <Form.Radio label='Public (browser or native app, PKCE only)' checked={type === 'public'} onChange={() => this.setState({ type: 'public', grant_types: grant_types.filter((g) => g !== 'client_credentials') })} />
          </Form.Group>
        )}
        {type === 'confidential' && (
          <Form.Input
            label='Fabric public key'
            required
            placeholder='02… or 03… (33-byte compressed secp256k1, hex)'
            value={this.state.pubkey}
            onChange={(e, { value }) => this.setState({ pubkey: value })}
          />
        )}
        <Form.TextArea
          label='Redirect URIs (one per line)'
          rows={3}
          placeholder='https://example.com/callback'
          value={this.state.redirect_uris}
          onChange={(e, { value }) => this.setState({ redirect_uris: value })}
        />
        <Form.Field>
          <label>Grant types</label>
          {grantOptions.map((grant) => (
            <Form.Field key={grant}>
              <Checkbox label={GRANT_LABELS[grant]} checked={grant_types.includes(grant)} onChange={() => this.toggle('grant_types', grant)} />
            </Form.Field>
          ))}
        </Form.Field>
        <Form.Field>
          <label>Scopes this application may request</label>
          {Object.entries(SCOPES).map(([name, scope]) => (
            <Form.Field key={name}>
              <Checkbox label={`${name} — ${scope.description}`} checked={scopes.includes(name)} onChange={() => this.toggle('scopes', name)} />
            </Form.Field>
          ))}
        </Form.Field>
        <Message error content={error} />
        <Button primary type='submit' disabled={saving}>{editing ? 'Save' : 'Create Application'}</Button>
        {this.props.onCancel && <Button type='button' onClick={this.props.onCancel}>Cancel</Button>}
      </Form>
    );
  }
}

module.exports = ApplicationForm;
