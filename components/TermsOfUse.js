'use strict';

const React = require('react');
const marked = require('marked');

const {
  Button,
  Segment
} = require('semantic-ui-react');

class TermsOfUse extends React.Component {
  componentDidMount () {
    this.props.fetchContract('terms-of-use');
  }

  render () {
    const { contracts } = this.props;

    return (
      <fabric-component>
        <Segment fluid>
          <fabric-contract>
            <fabric-contract-body dangerouslySetInnerHTML={{ __html: marked.parse(contracts?.contract?.content || '') }} />
            <hr />
            <Button.Group style={{ marginTop: '1em' }}>
              <Button color='green' disabled>I Agree</Button>
            </Button.Group>
          </fabric-contract>
        </Segment>
      </fabric-component>
    );
  }
}

module.exports = TermsOfUse;
