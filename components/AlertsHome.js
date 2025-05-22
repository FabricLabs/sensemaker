'use strict';

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');

// Actions
import { fetchAlerts } from '../actions/alertActions';

// Semantic UI
const {
  Segment,
  Header,
  List,
  Icon,
  Message
} = require('semantic-ui-react');

class AlertsHome extends React.Component {
  constructor (props) {
    super(props);

    // Settings
    this.settings = Object.assign({
      debug: false,
      state: {
        alerts: [],
        loading: true,
        error: null
      }
    }, props);

    this.state = this.settings.state;

    return this;
  }

  componentDidMount () {
    this.props.fetchAlerts();
  }

  render () {
    const { alerts = [], loading, error } = this.props;

    return (
      <Segment className='fade-in' loading={loading} style={{ maxHeight: '100%', height: '97vh' }}>
        <Header as='h1'>
          <Icon name='exclamation triangle' />
          <Header.Content>
            Alerts
            <Header.Subheader>System notifications and important updates</Header.Subheader>
          </Header.Content>
        </Header>

        {error && (
          <Message negative>
            <Message.Header>Error</Message.Header>
            <p>{error}</p>
          </Message>
        )}

        {!loading && !error && (!alerts || alerts.length === 0) && (
          <Message info>
            <Message.Header>No Alerts</Message.Header>
            <p>There are no active alerts at this time.</p>
          </Message>
        )}

        {!loading && !error && alerts && alerts.length > 0 && (
          <List divided relaxed>
            {alerts.map((alert, index) => (
              <List.Item key={index}>
                <List.Icon name='warning sign' size='large' verticalAlign='middle' />
                <List.Content>
                  <List.Header>{alert.title || 'Alert'}</List.Header>
                  <List.Description>{alert.message}</List.Description>
                  {alert.timestamp && (
                    <List.Description>
                      <small>{new Date(alert.timestamp).toLocaleString()}</small>
                    </List.Description>
                  )}
                </List.Content>
              </List.Item>
            ))}
          </List>
        )}
      </Segment>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = AlertsHome;
