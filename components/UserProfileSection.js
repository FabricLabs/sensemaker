'use strict';

const {
  ENABLE_BITCOIN,
  BRAND_NAME
} = require('../constants');

const React = require('react');
const { Link } = require('react-router-dom');
const { Icon, Label, Popup, Button } = require('semantic-ui-react');
const ProfileEditModal = require('./ProfileEditModal');
const DonateToHostModal = require('./DonateToHostModal');

class UserProfileSection extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      isPopupOpen: false,
      isProfileModalOpen: false,
      donateModalOpen: false
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
    const { isPopupOpen, isProfileModalOpen, donateModalOpen } = this.state;
    const token = auth && auth.token;
    const bitcoinPopup = (
      <div style={{ padding: '1em', maxWidth: '22rem' }}>
        <p style={{ marginBottom: '0.75em', fontSize: '0.92em', lineHeight: 1.45 }}>
          One <strong>host node</strong> ({BRAND_NAME}). Balance applies to this instance.
        </p>
        <div style={{ marginBottom: '1em' }}>
          <strong>Bitcoin Balance:</strong> {bitcoinBalance || '0.00'} BTC
        </div>
        <Button
          as={Link}
          to="/services/bitcoin"
          color="green"
          fluid
          size="small"
          onClick={this.handlePopupClose}
        >
          <Icon name="bitcoin" />
          Deposit Bitcoin
        </Button>
        <Button
          color="orange"
          fluid
          size="small"
          style={{ marginTop: '0.5em' }}
          onClick={() => {
            this.handlePopupClose();
            this.setState({ donateModalOpen: true });
          }}
        >
          <Icon name="heart" />
          Donate (playnet)
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
              <Label color='black' size='small' style={{ cursor: 'pointer', display: 'flex', alignSelf: 'flex-start' }}>
                <Icon name='bitcoin' />
                {bitcoinBalance || '0.00'} BTC
              </Label>
            }
          />
        </div>}
        <DonateToHostModal
          open={donateModalOpen}
          onClose={() => this.setState({ donateModalOpen: false })}
          token={token}
          onSuccess={() => {
            if (typeof this.props.fetchBitcoinStats === 'function') {
              this.props.fetchBitcoinStats().catch(() => {});
            }
          }}
        />
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
