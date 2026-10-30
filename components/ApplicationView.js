'use strict';

const React = require('react');
const { Link, useParams } = require('react-router-dom');
const {
  Breadcrumb,
  Button,
  Header,
  Icon,
  Label,
  List,
  Message,
  Segment
} = require('semantic-ui-react');

const ApplicationForm = require('./ApplicationForm');

class ApplicationPage extends React.Component {
  constructor (props) {
    super(props);
    this.state = { editing: false, error: null, saved: false };
  }

  componentDidMount () {
    this.props.fetchApplication(this.props.id);
  }

  componentDidUpdate (prevProps) {
    if (prevProps.id !== this.props.id) this.props.fetchApplication(this.props.id);
  }

  handleSave = async (fields) => {
    await this.props.updateApplication(this.props.id, fields);
    this.setState({ editing: false, saved: true });
  };

  handleDisable = async () => {
    this.setState({ error: null });
    try {
      await this.props.disableApplication(this.props.id);
    } catch (err) {
      this.setState({ error: err.message || String(err) });
    }
  };

  handleEnable = async () => {
    this.setState({ error: null });
    try {
      await this.props.updateApplication(this.props.id, { status: 'active' });
    } catch (err) {
      this.setState({ error: err.message || String(err) });
    }
  };

  render () {
    const state = this.props.applications || {};
    const application = state.application;
    const matches = application && (String(application.id) === String(this.props.id) || application.client_id === this.props.id);
    const origin = window.location.origin;

    return (
      <div className='fade-in'>
        <div className='uppercase'>
          <Breadcrumb>
            <Breadcrumb.Section><Link to='/applications'>Applications</Link></Breadcrumb.Section>
            {matches && <Breadcrumb.Divider />}
            {matches && <Breadcrumb.Section active>{application.name}</Breadcrumb.Section>}
          </Breadcrumb>
        </div>
        {state.error && !matches && <Message negative content={state.error} />}
        {matches && (
          <Segment loading={state.loading}>
            <Header as='h1' style={{ marginTop: 0 }}>
              <Icon name='plug' />
              <Header.Content>
                {application.name}
                <Header.Subheader>{application.description}</Header.Subheader>
              </Header.Content>
            </Header>
            <Label color={application.status === 'active' ? 'green' : 'grey'}>{application.status}</Label>
            <Label>{application.type}</Label>
            {this.state.error && <Message negative content={this.state.error} />}
            {this.state.saved && <Message positive content='Saved.' />}

            {application.redirect_uris ? (
              <List divided relaxed>
                <List.Item><List.Header>client_id</List.Header><code>{application.client_id}</code></List.Item>
                {application.pubkey && <List.Item><List.Header>Fabric public key</List.Header><code>{application.pubkey}</code></List.Item>}
                <List.Item><List.Header>Client authentication</List.Header>{application.token_endpoint_auth_method === 'fabric_bip340'
                  ? <span>Sign a client assertion with the key above: <code>client_assertion_type=urn:fabric:params:oauth:client-assertion-type:bip340</code></span>
                  : 'None (public client, PKCE S256 required)'}</List.Item>
                <List.Item><List.Header>Redirect URIs</List.Header>{application.redirect_uris.length ? application.redirect_uris.map((uri) => <div key={uri}><code>{uri}</code></div>) : 'None'}</List.Item>
                <List.Item><List.Header>Grant types</List.Header>{application.grant_types.join(', ')}</List.Item>
                <List.Item><List.Header>Scopes</List.Header>{application.scopes.map((scope) => <Label key={scope} size='small'>{scope}</Label>)}</List.Item>
                <List.Item><List.Header>Discovery</List.Header><code>{origin}/.well-known/openid-configuration</code></List.Item>
              </List>
            ) : null}

            {application.redirect_uris && (
              <div style={{ marginTop: '1em' }}>
                <Button onClick={() => this.setState({ editing: !this.state.editing, saved: false })}><Icon name='edit' /> Edit</Button>
                {application.status === 'active'
                  ? <Button negative onClick={this.handleDisable}><Icon name='ban' /> Disable</Button>
                  : <Button positive onClick={this.handleEnable}><Icon name='check' /> Enable</Button>}
              </div>
            )}

            {this.state.editing && (
              <Segment>
                <ApplicationForm application={application} onSubmit={this.handleSave} onCancel={() => this.setState({ editing: false })} />
              </Segment>
            )}
          </Segment>
        )}
      </div>
    );
  }
}

function ApplicationView (props) {
  const { id } = useParams();
  return <ApplicationPage {...props} id={id} />;
}

module.exports = ApplicationView;
