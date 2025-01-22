'use strict';

const React = require('react');

class ActivityStream extends React.Component {
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

  render () {
    const { activities } = this.props;
    return (
      <div className='activity-stream'>
        {this.props.includeHeader && <h3>Activity Stream</h3>}
        <div>
          {activities && activities.map((activity, index) => {
            return (
              <div key={index}>
                <strong>{activity.actor}</strong> {activity.verb} <strong>{activity.object}</strong>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

module.exports = ActivityStream;
