'use strict';

const {
  ENABLE_BITCOIN
} = require('../constants');

const React = require('react');
const { Link } = require('react-router-dom');
const {
  Icon,
  Label,
  Popup,
  Button,
  Progress
} = require('semantic-ui-react');

const ProfileEditModal = require('./ProfileEditModal');
const AlertBell = require('./AlertBell');

class TopBar extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      isPopupOpen: false,
      isProfileModalOpen: false,
      quotaMax: 30,
      quotaCurrent: 30
    };
  }

  handlePopupOpen = () => {
    this.setState({ isPopupOpen: true });
  };

  handlePopupClose = () => {
    this.setState({ isPopupOpen: false });
  };

  handleProfileClick = () => {
    this.setState({ isProfileModalOpen: true });
  };

  handleProfileModalClose = () => {
    this.setState({ isProfileModalOpen: false });
  };

  handleAlertClick = (alert) => {
    // Handle alert click - could navigate to alert details or mark as read
    console.log('Alert clicked:', alert);
  };

  render () {
    const { auth, bitcoinBalance } = this.props;
    const { isPopupOpen, isProfileModalOpen } = this.state;
    const bitcoinPopup = (
      <div style={{ padding: '1em' }}>
        <div style={{ marginBottom: '1em' }}>
          <strong>Bitcoin Balance:</strong> {bitcoinBalance || '0.00'} BTC
        </div>
        <Button
          as={Link}
          to="/services/bitcoin"
          color="green"
          fluid
          onClick={this.handlePopupClose}
        >
          <Icon name="bitcoin" />
          Deposit Bitcoin
        </Button>
      </div>
    );

    return (
      <div style={{
        display: 'flex',
        marginBottom: '1em',
        animation: 'none !important',
        justifyContent: 'flex-end',
        gap: '1em'
      }}>
        <AlertBell onAlertClick={this.handleAlertClick} />
        {/* <div style={{ width: '200px' }}>
          <Progress value={this.state.quotaCurrent} total={this.state.quotaMax} progress='ratio' />
        </div> */}
        {ENABLE_BITCOIN && <div>
          <Popup
            content="Deposit Bitcoin to pay for network resources and services. Your balance will be used for any network-related costs."
            on='hover'
            trigger={
              <Popup
                content={bitcoinPopup}
                on='click'
                open={isPopupOpen}
                onOpen={this.handlePopupOpen}
                onClose={this.handlePopupClose}
                trigger={
                  <Label color='black' style={{ cursor: 'pointer', display: 'flex', alignSelf: 'flex-start' }}>
                    <Icon name='bitcoin' />
                    {bitcoinBalance || '0.00'} BTC
                  </Label>
                }
              />
            }
          />
        </div>}
        <ProfileEditModal
          open={isProfileModalOpen}
          onClose={this.handleProfileModalClose}
          auth={auth}
        />
      </div>
    );
  }
}

module.exports = TopBar;
