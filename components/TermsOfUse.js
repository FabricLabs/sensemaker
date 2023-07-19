'use strict';

const React = require('react');
const marked = require('marked');

const {
  Button
} = require('semantic-ui-react');

class TermsOfUse extends React.Component {
  componentDidMount () {
    console.log('ready to retrieve contract...');
  }

  render () {
    const { contract } = this.props;

    return (
      <fabric-component>
        <fabric-contract>
          <fabric-contract-body dangerouslySetInnerHTML={{ __html: marked.parse(contract || '') }} />
          <Button color='green' disabled>I Agree</Button>
        </fabric-contract>
      </fabric-component>
    );
  }
}

module.exports = TermsOfUse;
