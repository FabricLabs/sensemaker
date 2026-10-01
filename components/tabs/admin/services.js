'use strict';

const React = require('react');

const {
  HOSTED_LLM_PROVIDERS,
  DOCUMENT_RETRIEVAL_SETTING_NAME
} = require('../../../constants');

const {
  Label, Header, Table, Button, Icon, Modal, Checkbox, Message
} = require('semantic-ui-react');


class AdminServicesTab extends React.Component {
  constructor(props) {
    super(props);

    this.settings = Object.assign({
      state: {
        alias: 'SENSEMAKER',
        name: 'sensemaker',
        statistics: {
          counts: {
            waitlist: 0,
            pending: 0, // pending invitations
            users: 0,
            conversations: 0,
            messages: 0,
            documents: 0,
            deleteQueueModal: false,
          }
        },
        waitlistSignupCount: 0,
        currentPage: 1,
        windowWidth: window.innerWidth,
        hostedPool: HOSTED_LLM_PROVIDERS.reduce((acc, provider) => {
          acc[provider.settingName] = { enabled: false, loading: true, saving: false };
          return acc;
        }, {}),
        hostedPoolMessage: null,
        documentRetrievalEnabled: true,
        documentRetrievalLoading: true,
        documentRetrievalSaving: false,
        documentRetrievalMessage: null
      }
    }, props);

    this.state = this.settings.state;
  }

  componentDidMount() {
    this.props.fetchAdminStats();
    this.props.syncRedisQueue();
    this.fetchHostedPoolSettings();
    this.fetchDocumentRetrievalSetting();
    //this is not doing anything yet
    //this.props.fetchAllConversationsFromAPI();
    window.addEventListener('resize', this.handleResize);
  }

  fetchHostedPoolSettings = async () => {
    await Promise.all(HOSTED_LLM_PROVIDERS.map((provider) => {
      return this.fetchHostedPoolSetting(provider.settingName);
    }));
  };

  fetchHostedPoolSetting = async (settingName) => {
    const token = this.props.auth && this.props.auth.token;
    if (!token) {
      this.setState((prev) => ({
        hostedPool: {
          ...prev.hostedPool,
          [settingName]: { ...(prev.hostedPool[settingName] || {}), loading: false }
        }
      }));
      return;
    }
    try {
      const response = await fetch(`/settings/${settingName}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        this.setState((prev) => ({
          hostedPool: {
            ...prev.hostedPool,
            [settingName]: { enabled: false, loading: false, saving: false }
          }
        }));
        return;
      }
      const data = await response.json();
      const v = data.value;
      const enabled = v === true || v === 'true' || v === 1 || v === '1';
      this.setState((prev) => ({
        hostedPool: {
          ...prev.hostedPool,
          [settingName]: { enabled, loading: false, saving: false }
        }
      }));
    } catch (err) {
      console.error('[AdminServicesTab] Hosted LLM setting fetch failed:', settingName, err);
      this.setState((prev) => ({
        hostedPool: {
          ...prev.hostedPool,
          [settingName]: { ...(prev.hostedPool[settingName] || {}), loading: false }
        }
      }));
    }
  };

  handleHostedPoolToggle = async (settingName, checked) => {
    const token = this.props.auth && this.props.auth.token;
    if (!token) return;
    const provider = HOSTED_LLM_PROVIDERS.find((row) => row.settingName === settingName);
    this.setState((prev) => ({
      hostedPool: {
        ...prev.hostedPool,
        [settingName]: { ...(prev.hostedPool[settingName] || {}), saving: true }
      },
      hostedPoolMessage: null
    }));
    try {
      const response = await fetch(`/settings/${settingName}`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ value: !!checked })
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.message || errBody.error || `HTTP ${response.status}`);
      }
      this.setState((prev) => ({
        hostedPool: {
          ...prev.hostedPool,
          [settingName]: { enabled: !!checked, loading: false, saving: false }
        },
        hostedPoolMessage: {
          positive: true,
          content: checked
            ? `${provider ? provider.label : settingName} added after local Ollama when a key is configured.`
            : `${provider ? provider.label : settingName} removed from the LLM pool.`
        }
      }));
    } catch (err) {
      console.error('[AdminServicesTab] Hosted LLM pool save failed:', settingName, err);
      this.setState((prev) => ({
        hostedPool: {
          ...prev.hostedPool,
          [settingName]: { ...(prev.hostedPool[settingName] || {}), saving: false }
        },
        hostedPoolMessage: { negative: true, content: err.message || 'Failed to save setting.' }
      }));
    }
  };

  fetchDocumentRetrievalSetting = async () => {
    const token = this.props.auth && this.props.auth.token;
    if (!token) {
      this.setState({ documentRetrievalLoading: false });
      return;
    }
    try {
      const response = await fetch(`/settings/${DOCUMENT_RETRIEVAL_SETTING_NAME}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        this.setState({ documentRetrievalEnabled: true, documentRetrievalLoading: false });
        return;
      }
      const data = await response.json();
      const v = data.value;
      const enabled = v === true || v === 'true' || v === 1 || v === '1';
      this.setState({ documentRetrievalEnabled: enabled, documentRetrievalLoading: false });
    } catch (err) {
      console.error('[AdminServicesTab] Document retrieval setting fetch failed:', err);
      this.setState({ documentRetrievalLoading: false });
    }
  };

  handleDocumentRetrievalToggle = async (e, { checked }) => {
    const token = this.props.auth && this.props.auth.token;
    if (!token) return;
    this.setState({ documentRetrievalSaving: true, documentRetrievalMessage: null });
    try {
      const response = await fetch(`/settings/${DOCUMENT_RETRIEVAL_SETTING_NAME}`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ value: !!checked })
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.message || errBody.error || `HTTP ${response.status}`);
      }
      this.setState({
        documentRetrievalEnabled: !!checked,
        documentRetrievalSaving: false,
        documentRetrievalMessage: {
          positive: true,
          content: checked
            ? 'Document retrieval enabled. Searcher will prefetch relevant documents before responses.'
            : 'Document retrieval disabled. Responses will skip the Searcher + vector prefetch step.'
        }
      });
    } catch (err) {
      console.error('[AdminServicesTab] Document retrieval save failed:', err);
      this.setState({
        documentRetrievalSaving: false,
        documentRetrievalMessage: { negative: true, content: err.message || 'Failed to save setting.' }
      });
    }
  };

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  componentDidUpdate() {
    //console.log(this.props.redis);
  }

  handleResize = () => {
    this.setState({ windowWidth: window.innerWidth });
  };

  clearRedisQueue = async () => {
    await this.props.clearQueue();
    await this.props.syncRedisQueue();
    this.closeConfirmDeleteModal();
  }

  closeConfirmDeleteModal = () => {
    this.setState({deleteQueueModal: false});
  }

  renderConfirmModal = () => {
    return (
      <Modal
        size='mini'
        open={this.state.deleteQueueModal}
        onClose={this.closeConfirmDeleteModal}
      >
        <Modal.Header>Clear Redis queue</Modal.Header>
        <Modal.Content>
          <p>Are you sure you want to clear Redis queue? This could cause some file/documet Ingestion get lost.</p>
        </Modal.Content>
        <Modal.Actions>
          <Button secondary onClick={this.closeConfirmDeleteModal}>No</Button>
          <Button negative onClick={this.clearRedisQueue}>Yes, clear it</Button>
        </Modal.Actions>
      </Modal>
    )
  }

  render() {
    const { queue, lastJobCompleted, lastJobTaken } = this.props.redis;

    return (
      <adminServicesTab>
        <Header as='h3'>Services</Header>
        <Table celled striped>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Last Update</Table.HeaderCell>
              <Table.HeaderCell></Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>@fabric/core</Table.Cell>
              <Table.Cell><Label>started (implicit)</Label></Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>@sensemaker/core</Table.Cell>
              <Table.Cell><Label>started (implicit)</Label></Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>MySQL</Table.Cell>
              <Table.Cell><Label>unknown</Label></Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Redis</Table.Cell>
              <Table.Cell><Label>unknown</Label></Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>Ollama</Table.Cell>
              <Table.Cell><Label>unknown</Label></Table.Cell>
              <Table.Cell></Table.Cell>
              <Table.Cell></Table.Cell>
            </Table.Row>
            {HOSTED_LLM_PROVIDERS.map((provider) => {
              const row = this.state.hostedPool[provider.settingName] || {};
              const envHint = provider.tokenRequired === false
                ? (provider.envTokens[0] ? `Optional ${provider.envTokens[0]}.` : 'No API key required.')
                : `Requires ${provider.envTokens[0]}.`;
              return (
                <Table.Row key={provider.settingName}>
                  <Table.Cell>{provider.label}</Table.Cell>
                  <Table.Cell>
                    <Checkbox
                      toggle
                      disabled={
                        row.loading ||
                        row.saving ||
                        !(this.props.auth && this.props.auth.token) ||
                        !(this.props.auth && this.props.auth.isAdmin)
                      }
                      checked={!!row.enabled}
                      onChange={(e, { checked }) => this.handleHostedPoolToggle(provider.settingName, checked)}
                    />
                  </Table.Cell>
                  <Table.Cell colSpan='2'>
                    {provider.description} {envHint} Local Ollama is tried first. Admin only.
                  </Table.Cell>
                </Table.Row>
              );
            })}
            <Table.Row>
              <Table.Cell>Document retrieval (Searcher)</Table.Cell>
              <Table.Cell>
                <Checkbox
                  toggle
                  disabled={
                    this.state.documentRetrievalLoading ||
                    this.state.documentRetrievalSaving ||
                    !(this.props.auth && this.props.auth.token) ||
                    !(this.props.auth && this.props.auth.isAdmin)
                  }
                  checked={this.state.documentRetrievalEnabled}
                  onChange={this.handleDocumentRetrievalToggle}
                />
              </Table.Cell>
              <Table.Cell colSpan='2'>
                When enabled, the Searcher agent formulates a query and injects matching document summaries into the chat pipeline. Admin only.
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
        {this.state.documentRetrievalMessage && (
          <Message
            positive={this.state.documentRetrievalMessage.positive}
            negative={this.state.documentRetrievalMessage.negative}
            onDismiss={() => this.setState({ documentRetrievalMessage: null })}
            content={this.state.documentRetrievalMessage.content}
          />
        )}
        {this.state.hostedPoolMessage && (
          <Message
            positive={this.state.hostedPoolMessage.positive}
            negative={this.state.hostedPoolMessage.negative}
            onDismiss={() => this.setState({ hostedPoolMessage: null })}
            content={this.state.hostedPoolMessage.content}
          />
        )}
        <Header as='h3'>Redis
          <Button icon size='small' onClick={()=> this.setState({deleteQueueModal: true})} style={{marginLeft: '2em'}}><Icon name='trash alternate outline' /></Button>
        </Header>
        <Table celled striped>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell width={4}></Table.HeaderCell>
              <Table.HeaderCell width={2}>Jobs</Table.HeaderCell>
              <Table.HeaderCell width={2}>Params</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell><Header as='h5'>Last job Taken</Header></Table.Cell>
              <Table.Cell><Label>{lastJobTaken ? lastJobTaken.method : 'Empty'}</Label></Table.Cell>
              <Table.Cell><Label>{lastJobTaken ? lastJobTaken.params : 'Empty'}</Label></Table.Cell>
              <Table.Cell>{lastJobTaken?.status ? <Label color='blue'>{lastJobTaken.status}</Label> : ''}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell><Header as='h5'>Last job Completed</Header></Table.Cell>
              <Table.Cell><Label>{lastJobCompleted ? lastJobCompleted.method : 'Empty'}</Label></Table.Cell>
              <Table.Cell><Label>{lastJobCompleted ? lastJobCompleted.params : 'Empty'}</Label></Table.Cell>
              <Table.Cell>{lastJobCompleted?.status ?
                <Label color={lastJobCompleted.status === 'COMPLETED' ? 'green' : 'red'}>{lastJobCompleted.status}</Label> : ''}
              </Table.Cell>
            </Table.Row>
            {(queue?.length > 0) ? (
              <Table.Row>
                <Table.Cell><Header as='h5'>Queue</Header></Table.Cell>
                <Table.Cell>{queue?.map((instance) => (<div><Label style={{ margin: 'auto 0 0.3em 0' }}>{instance.method}</Label></div>))}</Table.Cell>
                <Table.Cell>{queue?.map((instance) => (<div><Label style={{ margin: 'auto 0 0.3em 0' }}>{instance.params[0]}</Label></div>))}</Table.Cell>
                <Table.Cell></Table.Cell>
              </Table.Row>
            ) : (
              <Table.Row>
                <Table.Cell><Header as='h5'>Queue</Header></Table.Cell>
                <Table.Cell><Label>Empty</Label></Table.Cell>
                <Table.Cell></Table.Cell>
                <Table.Cell></Table.Cell>
              </Table.Row>
            )
            }
          </Table.Body>
        </Table>
        {this.renderConfirmModal()}
      </adminServicesTab>
    )
  }
}

module.exports = AdminServicesTab;
