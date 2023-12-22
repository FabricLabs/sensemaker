'use strict';

// Dependencies
const React = require('react');
const {
    useParams
  } = require('react-router-dom');

// Semantic UI
const {
  Button,
} = require('semantic-ui-react');

class ResetPasswordForm extends React.Component {
  state = {

  }

  render () {
    const { token } = useParams();

    return (
      <p>
        {token}
      </p>
    );
  }
}

function PwdReset (props) {
    const { token } = useParams();
    return <ResetPasswordForm token={token} {...props} />;
  }
module.exports = PwdReset;
