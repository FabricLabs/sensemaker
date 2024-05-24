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
  Form,
  Placeholder,
  PlaceholderLine,
  PlaceholderHeader,
  PlaceholderParagraph,
} = require('semantic-ui-react');

// Constants
const DOCUMENT_TYPES = [
  { key: 'contract', text: 'Contract', value: 'Contract' },
  { key: 'proposal', text: 'Proposal', value: 'Proposal' },
  { key: 'letter', text: 'Letter', value: 'Letter' }
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
      stepReview: false,
      documentType: null,
      content: null,
      draftLoading: false,
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
    const {documents} = this.props;
    if (prevProps.id !== this.props.id) {
      this.props.fetchDocument(this.props.id);
    }

    if(prevProps.documents !== documents){
      if(this.state.draftLoading && !documents.creating && documents.creationSuccess){
        this.setState({draftLoading: false});
        this.props.typeSelected(document.results.fabric_id);
      }
    }
  }

  handleDocumentTypeChange(event, data) {
    console.debug('GOT TYPE CHANGE:', data.value);
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

  formatContent(content) {
    return content.split('\n').map((line, index) => (
      <p key={index} style={{ marginBottom: '0' }}>{line}</p>
    ));
  }

  render() {
    const { documents } = this.props;
    const { stepType, stepInfo, stepReview, documentType, content, draftLoading } = this.state;

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

          <Step active={stepReview}>
            <Icon name='edit outline' />
            <StepContent>
              <StepTitle>Review</StepTitle>
              <StepDescription>Check your information</StepDescription>
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
              value={documentType}
              fluid
            />
            <Button color='green' disabled={!documentType} style={{ marginTop: '1rem' }} fluid onClick={() => this.setState({ stepType: false, stepInfo: true })}>Next <Icon name='chevron right' /></Button>
          </section>
        )}
        {stepInfo && (
          <section style={{ marginTop: '1rem' }} className='col-center'>
            <div>
              <Header as='h2'>Information</Header>
              <p>Enter any information you can give us about the document you want to draft.</p>
              <p>Provided information will help Novo to draft a better document for you</p>
            </div>
            <Form style={{ width: '100%', marginTop: '1rem' }}>
              <TextArea value={content} name='content' placeholder='Tell us your ideas' rows={10} onChange={this.handleInputChange} />
            </Form>
            <div className='col-center' style={{ width: '100%' }}>
              <Button.Group style={{ marginTop: '1rem', width: '80%' }}>
                <Button primary icon onClick={() => this.setState({ stepInfo: false, stepType: true })}><Icon name='chevron left' /> Back</Button>
                <Button color='green' icon onClick={() => this.setState({ stepInfo: false, stepReview: true })} disabled={!content}>Next <Icon name='chevron right' /></Button>
              </Button.Group>
            </div>
          </section>
        )}
        {stepReview && (
          <section style={{ marginTop: '1rem', width: '75%' }} className='col-center'>
            <div>
              <Header as='h2' centered>Review Information</Header>
              <p>Please review the information you provided, you can edit it</p>
              <p>by clicking in the information you want to change</p>
              <p>Once You are ready press Draft Document to start.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '2em', alignItems: 'center', width: '100%', marginTop: '2em' }}>
              <Segment style={{ width: '50%', height: '45vh', margin: '0', maxWidth: '400px' }} disabled={draftLoading}>
                <Header as='h4' onClick={() => this.setState({ stepReview: false, stepInfo: false, stepType: true })} title='click to edit' style={{ cursor: 'pointer' }}>Document Type: {documentType}</Header>
                <div onClick={() => this.setState({ stepReview: false, stepInfo: true, stepType: false })} title='click to edit' style={{ cursor: 'pointer' }}>
                  {this.formatContent(content)}
                </div>
              </Segment>
              <Button.Group vertical>
                <Button color='green' icon onClick={() => {this.props.createDocument(documentType, content); this.setState({draftLoading: true})}} style={{ display: 'flex', alignItems: 'center', height: '50px' }} disabled={draftLoading}>Start Drafting! <Icon name='chevron right' /></Button>
                <Button primary icon onClick={() => this.setState({ stepInfo: true, stepReview: false })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '50px' }} disabled={draftLoading}><Icon name='chevron left' /> Back</Button>
              </Button.Group>
              <Segment style={{ width: '50%', height: '45vh', margin: '0', maxWidth: '400px' }} loading={draftLoading}>
                <Placeholder>
                  <PlaceholderHeader>
                    <PlaceholderLine />
                  </PlaceholderHeader>
                  <PlaceholderParagraph>
                    <PlaceholderLine />
                    <PlaceholderLine />
                    <PlaceholderLine />
                    <PlaceholderLine />
                  </PlaceholderParagraph>
                  <PlaceholderParagraph>
                    <PlaceholderLine />
                    <PlaceholderLine />
                    <PlaceholderLine />
                  </PlaceholderParagraph>
                  <PlaceholderParagraph>
                    <PlaceholderLine />
                    <PlaceholderLine />
                    <PlaceholderLine />
                    <PlaceholderLine />
                  </PlaceholderParagraph>
                  <PlaceholderParagraph>
                    <PlaceholderLine />
                    <PlaceholderLine />
                    <PlaceholderLine />
                  </PlaceholderParagraph>
                </Placeholder>
              </Segment>
            </div>
            <div className='col-center' style={{ width: '100%' }}>
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

module.exports = View;
