'use strict';

const React = require('react');

class Changelog extends React.Component {
  constructor (...settings) {
    super(settings);
  }

  render () {
    return (
      <div className="changelog">
        <h1>Changelog</h1>
        <ul>
          <li>1.0.0-RC1: Exclusive access!</li>
        </ul>
      </div>
    );
  }
}

module.exports = Changelog;
