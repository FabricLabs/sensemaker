'use strict';

const React = require('react');
const $ = require('jquery');

const {
  Card,
  Form,
  Header,
  Image,
  Input,
  Search
} = require('semantic-ui-react');

module.exports = class JeevesQueryForm extends React.Component {
  componentDidMount () {
    $('#primary-query').on('focus', () => {
      $('#query-helpers').slideDown();
    });
  }

  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value });
  }

  render () {
    return (
      <jeeves-query-form className='ui card fluid'>
        <Card.Content>
          <Image src='/images/jeeves-brand.png' size='small' floated='left' />
          <div style={{ paddingTop: '5em' }}>
            <p><strong>Hello,</strong> I'm <abbr title="Yes, what about it?">JeevesAI</abbr>, your legal research companion.</p>
            <Header>How can I help you today?</Header>
            <Form size='huge' onSubmit={this.handleSubmit}>
              <Form.Field>
                <Form.Input id="primary-query" fluid name='query' placeholder='Ask me anything...' onChange={this.handleChange} />
              </Form.Field>
            </Form>
            <div id="query-helpers" className="hidden" style={{display: 'none'}}>
              <p>You can try...</p>
              <div className="ui cards">
                <div className="ui card">
                  <div className="card content">
                    <h3>Argue for...</h3>
                  </div>
                </div>
                <div className="ui card">
                  <div className="card content">
                    <h3>What was...</h3>
                  </div>
                </div>
                <div className="ui card">
                  <div className="card content">
                    <h3>Who did...</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card.Content>
      </jeeves-query-form>
    );
  }
}
