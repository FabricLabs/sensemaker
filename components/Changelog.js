'use strict';

const React = require('react');

class Changelog extends React.Component {
  constructor (...settings) {
    super(settings);
  }

  render () {
    return (
      <div className="changelog">
        <h1>News</h1>
        {/* TODO: put list of announcements here */}
        <h2>Releases</h2>
        <ul>
          <li>1.0.0-RC1: Exclusive access!</li>
        </ul>
      </div>
    );
  }
}

module.exports = Changelog;
