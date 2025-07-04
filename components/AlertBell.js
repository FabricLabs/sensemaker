'use strict';

// Dependencies
const React = require('react');
const { Link } = require('react-router-dom');

// Semantic UI
const {
  Button,
  Icon,
  Dropdown,
  Menu,
  Popup
} = require('semantic-ui-react');

class AlertBell extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      alerts: [],
      loading: true,
      error: null,
      triggerCount: 0
    };
  }

  componentDidMount() {
    this.fetchAlerts();
  }

  fetchAlerts = async () => {
    try {
      const response = await fetch('/alerts');
      const data = await response.json();
      this.setState({ alerts: data, loading: false });
    } catch (error) {
      this.setState({ error: error.message, loading: false });
    }
  };

  handleAlertClick = (alert) => {
    if (this.props.onAlertClick) {
      this.props.onAlertClick(alert);
    }
  };

  render () {
    const { alerts, loading } = this.state;
    const { triggers = [] } = this.props;
    const unreadCount = alerts.filter(alert => !alert.read).length;
    const trigger = (
      <div style={{ position: 'relative', cursor: 'pointer' }}>
        <Icon name="bell" {...this.props} />
        {alerts.length > 0 && (
          <Badge
            color="red"
            content={alerts.length}
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              transform: 'scale(0.8)'
            }}
          />
        )}
      </div>
    );

    return (
      <Popup
        trigger={trigger}
        flowing
        hoverable
        position="bottom right"
        style={{ padding: 0 }}
      >
        <Menu vertical style={{ maxHeight: '400px', overflowY: 'auto', minWidth: '300px' }}>
          <Menu.Item header>
            <Icon name="bell" style={{ cursor: 'pointer' }} onClick={() => this.markAllAsRead()} />
            Alerts
          </Menu.Item>
          {loading ? (
            <Menu.Item>
              <Icon name="spinner" loading />
              Loading alerts...
            </Menu.Item>
          ) : alerts.length === 0 ? (
            <Menu.Item>
              <Icon name="check circle" />
              No new alerts
            </Menu.Item>
          ) : (
            alerts.map((alert, index) => (
              <Menu.Item
                key={index}
                onClick={() => this.handleAlertClick(alert)}
                style={{
                  backgroundColor: alert.read ? 'transparent' : '#f8f9fa',
                  borderLeft: alert.read ? 'none' : '3px solid #2185d0'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: 'bold' }}>{alert.title}</div>
                  <div style={{ fontSize: '0.9em', color: '#666' }}>{alert.message}</div>
                  {alert.timestamp && (
                    <div style={{ fontSize: '0.8em', color: '#999', marginTop: '4px' }}>
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>
              </Menu.Item>
            ))
          )}
        </Menu>
      </Popup>
    );
  }
}

module.exports = AlertBell;
