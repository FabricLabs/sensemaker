  'use strict';

  // Constants
  const {
    BROWSER_DATABASE_NAME,
    BROWSER_DATABASE_TOKEN_TABLE
  } = require('../constants');

  // Dependencies
  const React = require('react');
  const { renderToString } = require('react-dom/server');
  const {
    BrowserRouter,
    useNavigate,
    Navigate
  } = require('react-router-dom');
  const {loginSuccess} = require('../actions/authActions');

  // Components
  const Splash = require('./Splash');
  const Dashboard = require('./Dashboard');
  const TermsOfUseModal = require('./TermsOfUseModal');
  const Waitlist = require('./Waitlist');

  // Semantic UI
  const {
    Modal,
    Button,
    Header,
    Loader
   } = require('semantic-ui-react');

  /**
   * The Jeeves UI.
   */
  class JeevesUI extends React.Component {
    constructor (props) {
      super(props);

      this.state = {
        isAuthenticated: false,
        isLoading: true,
        modalLogOut: false,
        loggedOut: false,
      }
    }

    handleLoginSuccess = () => {
      console.log('setting isAuthenticated = true ...');
      this.setState({ isAuthenticated: true });
    }

    handleMessageSuccess = (result) => {
      console.log('message success! result:', result);
      this.setState({ incomingMessage: result });
    }

    handleRegisterSuccess = () => {
      console.log('registered = true ...');
      this.setState({ registered: true });
    }

    handleLogout = () => {
      this.setState({
        modalLogOut: true
      });
    }

    handleLogoutSuccess = () => {
      console.log('setting isAuthenticated = false ...');
      this.setState({ loggedOut: true });
      setTimeout(() => {
        this.setState({
          isAuthenticated: false,
          isLoading: false,
          modalLogOut: false,
          loggedOut: false
        });
        this.props.logout();
        window.location.href = '/';

        //window.location.reload();
      }, 2000)
    }

    handleModalClose = () =>{
      this.setState({
        isAuthenticated: false,
        isLoading: false,
        modalLogOut: false
      });
    }

    handleConversationSubmit = async (message) => {
      try {
        const response = await fetch('/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.props.token}`
          },
          body: JSON.stringify({ message }),
        });

        const data = await response.json();

        if (data.success) {
          this.props.fetchConversations();
        } else {
          throw new Error(data.message || 'Message submission failed');
        }
      } catch (error) {
        console.error(error);
      }
    }

    componentDidMount () {
      const dbRequest = indexedDB.open(BROWSER_DATABASE_NAME, 1);

      dbRequest.onupgradeneeded = function (event) {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(BROWSER_DATABASE_TOKEN_TABLE)) {
          const objectStore = db.createObjectStore(BROWSER_DATABASE_TOKEN_TABLE, { keyPath: 'id' });
          objectStore.createIndex("authToken", "authToken", { unique: false });
        }
      };

      dbRequest.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction([BROWSER_DATABASE_TOKEN_TABLE], 'readonly');
          const objectStore = transaction.objectStore(BROWSER_DATABASE_TOKEN_TABLE);
          const request = objectStore.get('authToken');

          request.onsuccess = (event) => {
            if (request.result) {
              this.setState({ isAuthenticated: true });
              this.props.reLogin(request.result.value);
            }
          };

          request.onerror = (event) => {
            console.error("IndexedDB error:", event.target.errorCode);
          };
      };

      dbRequest.onerror = function(event) {
        console.error("IndexedDB error:", event.target.errorCode);
      };
    }


    render() {
      const { modalLogOut, loggedOut } = this.state;
      return (
        <jeeves-ui id={this.id} class="fabric-site">
          <fabric-container id="react-application"></fabric-container>
          <fabric-react-component id='jeeves-application' style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {(this.props.auth && this.props.auth.loading) ? (
              <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Loader active inline="centered" size='huge' />
              </div>) :
              (<BrowserRouter>
                {!this.props.isAuthenticated ? (
                  <Splash
                    onLoginSuccess={this.handleLoginSuccess}
                    onRegisterSuccess={this.handleRegisterSuccess}
                    login={this.props.login}
                    register={this.props.register}
                    error={this.props.error}
                    checkInvitationToken={this.props.checkInvitationToken}
                    checkUsernameAvailable={this.props.checkUsernameAvailable}
                    checkEmailAvailable={this.props.checkEmailAvailable}
                    invitation={this.props.invitation}
                    auth={this.props.auth}
                    fullRegister={this.props.fullRegister}
                    acceptInvitation={this.props.acceptInvitation}
                    declineInvitation={this.props.declineInvitation}
                    createInquiry={this.props.createInquiry}
                    inquiries={this.props.inquiries}
                  />
                ) : !this.props.auth.isCompliant ? (
                  <TermsOfUseModal
                    {...this.props}
                    auth={this.props.auth}
                    signContract={this.props.signContract}
                    logout={this.props.logout}
                    isCompliant={this.props.isCompliant}
                  />
                ) : (
                  <Dashboard
                    auth={this.props.auth}
                    onLogoutSuccess={this.handleLogout}
                    onMessageSuccess={this.handleMessageSuccess}
                    fetchContract={this.props.fetchContract}
                    fetchConversation={this.props.fetchConversation}
                    fetchConversations={this.props.fetchConversations}
                    fetchAdminStats={this.props.fetchAdminStats}
                    handleConversationSubmit={this.handleConversationSubmit}
                    register={this.props.register}
                    resetChat={this.props.resetChat}
                    submitMessage={this.props.submitMessage}
                    contracts={this.props.contracts}
                    conversations={this.props.conversations}
                    conversation={this.props.conversation}
                    courts={this.props.courts}
                    chat={this.props.chat}
                    isAdmin={this.props.auth.isAdmin}
                    isCompliant={this.props.auth.isCompliant}
                    {...this.props}
                  />
                )}
                <Modal
                  onClose={this.handleModalClose}
                  open={modalLogOut}
                  size='mini'>
                  <Modal.Header centered>
                    Logging out
                  </Modal.Header>
                  <Modal.Content>
                    <Modal.Description>
                      {!loggedOut ? (
                        <Header as='h4'>
                          Are you sure you want to log out?
                        </Header>
                      ) : (
                        <Header as='h5' className='center aligned'>
                          You have successfully logged out. You will be redirected to the Homepage.
                        </Header>
                      )
                      }
                    </Modal.Description>
                  </Modal.Content>
                  <Modal.Actions>
                    {!loggedOut && (
                      <div>
                        <Button
                          content='Cancel'
                          icon='close'
                          onClick={this.handleModalClose}
                          labelPosition='right'
                          size='small'
                          secondary
                        />
                        <Button
                          content='Log out'
                          icon='log out'
                          onClick={this.handleLogoutSuccess}
                          labelPosition='right'
                          size='small'
                          primary
                        />
                      </div>
                    )}
                  </Modal.Actions>
                </Modal>
              </BrowserRouter>
              )}
          </fabric-react-component>
        </jeeves-ui>
      )
    }

    _getHTML () {
      const component = this.render();
      return renderToString(component);
    }
  }

  module.exports = JeevesUI;
