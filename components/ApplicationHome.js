'use strict';

const React = require('react');
const { Link, useNavigate } = require('react-router-dom');
const {
  Button,
  Header,
  Icon,
  Label,
  Message,
  Modal,
  Segment,
  Table
} = require('semantic-ui-react');

const ApplicationForm = require('./ApplicationForm');
const truncateMiddle = require('../functions/truncateMiddle');

class ApplicationList extends React.Component {
  constructor (props) {
    super(props);
    this.state = { modalOpen: false, revokeError: null };
  }

  componentDidMount () {
    this.props.fetchApplications();
    this.props.fetchAuthorizedApplications();
  }

  handleCreate = async (fields) => {
    const application = await this.props.createApplication(fields);
    this.setState({ modalOpen: false });
    this.props.navigate(`/applications/${application.id}`);
  };

  handleRevoke = async (application) => {
    this.setState({ revokeError: null });
    try {
      await this.props.revokeApplicationAuthorization(application.client_id);
    } catch (err) {
      this.setState({ revokeError: err.message || String(err) });
    }
  };

  render () {
    const state = this.props.applications || {};
    const applications = state.applications || [];
    const authorized = state.authorized || [];

    return (
      <div className='fade-in'>
        <Segment loading={state.loading}>
          <Header as='h1' style={{ marginTop: 0 }}><Icon name='plug' />Applications</Header>
          <p>Applications sign people in with Sensemaker and call its API: Discord bots, Fabric services, and other apps built on Sensemaker.</p>
          <p>Bots and servers are <strong>confidential</strong>: they prove who they are by signing with a Fabric key, so there is no shared secret to leak. Browser and mobile apps are <strong>public</strong> and use PKCE.</p>
        </Segment>

        <Header as='h2'>
          Your Applications
          <Button floated='right' primary onClick={() => this.setState({ modalOpen: true })}><Icon name='plus' /> Register Application</Button>
        </Header>
        {state.error && <Message negative content={state.error} />}
        <Table celled>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>client_id</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {applications.length ? applications.map((application) => (
              <Table.Row key={application.id}>
                <Table.Cell><Link to={`/applications/${application.id}`}>{application.name}</Link></Table.Cell>
                <Table.Cell>{application.type}</Table.Cell>
                <Table.Cell><code>{truncateMiddle(application.client_id, 24)}</code></Table.Cell>
                <Table.Cell><Label color={application.status === 'active' ? 'green' : 'grey'}>{application.status}</Label></Table.Cell>
              </Table.Row>
            )) : (
              <Table.Row><Table.Cell colSpan={4}>You haven't registered any applications yet.</Table.Cell></Table.Row>
            )}
          </Table.Body>
        </Table>

        <Header as='h2' id='authorized'>Connected Applications</Header>
        <p>Applications you have allowed to use your account. Revoking one signs it out everywhere.</p>
        {this.state.revokeError && <Message negative content={this.state.revokeError} />}
        <Table celled>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Application</Table.HeaderCell>
              <Table.HeaderCell>Access</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {authorized.length ? authorized.map((row) => (
              <Table.Row key={row.application.id}>
                <Table.Cell>
                  {row.application.homepage_url ? <a href={row.application.homepage_url} target='_blank' rel='noopener noreferrer'>{row.application.name}</a> : row.application.name}
                </Table.Cell>
                <Table.Cell>{row.scopes.map((scope) => <Label key={scope} size='small'>{scope}</Label>)}</Table.Cell>
                <Table.Cell collapsing><Button negative size='small' onClick={() => this.handleRevoke(row.application)}>Revoke</Button></Table.Cell>
              </Table.Row>
            )) : (
              <Table.Row><Table.Cell colSpan={3}>No applications have access to your account.</Table.Cell></Table.Row>
            )}
          </Table.Body>
        </Table>

        <Modal open={this.state.modalOpen} onClose={() => this.setState({ modalOpen: false })}>
          <Modal.Header>Register Application</Modal.Header>
          <Modal.Content>
            <ApplicationForm onSubmit={this.handleCreate} onCancel={() => this.setState({ modalOpen: false })} />
          </Modal.Content>
        </Modal>
      </div>
    );
  }
}

function ApplicationHome (props) {
  const navigate = useNavigate();
  return <ApplicationList {...props} navigate={navigate} />;
}

module.exports = ApplicationHome;
