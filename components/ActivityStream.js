'use strict';

const React = require('react');

class ActivityStreamElement extends React.Component {
  constructor (props) {
    super(props);

    this.settings = Object.assign({
      includeHeader: true,
      activities: []
    }, props);

    this.state = {
      ...this.settings
    };

    return this;
  }

  componentDidMount () {
    console.debug('[FABRIC:STREAM]', 'Stream mounted!');
    this.props.fetchResource('/activities');
  }

  render () {
    const { activities = [] } = this.props.api?.resource || {};
    return (
      <fabric-activity-stream className='activity-stream'>
        {this.props.includeHeader && <h3>Activity Stream</h3>}
        <div>
          {activities.map((activity, index) => {
            return (
              <div key={index}>
                <strong>{activity.actor}</strong> {activity.verb} <strong>{activity.object}</strong>
              </div>
            );
          })}
        </div>
      </fabric-activity-stream>
    );
  }
}

function ActivityStream (props) {
  return <ActivityStreamElement {...props} />;
}

module.exports = ActivityStream;
