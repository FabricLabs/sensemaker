'use strict';

const React = require('react');

class ActivityStream extends React.Component {
  constructor (props) {
    super(props);
  }

  render () {
    const { activities } = this.props;
    return (
      <div className='activity-stream'>
        <h1>Activity Stream</h1>
        <ul>
          {activities.map((activity, index) => {
            return (
              <li key={index}>
                <strong>{activity.actor}</strong> {activity.verb} <strong>{activity.object}</strong>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}

module.exports = ActivityStream;
