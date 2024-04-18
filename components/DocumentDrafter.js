'use strict';

// Dependencies
const fetch = require('cross-fetch');
const marked = require('marked');
const React = require('react');

const {
  Link,
  useParams,
  useNavigate
} = require('react-router-dom');

const {
  Dropdown,
  Header,
  Label,
  Segment,
  CardDescription,
  CardContent,
  Card,
  Icon,
  Button
} = require('semantic-ui-react');

// Constants
const DOCUMENT_TYPES = [
  { key: 'contract', text: 'Contract', value: 'contract' },
  { key: 'proposal', text: 'Proposal', value: 'proposal' },
  { key: 'letter', text: 'Letter', value: 'letter' }
];

/**
 * Document Drafting interface.
 */
class DocumentDrafter extends React.Component {
  createDocument (...params) {
    console.debug('CREATE DOCUMENT:', params);
    fetch('/documents', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.props.token}`,
        'Content-Type': 'application/json'
      },
      // TODO: add more fields
      body: JSON.stringify({ type: 'letter' })
    }).then((response) => {
      console.debug('RESPONSE:', response);
      return response.json();
    }).then((document) => {
      console.debug('DOCUMENT:', document);
      this.props.typeSelected(document.fabric_id);
    });
  }

  componentDidMount () {
    const { id } = this.props;
    this.props.fetchDocument(id);
  }

  componentDidUpdate (prevProps) {
    if (prevProps.id !== this.props.id) {
      this.props.fetchDocument(this.props.id);
    }
  }

  handleDocumentTypeChange (event, data) {
    console.debug('GOT TYPE CHANGE:', event, data);
    fetch('/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.props.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type: data.value })
    }).then((response) => {
      console.debug('RESPONSE:', response);
      return response.json();
    });
  }

  render () {
    const { documents } = this.props;

    return (
      <Segment className='col-center' style={{ height: '97vh' }} loading={documents.loading}>
        <Header as='h1'>Document Drafter</Header>
        <div>
          <Header as='h2'>Type</Header>
          <p>What kind of document would you like to draft?</p>
          <Dropdown value='letter' search selection closeOnChange onChange={this.handleDocumentTypeChange.bind(this)} options={DOCUMENT_TYPES} />
          <Button color='green' icon='right chevron' iconPosition='right' onClick={this.createDocument.bind(this)}>Start Drafting</Button>
        </div>
      </Segment>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

function View (props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const navigateToDocument = (id) => navigate(`/documents/${id}`);
  return <DocumentDrafter id={id} typeSelected={navigateToDocument} {...props} />;
}

module.exports = View;
