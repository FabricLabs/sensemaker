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
  Segment,
  Icon,
  Step,
  Input,
  StepTitle,
  StepGroup,
  StepDescription,
  StepContent,
  Button,
  TextArea,
  Modal,
  Form,
  Placeholder,
  PlaceholderLine,
  PlaceholderParagraph,
  Popup,
  Message
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
      outlineLoading: false,
      editMode: false,
      editSection: 0,
      editSectionTitle: '',
      hoverSection: -1,
      creatingSection: false,
      modalOpen: false,
      editDocument: false,
      editDocumentTitle: '',
      creationError: false
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
    const { documents } = this.props;
    if (prevProps.id !== this.props.id) {
      this.props.fetchDocument(this.props.id);
    }

    if (prevProps.documents !== documents) {
      if (!documents.creating) {
        if (documents.creationSuccess) {
          if (this.state.outlineLoading) {
            this.setState({ outlineLoading: false, creationError: false });
            this.props.fetchDocumentSections(documents.document.fabric_id);
            this.setState({ stepInfo: false, stepReview: true });
            console.log("actual document: ", documents.document);
          }
          if (this.state.creatingSection) {
            this.setState({ editMode: true, creatingSection: false });
          }
        } else {
          this.setState({ outlineLoading: false, creationError: true });
        }
      }

      if (prevProps.documents.sections !== documents.sections) {
        console.log("actual document sections: ", documents.sections);
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

  createSection = (newSectionNumber) => {
    const { document } = this.props.documents;
    this.props.createDocumentSection(document.fabric_id, newSectionNumber, 'New Section');
    this.setState({ creatingSection: true, editSection: newSectionNumber })
  }

  handleSectionEdit = () => {
    const { document } = this.props.documents;
    const { editSection, editSectionTitle } = this.state;
    this.props.editDocumentSection(document.fabric_id, editSection, editSectionTitle);
    this.setState({ editMode: false, editSection: 0, editSectionTitle: '' });
  }

  formatContent(content) {
    return content.split('\n').map((line, index) => (
      <p key={index} style={{ marginBottom: '0' }}>{line}</p>
    ));
  }

  handleMouseEnter = (sectionNumber) => {//this has to be transformed to get an index
    this.setState({ hoverSection: sectionNumber });
  };

  handleMouseLeave = () => {
    this.setState({ hoverSection: -1 });
  };


  renderConfirmModal = () => {
    return (
      <Modal
        size='mini'
        open={this.state.modalOpen}
        onClose={this.cancelDelete}
      >
        <Modal.Header>Delete Section</Modal.Header>
        <Modal.Content>
          <p>Are you sure you want to delete this section?</p>
        </Modal.Content>
        <Modal.Actions>
          <Button.Group widths={2}>
            <Button secondary onClick={this.cancelDelete}>Cancel</Button>
            <Button negative onClick={this.confirmDelete}>Delete</Button>
          </Button.Group>
        </Modal.Actions>
      </Modal>
    )
  }

  cancelDelete = () => {
    this.setState({ modalOpen: false, editSection: 0 });
  }

  confirmDelete = () => {
    const { document } = this.props.documents;
    const { editSection } = this.state;
    this.props.deleteDocumentSection(document.fabric_id, editSection);
    this.setState({ modalOpen: false, editSection: 0 });
  }

  createDocumentDraft = () => {
    const { documents } = this.props;
    //
    //we will do some magic here
    //
    this.props.navigateToDocument(documents.document.fabric_id);
  }

  handleTitleEdit = () => {
    const { document } = this.props.documents;
    const { editDocumentTitle } = this.state;

    this.props.editDocument(document.fabric_id, editDocumentTitle);
    this.setState({ editMode: false, editDocument: false, editDocumentTitle: '' })
    console.log(this.state.editDocumentTitle);
  }

  render() {
    const { documents } = this.props;
    const {
      stepType,
      stepInfo,
      stepReview,
      documentType,
      content,
      outlineLoading,
      editMode,
      editSection,
      hoverSection,
      editDocument,
      creationError
    } = this.state;

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
              <StepDescription>Provide context</StepDescription>
            </StepContent>
          </Step>

          <Step active={stepReview}>
            <Icon name='edit outline' />
            <StepContent>
              <StepTitle>Preview</StepTitle>
              <StepDescription>Check the document outline</StepDescription>
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
              <Button.Group widths='2' style={{ marginTop: '1rem', width: '80%' }}>
                <Button primary icon onClick={() => this.setState({ stepInfo: false, stepType: true })}><Icon name='chevron left' /> Back</Button>
                <Button color='green' onClick={() => { this.props.createDocument(documentType, content); this.setState({ outlineLoading: true }) }} icon loading={outlineLoading} disabled={!content}>Draft Outline <Icon name='chevron right' /></Button>
              </Button.Group>
              {creationError && (
                <Message negative>
                  <Message.Header>Error creating document outline</Message.Header>
                  <p>There was an error during the creation of the document outline, please try again.</p>
                </Message>
              )}
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
              <Segment style={{ width: '50%', height: '55vh', margin: '0', maxWidth: '400px' }} disabled={outlineLoading}>
                <Header as='h2' textAlign='center'>Context</Header>
                <Header as='h4' onClick={() => this.setState({ stepReview: false, stepInfo: false, stepType: true })} title='click to edit' style={{ cursor: 'pointer' }}>Document Type: {documentType}</Header>
                <div onClick={() => this.setState({ stepReview: false, stepInfo: true, stepType: false })} title='click to edit' style={{ cursor: 'pointer' }}>
                  {this.formatContent(content)}
                </div>
              </Segment>
              <Button.Group vertical>
                <Button color='green' icon style={{ display: 'flex', alignItems: 'center', height: '50px' }} disabled={outlineLoading} onClick={() => this.createDocumentDraft()}>Draft Document<Icon name='chevron right' /></Button>
                <Button primary icon onClick={() => this.setState({ stepInfo: true, stepReview: false })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '50px' }} disabled={outlineLoading}><Icon name='chevron left' /> Back</Button>
              </Button.Group>
              <Segment style={{ width: '50%', height: '55vh', margin: '0', maxWidth: '400px' }}>
                <section onMouseEnter={() => this.handleMouseEnter(0)} onMouseLeave={this.handleMouseLeave} style={{ marginBottom: '1em' }}>
                  {(editMode && editDocument) ? (
                    <div className='drafter-section-title'>
                      <Input
                        name='editDocumentTitle'
                        focus
                        onChange={this.handleInputChange}
                        defaultValue={documents.document.title}
                        style={{ width: '100%', marginRight: '1em' }}
                      />
                      <Button.Group>
                        <Button icon color='green' size='small' onClick={this.handleTitleEdit}>
                          <Icon name='check' />
                        </Button>
                        <Button icon color='grey' size='small' onClick={() => this.setState({ editMode: false, editDocument: false, editDocumentTitle: '' })}>
                          <Icon name='close' />
                        </Button>
                      </Button.Group>
                    </div>
                  )
                    : (
                      <>
                        <div className='drafter-section-title'>
                          <Header as='h2' textAlign='center' style={{ marginBottom: 0, width: '100%' }}>{documents.document.title}</Header>
                          {!editMode &&
                            <Icon
                              name='pencil'
                              title='Edit document title'
                              className='edit-icon'
                              onClick={() => this.setState({ editMode: true, editDocument: true })}
                              style={{ position: 'absolute', right: '1em' }}
                            />
                          }
                        </div>
                        {hoverSection === 0 && !editMode &&
                          <div className='col-center' style={{ margin: '0.5em 0' }}>
                            <Popup
                              content="Add a new Section here"
                              trigger={
                                <Button icon basic size='mini' className='new-section-btn' onClick={() => this.createSection(1)}>
                                  <Icon name='plus' style={{ cursor: 'pointer' }} />
                                </Button>
                              }
                            />
                          </div>
                        }
                      </>
                    )
                  }

                </section>
                {documents && documents.sections && documents.sections.length > 0 &&
                  documents.sections.map((instance) =>
                    <section
                      onMouseEnter={() => this.handleMouseEnter(instance.section_number)}
                      onMouseLeave={this.handleMouseLeave}
                    >
                      {(editMode && editSection === instance.section_number) ?
                        (
                          <div className='drafter-section-title'>
                            <Input
                              name='editSectionTitle'
                              focus
                              onChange={this.handleInputChange}
                              defaultValue={instance.title}
                              style={{ width: '100%', marginRight: '1em' }}
                            />
                            <Button.Group>
                              <Button icon color='green' size='small' onClick={this.handleSectionEdit}>
                                <Icon name='check' />
                              </Button>
                              <Button icon color='grey' size='small' onClick={() => this.setState({ editMode: false, editSection: 0, editSectionTitle: '' })}>
                                <Icon name='close' />
                              </Button>
                            </Button.Group>
                          </div>
                        ) : (
                          <div className='drafter-section-title'>
                            <Header as='h3' style={{ margin: '0' }}>{instance.title}</Header>
                            {!editMode &&
                              <div style={{ display: 'flex', gap: '0.5em' }}>
                                <Icon name='pencil' title='Edit section title' className='edit-icon' onClick={() => this.setState({ editMode: true, editSection: instance.section_number })} />
                                <Icon name='trash alternate' title='Delete section' className='edit-icon' onClick={() => this.setState({ modalOpen: true, editSection: instance.section_number })} />
                              </div>
                            }
                          </div>
                        )}
                      <Placeholder>
                        <PlaceholderParagraph>
                          <PlaceholderLine />
                          <PlaceholderLine />
                          <PlaceholderLine />
                        </PlaceholderParagraph>
                      </Placeholder>
                      {(hoverSection === instance.section_number && !editMode) &&
                        <div className='col-center' style={{ margin: '0.5em 0' }}>
                          <Popup
                            content="Add a new Section here"
                            trigger={
                              <Button icon basic size='mini' className='new-section-btn' onClick={() => this.createSection(instance.section_number + 1)}>
                                <Icon name='plus' style={{ cursor: 'pointer' }} />
                              </Button>
                            }
                          />
                        </div>
                      }
                    </section>
                  )
                }
              </Segment>
            </div>
            <div className='col-center' style={{ width: '100%' }}>
            </div>
          </section>
        )}
        {this.renderConfirmModal()}
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
  return <DocumentDrafter id={id} navigateToDocument={navigateToDocument} {...props} />;
}

module.exports = View;