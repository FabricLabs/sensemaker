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

const DocumentUploader = require('./DocumentUploader');

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
      stepContext: false,
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
      creationError: false,
      attemptsCounter: 0,
      fileAttached: null
    };

  }
  componentDidMount() {
    const { id } = this.props;
    if (id) {
      this.props.fetchDocument(id);
    }
  }

  componentDidUpdate(prevProps) {
    const { documents } = this.props;
    const { attemptsCounter, documentType, context } = this.state;
    if (prevProps.id !== this.props.id) {
      this.props.fetchDocument(this.props.id);
    }

    if (prevProps.documents !== documents) {
      if (!documents.creating) {
        if (documents.creationSuccess) {
          if (this.state.outlineLoading) {
            this.setState({ outlineLoading: false, creationError: false });
            this.props.fetchDocumentSections(documents.document.fabric_id);
            this.setState({ stepContext: false, stepReview: true, attemptsCounter: 0 });
            // console.log("actual document: ", documents.document);
          }
          if (this.state.creatingSection) {
            this.setState({ editMode: true, creatingSection: false });
          }
        } else {
          if (attemptsCounter < 5) {
            console.log('[SENSEMAKER] Failed to create document outline, attempt: ', attemptsCounter, ' Trying again');
            this.createOutline(documentType, context);
          } else {
            console.log('[SENSEMAKER] Failed to create document outline, attempt: ', attemptsCounter, ' Start the process again');
            this.setState({ outlineLoading: false, creationError: true, attemptsCounter: 0 });
          }
        }
      }

      // if (prevProps.documents.sections !== documents.sections) {
      //   console.log("actual document sections: ", documents.sections);
      // }
    }
  }

  createOutline = (type, context) => {
    this.props.createDocument(type, context);
    this.setState((prevState) => ({
      outlineLoading: true,
      attemptsCounter: prevState.attemptsCounter + 1
    }));
  }

  handleDocumentTypeChange(event, data) {
    console.debug('DOCUMENT TYPE:', data.value);
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
    this.setState({ creatingSection: true, editSection: newSectionNumber, editSectionTitle: 'New Section' })
  }

  handleSectionEdit = () => {
    const { document } = this.props.documents;
    const { editSection, editSectionTitle } = this.state;
    this.props.editDocumentSection(document.fabric_id, editSection, editSectionTitle);
    this.setState({ editMode: false, editSection: 0, editSectionTitle: '' });
  }

  handleMouseEnter = (sectionNumber) => {
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
      stepContext,
      stepReview,
      documentType,
      context,
      outlineLoading,
      editMode,
      editSection,
      hoverSection,
      editDocument,
      creationError,
      attemptsCounter
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

          <Step active={stepContext}>
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
            <Header as='h2' textAlign='center'>Type</Header>
            <p style={{ textAlign: 'center' }}>What kind of document would you like to draft?</p>
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
            <Button color='green' size='big' disabled={!documentType} style={{ marginTop: '2em' }} fluid onClick={() => this.setState({ stepType: false, stepContext: true, attemptsCounter: 0 })}>Next <Icon name='chevron right' /></Button>
          </section>
        )}
        {stepContext && (
          <section style={{ marginTop: '1rem', width: '50%' }} className='col-center'>
            <div>
              <Header as='h2' textAlign='center'>Describe Your Document</Header>
              <p style={{ textAlign: 'center' }}>Tell Novo about your document.</p>
              <p style={{ textAlign: 'center' }}>Type: <b>{documentType}</b></p>
            </div>
            <Form style={{ width: '100%', marginTop: '1rem' }}>
              <TextArea value={context} name='context' placeholder='Tell us your ideas' rows={10} onChange={this.handleInputChange} />
            </Form>

            {/* <DocumentUploader drafterSection={true} files={this.props.files} uploadFile={this.props.uploadFile} resetChat={this.props.resetChat} fetchDocuments={this.props.fetchDocuments}/> */}

            <div className='col-center' style={{ width: '100%', marginTop: '2em' }}>
              <Button.Group size='big' widths='2' style={{ maxWidth: '400px' }}>
                <Button primary icon onClick={() => this.setState({ stepContext: false, stepType: true, attemptsCounter: 0 })} disabled={outlineLoading}><Icon name='chevron left' /> Back</Button>
                <Button color='green' onClick={() => this.createOutline(documentType, context)} icon loading={outlineLoading} disabled={!context}>Draft Outline <Icon name='chevron right' /></Button>
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
          <section style={{ marginTop: '1rem', width: '80%' }} className='col-center'>
            <div style={{ width: '100%' }}>
              <Header as='h2' textAlign='center'>Proposed Outline</Header>
              <p style={{ textAlign: 'center' }}>Review the following outline to ensure its accuracy.  Feel free to modify, delete or add new sections before proceeding to the next phase.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '4em', alignItems: 'center', width: '100%', marginTop: '2em' }}>
              <Segment style={{ width: '50%', height: '55vh', margin: '0' }} disabled={outlineLoading}>
                <Header as='h2' textAlign='center'>Context</Header>
                <Header as='h4' onClick={() => this.setState({ stepReview: false, stepContext: false, stepType: true })} title='click to edit' style={{ cursor: 'pointer' }}>Document Type: {documentType}</Header>
                <div onClick={() => this.setState({ stepReview: false, stepContext: true, stepType: false })} title='click to edit' style={{ cursor: 'pointer' }}>
                  {context}
                </div>
              </Segment>
              <Segment style={{ width: '50%', height: '55vh', margin: '0' }}>
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
                        <div className='drafter-section-title' style={{ display: 'flex', justifyContent: 'center' }}>
                          <Header as='h2' textAlign='center' style={{ marginBottom: 0 }}>{documents.document.title}</Header>
                          {!editMode &&
                            <Icon
                              name='pencil'
                              title='Edit document title'
                              className='edit-icon-title'
                              onClick={() => this.setState({ editMode: true, editDocument: true, editDocumentTitle: documents.document.title })}
                            />
                          }
                        </div>
                        <div
                          className='col-center'
                          style={{ margin: '0.5em 0', visibility: hoverSection === 0 && !editMode ? 'visible' : 'hidden' }}
                        >
                          <Popup
                            content="Add a new Section here"
                            trigger={
                              <Button icon basic size='mini' className='new-section-btn' onClick={() => this.createSection(1)} style={{ width: '100%' }}>
                                <Icon name='plus' />
                              </Button>
                            }
                          />
                        </div>
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
                              <div style={{ display: 'flex' }}>
                                <Icon name='pencil' title='Edit section title' className='edit-icon' onClick={() => this.setState({ editMode: true, editSection: instance.section_number, editSectionTitle: instance.title })} />
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
                      <div
                        className='col-center'
                        style={{ margin: '0.5em 0', visibility: (hoverSection === instance.section_number && !editMode) ? 'visible' : 'hidden' }}
                      >
                        <Popup
                          content="Add a new Section here"
                          trigger={
                            <Button icon basic size='mini' className='new-section-btn' onClick={() => this.createSection(instance.section_number + 1)} style={{ width: '100%' }}>
                              <Icon name='plus' />
                            </Button>
                          }
                        />
                      </div>
                    </section>
                  )
                }
              </Segment>
            </div>
            <div className='col-center' style={{ marginTop: '2em', width: '100%' }}>
              <Button.Group size='big' widths='2' style={{ maxWidth: '400px' }}>
                <Button primary icon onClick={() => this.setState({ stepContext: true, stepReview: false, attemptsCounter: 0 })} disabled={outlineLoading}><Icon name='chevron left' /> Back</Button>
                <Button color='green' icon disabled={outlineLoading} onClick={() => this.createDocumentDraft()}>Draft Document<Icon name='chevron right' /></Button>
              </Button.Group>
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
