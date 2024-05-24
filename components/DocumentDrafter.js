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
  Step,
  StepTitle,
  StepGroup,
  StepDescription,
  StepContent,
  Button,
  TextArea,
  Form
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
  constructor(props) {
    super(props);
    this.state = {
      stepType: true,
      stepInfo: false,
      stepDraft: false,
      documentType: 'letter',
      content: null,
    };

  }
  // createDocument(...params) {
  // console.debug('CREATE DOCUMENT:', params);
  // fetch('/documents', {
  //   method: 'POST',
  //   headers: {
  //     'Accept': 'application/json',
  //     'Authorization': `Bearer ${this.props.token}`,
  //     'Content-Type': 'application/json'
  //   },
  //   // TODO: add more fields
  //   body: JSON.stringify({ type: 'letter' })
  // }).then((response) => {
  //   console.debug('RESPONSE:', response);
  //   return response.json();
  // }).then((document) => {
  //   console.debug('DOCUMENT:', document);
  //   this.props.typeSelected(document.fabric_id);
  // });
  //}

  componentDidMount() {
    const { id } = this.props;
    if (id) {
      this.props.fetchDocument(id);
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.id !== this.props.id) {
      this.props.fetchDocument(this.props.id);
    }
  }

  handleDocumentTypeChange(event, data) {
    console.debug('GOT TYPE CHANGE:', event, data);
    // fetch('/documents', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.props.token}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ type: data.value })
    // }).then((response) => {
    //   console.debug('RESPONSE:', response);
    //   return response.json();
    // });
    this.setState({ documentType: data.value })
  }


  handleInputChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value
    });
  };

  render() {
    const { documents } = this.props;
    const { stepType, stepInfo, stepDraft } = this.state;

    return (
      <Segment id='document-drafter' className='col-center' style={{ height: '97vh' }} loading={documents.loading}>
        <Header as='h1'>Document Drafter</Header>
        <StepGroup widths={3} style={{ width: '80%' }} size='small'>
          <Step active={stepType}>
            <Icon name='file alternate outline' />
            <StepContent>
              <StepTitle>Type</StepTitle>
              <StepDescription>Choose document type</StepDescription>
            </StepContent>
          </Step>

          <Step active={stepInfo}>
            <Icon name='info' />
            <StepContent>
              <StepTitle>Information</StepTitle>
              <StepDescription>Enter billing information</StepDescription>
            </StepContent>
          </Step>

          <Step active={stepDraft}>
            <Icon name='edit outline' />
            <StepContent>
              <StepTitle>Draft Document</StepTitle>
              <StepDescription>Check your document</StepDescription>
            </StepContent>
          </Step>
        </StepGroup>
        {stepType && (
          <section style={{ marginTop: '1rem' }}>
            <Header as='h2'>Type</Header>
            <p>What kind of document would you like to draft?</p>
            <Dropdown
              search
              selection
              closeOnChange
              onChange={this.handleDocumentTypeChange.bind(this)}
              options={DOCUMENT_TYPES}
              placeholder="Choose a type"
              value={this.state.documentType}
              fluid
            />
            <Button color='green' style={{ marginTop: '1rem' }} fluid onClick={() => this.setState({ stepType: false, stepInfo: true })}>Next <Icon name='chevron right' /></Button>
          </section>
        )}
        {stepInfo && (
          <section style={{ marginTop: '1rem' }}>
            <Header as='h2'>Information</Header>
            <p>Enter any information you can give us about the document you want to draft.</p>
            <p>Provided information will help Novo to draft a better document for you</p>
            <Form>
              <TextArea name='content' placeholder='Tell us your ideas' rows={10} onChange={this.handleInputChange} />
            </Form>
            <div className='col-center' style={{ width: '100%' }}>
              <Button.Group style={{ marginTop: '1rem', width: '80%' }}>
                <Button primary icon onClick={() => this.setState({ stepInfo: false, stepType: true })}><Icon name='chevron left' /> Back</Button>
                <Button color='green' icon onClick={() => this.setState({ stepInfo: false, stepDraft: true })}>Next <Icon name='chevron right' /></Button>
              </Button.Group>
            </div>
          </section>
        )}
      </Segment>
    );
  }

  toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }
}

function View(props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const navigateToDocument = (id) => navigate(`/documents/${id}`);
  return <DocumentDrafter id={id} typeSelected={navigateToDocument} {...props} />;
}

module.exports = DocumentDrafter;
