const React = require('react');

const {
  Card,
  Form,
  Header,
  Image,
  Input,
  Search
} = require('semantic-ui-react');

module.exports = class JeevesQueryForm extends React.Component {
  render () {
    return (
      <jeeves-query-form className='ui card fluid'>
        <Card.Content>
          <Image src='/images/jeeves-brand.png' size='small' floated='left' />
          <div style={{ paddingTop: '5em' }}>
            <p><strong>Hello,</strong> I'm <abbr title="Yes, what about it?">JeevesAI</abbr>, your legal research companion.</p>
            <Header>How can I help you today?</Header>
            <Form size='huge'>
              <Form.Field>
                <Input fluid name='query' placeholder='Ask me anything...' />
              </Form.Field>
            </Form>
            <Search fluid />
          </div>
        </Card.Content>
      </jeeves-query-form>
    );
  }
}
