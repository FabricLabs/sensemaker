'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Button,
  Segment,
  Icon,
  Input,
  Form,
} = require('semantic-ui-react');

class DocumentUploader extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {
    };
  }

  render() {
    const { documents } = this.props;
    return (
      <Form className='documents-upload-form'>
        <Form.Field>
          <div style={{ maxWidth: '500px', gap: '0.5em', display: 'flex' }}>
            <Input type='file' name='file' />
            <Button icon='upload'>Upload</Button>
          </div>
        </Form.Field>
      </Form>
    );
  }

  toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = DocumentUploader;
