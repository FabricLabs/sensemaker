'use strict';

const React = require('react');
const {
  Button,
  Header,
  Image,
  List,
  Loader,
  Message,
  Segment
} = require('semantic-ui-react');

/**
 * Consent screen for `GET /oauth/authorize`. Asks the server to validate the
 * query string, then posts the user's decision and follows the redirect back
 * to the Application.
 */
class OAuthConsent extends React.Component {
  constructor (props) {
    super(props);
    this.state = { loading: true, deciding: false, request: null, error: null };
  }

  get token () {
    return this.props.token || (this.props.auth && this.props.auth.token);
  }

  headers () {
    const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    return headers;
  }

  async componentDidMount () {
    try {
      const response = await fetch(`/oauth/authorize${window.location.search}`, { headers: this.headers() });
      const result = await response.json();
      if (result.redirect) return window.location.assign(result.redirect);
      if (!response.ok) throw new Error(result.error_description || result.error || 'This authorization request is invalid.');
      this.setState({ loading: false, request: result });
    } catch (err) {
      this.setState({ loading: false, error: err.message || String(err) });
    }
  }

  decide = async (decision) => {
    this.setState({ deciding: true, error: null });
    try {
      const response = await fetch('/oauth/authorize', {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ consent_token: this.state.request.consent_token, decision })
      });
      const result = await response.json();
      if (!response.ok || !result.redirect) throw new Error(result.error_description || result.error || 'Could not complete the request.');
      window.location.assign(result.redirect);
    } catch (err) {
      this.setState({ deciding: false, error: err.message || String(err) });
    }
  };

  render () {
    const { loading, deciding, request, error } = this.state;
    if (loading) return <Loader active inline='centered' />;

    return (
      <div className='fade-in' style={{ maxWidth: '36em', margin: '2em auto' }}>
        {error && <Message negative header='Authorization failed' content={error} />}
        {request && (
          <Segment>
            <Header as='h2'>
              {request.application.icon_url && <Image src={request.application.icon_url} size='mini' />}
              <Header.Content>
                {request.application.name}
                <Header.Subheader>wants to use your Sensemaker account</Header.Subheader>
              </Header.Content>
            </Header>
            {request.application.description && <p>{request.application.description}</p>}
            {request.application.homepage_url && (
              <p><a href={request.application.homepage_url} target='_blank' rel='noopener noreferrer'>{request.application.homepage_url}</a></p>
            )}
            <Header as='h4'>It will be able to:</Header>
            <List bulleted>
              {request.scopes.map((scope) => <List.Item key={scope.name}>{scope.description}</List.Item>)}
            </List>
            <p style={{ color: 'grey' }}>You'll be sent back to <code>{request.redirect_uri}</code>. You can revoke access any time under Applications.</p>
            <Button primary loading={deciding} disabled={deciding} onClick={() => this.decide('approve')}>Allow</Button>
            <Button disabled={deciding} onClick={() => this.decide('deny')}>Deny</Button>
          </Segment>
        )}
      </div>
    );
  }
}

module.exports = OAuthConsent;
