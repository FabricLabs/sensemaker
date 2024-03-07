'use strict';

const React = require('react');

class Contracts extends React.Component {
  constructor (props) {
    super(props);
  }

  toHTML () {
    // TODO: implement this.applicationString
  }

  render () {
    return (
      <div>
        <h1>Contracts</h1>
        <h2>Your Contracts</h2>
        <table>
          <tr>
            <td>
              <span>Terms of Use</span>
            </td>
          </tr>
          <tr>
            <td>
              <span>0.9</span>
            </td>
          </tr>
          <tr>
            <td>
              <span>signed</span>
            </td>
          </tr>
        </table>
      </div>
    );
  }
}

module.exports = Contracts;
