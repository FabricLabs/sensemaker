'use strict';

// Dependencies
const React = require('react');

// Semantic UI
const {
  Message,
  Icon,
  Button
} = require('semantic-ui-react');

class AlertsBar extends React.Component {
  constructor (props) {
    super(props);

    this.settings = Object.assign({
      debug: false,
      state: {
        alerts: [],
        loading: true,
        error: null,
        visible: true
      }
    }, props);

    this.state = this.settings.state;
  }

  componentDidMount () {
    this.props.fetchAlerts();
  }

  handleDismiss = (index) => {
    const alerts = [...this.state.alerts];
    alerts.splice(index, 1);
    this.setState({ alerts });
  };

  render () {
    const { alerts = [], loading, error } = this.props;

    if (loading || error || !alerts || alerts.length === 0) {
      return null;
    }

    return (
      <div style={{ marginBottom: '1em' }}>
        {alerts.map((alert, index) => (
          <Message
            key={index}
            warning
            style={{ marginBottom: '0.5em' }}
          >
            <Icon name='warning sign' />
            <Message.Content>
              <Message.Header>{alert.title || 'Alert'}</Message.Header>
              <p>{alert.message}</p>
              {alert.timestamp && (
                <small>{new Date(alert.timestamp).toLocaleString()}</small>
              )}
            </Message.Content>
            <Button
              icon
              floated='right'
              size='tiny'
              onClick={() => this.handleDismiss(index)}
            >
              <Icon name='close' />
            </Button>
          </Message>
        ))}
      </div>
    );
  }
}

module.exports = AlertsBar; 