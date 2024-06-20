'use strict';

const marked = require('marked');

const React = require('react');
const {
  Link,
  useParams
} = require('react-router-dom');

const {
  Header,
  Label,
  Segment,
  Icon,
  Button,
  Input,
  Modal,
  Form,
  Popup,
} = require('semantic-ui-react');

const TextareaAutosize = require('react-textarea-autosize').default;


const formatDate = require('../contracts/formatDate');

class DocumentView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      content: null,
      editMode: false,
      editSection: 0,
      editSectionTitle: '',
      editSectionContent: '',
      hoverSection: -1,
      creatingSection: false,
      modalOpen: false,
      editDocument: false,
      editDocumentTitle: '',
      creationError: false,
    };

  }


  componentDidMount() {
    const { fabricID } = this.props;
    this.props.fetchDocument(fabricID);
    this.props.fetchDocumentSections(fabricID);

  }

  componentDidUpdate(prevProps) {
    const { documents } = this.props;
    if (prevProps.fabricID !== this.props.fabricID) {
      this.props.fetchDocument(this.props.fabricID);
      this.props.fetchDocumentSections(fabricID);
    }
    if (prevProps.documents != documents) {
      console.log("[NOVO] Document:", this.props.documents.document);
      console.log("[NOVO] Sections:", this.props.documents.sections);
      if (!documents.creating) {
        if (documents.creationSuccess) {
          // == //
          if (this.state.creatingSection) {
            this.setState({ editMode: true, creatingSection: false });
          }
        }
      }
    }
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
    const { editSection, editSectionTitle, editSectionContent } = this.state;
    this.props.editDocumentSection(document.fabric_id, editSection, editSectionTitle, editSectionContent);
    this.setState({ editMode: false, editSection: 0, editSectionTitle: '', editSectionContent: '' });
  }

  formatContent(content) {
    return content.split('\n').map((line, index) => (
      <p key={index} style={{ marginBottom: '0' }}>{line}</p>
    ));
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
      editMode,
      editSection,
      hoverSection,
      editDocument,
    } = this.state;

    return (
      <Segment className='col-center' style={{ height: '97vh' }} loading={documents.loading}>
        <Segment fluid style={{ width: '100%', paddingBottom: '3em' }}>
          {documents.document.fabric_id ? (
            <section>
              <div className='document-file-header'>
                <Header as='h3' style={{ margin: 0 }}>{documents.document.title}</Header>
                <Header as="h3" style={{ margin: 0 }}><Link to={"/documents"}><Icon name='left chevron' /> Back to documents</Link></Header>
              </div>
              <Link to={'/conversations/documents/' + documents.document.fabric_id} style={{ marginBottom: '2.5em' }} onClick={() => this.props.resetChat()}>
                <Button
                  primary
                  content='Start Conversation'
                />
              </Link>
              <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '1em', marginTop: '1em' }}>
                <Label><Icon name='calendar' />Created at: {formatDate(documents.document.created_at)}</Label>
                <Label><Icon name='calendar' />Modified at: {formatDate(documents.document.created_at)}</Label>
              </div>
              {!documents.document.file_id && (
                <Segment id='document-editor' style={{ maxWidth: '800px' }}>
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
                            style={{
                              margin: '0.5em 0',
                              visibility: hoverSection === 0 && !editMode ? 'visible' : 'hidden'
                            }}
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
                            <Form>
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
                              <TextareaAutosize
                                id='section-content'
                                placeholder={instance.content ? null : 'Add content to this section'}
                                name='editSectionContent'
                                defaultValue={instance.content}
                                onChange={this.handleInputChange}
                                style={{ resize: 'none', minHeight: '100%' }}
                              />

                            </Form>
                          ) : (
                            <article>
                              <div className='drafter-section-title'>
                                <Header as='h3' style={{ margin: '0' }}>{instance.title}</Header>
                                {!editMode &&
                                  <div style={{ display: 'flex' }}>
                                    <Icon name='pencil' title='Edit section title' className='edit-icon'
                                      onClick={() => this.setState({ editMode: true, editSection: instance.section_number, editSectionContent: instance.content, editSectionTitle: instance.title })}
                                    />
                                    <Icon name='trash alternate' title='Delete section' className='edit-icon'
                                      onClick={() => this.setState({ modalOpen: true, editSection: instance.section_number })}
                                    />
                                  </div>
                                }
                              </div>
                              <div style={{ whiteSpace: 'pre-wrap' }}>{instance.content}</div>
                            </article>
                          )}
                        <div
                          className='col-center'
                          style={{
                            margin: '0.5em 0',
                            visibility: hoverSection === instance.section_number && !editMode ? 'visible' : 'hidden'
                          }}>
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
              )}
            </section>
          ) : (
            <div className='document-file-header'>
              <Header as='h3' style={{ margin: 0 }}>Document Not Found</Header>
              <Header as="h3" style={{ margin: 0 }}><Link to={"/documents"}><Icon name='left chevron' /> Back to documents</Link></Header>
            </div>
          )}
        </Segment>
        {documents.document.file_id && (
          <Segment style={{ width: '100%', height: '100%' }}>
            <iframe
              src={`${window.location.protocol}//${window.location.hostname}:${window.location.port}/files/serve/${documents.document.file_id}`}
              className='document-frame'
            ></iframe>
          </Segment>
        )}
        {this.renderConfirmModal()}
      </Segment>
    );
  }

  toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }
}

function Chat(props) {
  const { fabricID } = useParams();
  return <DocumentView fabricID={fabricID} {...props} />;
}

module.exports = Chat;
