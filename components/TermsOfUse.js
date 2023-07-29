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
        <Segment fluid style={{ height: '100%' }}>
          <fabric-contract>
            <fabric-contract-body className='legal-contract' dangerouslySetInnerHTML={{ __html: marked.parse(contracts?.contract?.content || '') }} />
          </fabric-contract>
        </Segment>
      </fabric-component>
    );
  }
}

module.exports = TermsOfUse;
