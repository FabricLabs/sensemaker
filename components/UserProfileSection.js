'use strict';

const {
  ENABLE_BITCOIN
} = require('../constants');

const React = require('react');
const { Link } = require('react-router-dom');
const { Icon, Label, Popup, Button } = require('semantic-ui-react');
const ProfileEditModal = require('./ProfileEditModal');

class UserProfileSection extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      isPopupOpen: false,
      isProfileModalOpen: false
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
        padding: '0 0 1em 0',
        marginBottom: '1em',
        animation: 'none !important'
      }}>
        {ENABLE_BITCOIN && <div>
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

module.exports = UserProfileSection; 
