'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link, useParams, useNavigate } = require('react-router-dom');

const {
  Segment,
  Header,
  Label,
  List,
  Icon,
  Button,
  ButtonOr,
  GridRow,
  GridColumn,
  Grid,
  Checkbox,
  Popup,
  Input,
  Dropdown,
  Table,
  TextArea,
  Form,
  Divider,
  Confirm,
  Progress,
  ButtonGroup
} = require('semantic-ui-react');

const MatterFileModal = require('./MatterFileModal');
const InformationSidebar = require('./InformationSidebar');

class MatterView extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {
      loading: false,
      attachModalOpen: false, //flag to open the attach file or note modal
      addingContext: false,
      isEditMode: false,

      // these are the field for the case that can be edited
      representingOption: null,
      jurisdictionsOptions: null,
      courtsOptions: null,
      title: '',
      description: null,
      plaintiff: '',
      defendant: '',
      court_id: null,
      jurisdiction_id: null,
      jurisdictionError: false,

      expandedNoteId: null, //id of the note to expand height
      fileDeleting: null, //id of the file about to delete
      noteDeleting: null, //id of the note about to delete

      //these are the flags to ask to confirm before deleting
      confirmFileDelete: false,
      confirmNoteDelete: false,

      informationSidebarOpen: false,
      documentId: null,
      documentInfo: null,
    };
  }

  componentDidMount() {
    this.props.fetchMatter(this.props.id);
    this.props.fetchMatterConversations(this.props.id);
    this.props.fetchJurisdictions();
    // this.props.fetchCourts();
    this.props.fetchMatterFiles(this.props.id);
    this.props.fetchMatterNotes(this.props.id);
  }

  componentDidUpdate(prevProps) {
    const { matters, jurisdictions, courts, files } = this.props;

    if (this.props.id !== prevProps.id) {
      this.props.fetchMatter(this.props.id);
      this.props.fetchMatterConversations(this.props.id);
      this.props.fetchJurisdictions();
      // this.props.fetchCourts();
      this.props.fetchMatterFiles(this.props.id);
      this.props.fetchMatterNotes(this.props.id);
    }
    if (prevProps.matterConversations !== this.props.matterConversations) {
      this.forceUpdate();
    }
    if (prevProps.matters.current !== matters.current) {
      this.props.fetchMatterConversations(this.props.id);

      if (matters.current.jurisdiction_id) {
        this.props.fetchJurisdiction(matters.current.jurisdiction_id);
        this.props.fetchCourtsByJurisdiction(matters.current.jurisdiction_id);
      }
      if (matters.current.court_id) {
        this.props.fetchCourtById(matters.current.court_id);
      }
      if (!this.state.isEditMode) {
        this.setState({ representingOption: matters.current.representing });
      }
    }
    if (prevProps.matters !== matters && !matters.addingContext) {
      if (this.state.addingContext && matters.error) {
        //TO DO, HANDLING SITUATIONS
        console.log("error adding context", matters.error);
      }
      this.setState({ addingContext: false });
    }
    if (prevProps.jurisdictions !== jurisdictions) {
      if (jurisdictions.jurisdictions.length > 0) {
        const options = jurisdictions.jurisdictions.map(instance => ({
          key: instance.id,
          value: instance.id,
          text: instance.name
        }));
        options.sort((a, b) => a.text.localeCompare(b.text));
        this.setState({ jurisdictionsOptions: options });
      }
    }
    if (prevProps.courts !== courts) {
      if (courts.courts.length > 0) {
        const options = courts.courts.map(instance => ({
          key: instance.id,
          value: instance.id,
          text: instance.name
        }));
        options.sort((a, b) => a.text.localeCompare(b.text));
        options.unshift({
          key: 'none',
          value: '',
          text: 'None'
        });
        this.setState({ courtsOptions: options });
      }
    }
    if (prevProps.files !== files) {
      this.props.fetchMatterFiles(this.props.id);
    }
  };

  handleInputChange = (e, { name, value }) => {
    this.setState({ [name]: value });
  };

  toggleEditMode = () => {
    const { current } = this.props.matters;
    if (!this.state.isEditMode) {
      this.setState({
        title: current.title,
        plaintiff: current.plaintiff,
        defendant: current.defendant,
        description: current.description,
        court_id: current.court_id,
        jurisdiction_id: current.jurisdiction_id,
        representingOption: current.representing,
        description: current.description
      })
    }
    this.setState(prevState => ({ isEditMode: !prevState.isEditMode }));

  };

  handleModalSubmit = async (note, filename, file) => {
    const id = this.props.id;

    if (filename) {
      this.setState({ filename: filename });
    };
    if (note) {
      this.setState({ note: note });
    };

    this.setState({ attachModalOpen: false, addingContext: true });
    await this.props.addContext(note, filename, id, file);
    await this.props.fetchMatterFiles(this.props.id);
    await this.props.fetchMatterNotes(this.props.id);

  };

  deleteFile = async (id) => {
    await this.props.removeFile(id);
    this.setState({ confirmFileDelete: false });
    this.props.fetchMatterFiles(this.props.id);
  }

  deleteNote = async (id) => {
    await this.props.removeNote(id);
    this.setState({ confirmNoteDelete: false });
    this.props.fetchMatterNotes(this.props.id);
  }


  saveChanges = async () => {

    await this.props.editMatter(
      this.props.id,
      this.state.title,
      this.state.description,
      this.state.plaintiff,
      this.state.defendant,
      this.state.representingOption,
      this.state.jurisdiction_id,
      this.state.court_id,
    );
    await this.props.fetchMatter(this.props.id);
    this.toggleEditMode();
  }

  toggleNoteExpansion = (id) => {
    this.setState(prevState => ({
      expandedNoteId: prevState.expandedNoteId === id ? null : id // Toggle expansion
    }));
  };

  openDocument = (documentInfo) => {
    this.props.documentInfoSidebar(documentInfo, this.props.matters.current.title);
  }
  render() {
    const { matters, jurisdictions, courts, matterConversations, conversations } = this.props;
    const { current } = matters;

    const jurisdictionErrorMessage = (!this.state.jurisdictionError) ? null : {
      content: 'Please select a jurisdiction',
      pointing: 'above',
    };
    return (
      <Segment textAlign='center'
        loading={matters.loading || jurisdictions.loading || courts.loading || conversations.loading}
        style={{ maxHeight: '100%', display: 'flex', flexDirection: 'column', justifyItems: 'center', alignItems: 'center' }}>
        <section className='matter-header'>
          {this.state.isEditMode ? (
            <Grid columns={2} style={{ marginTop: '-1em' }}>
              <GridRow centered textAlign='center'>
                <GridColumn textAlign='center'>
                  <Input size='huge'
                    name='title'
                    onChange={(e, { name, value }) => this.handleInputChange(e, { name, value })}
                    value={this.state.title}
                    style={{ width: '100%' }}
                  />
                </GridColumn>
                <GridColumn textAlign='center' width={6} style={{ display: 'flex' , flexDirection:'row'}}>
                  <Button secondary content='Cancel' size='medium' onClick={this.toggleEditMode} style={{ marginLeft: '1.5em' }} />
                  <Button primary content='Save' size='medium' onClick={this.saveChanges} />
                </GridColumn>
              </GridRow>
            </Grid>
          ) : (
            <Grid columns={2} style={{ marginTop: '-1em' }}>
              <GridRow>
                <GridColumn width={5} />
                <GridColumn width={16} textAlign='center'>
                  <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
                    <Header as='h1' size='huge' style={{ marginTop: '0', marginBottom: '0' }}>{current.title}</Header>
                    <Popup content="Edit Matter's information" trigger={
                      <Icon name='edit' size='large' color='grey' onClick={this.toggleEditMode} style={{ marginLeft: '1em', cursor: 'pointer' }} />
                    } />
                  </div>
                </GridColumn>
              </GridRow>
            </Grid>
          )}
        </section>

        <section className='matter-details ' style={{width: '60vw'}}>
          <Grid centered columns={'equal'} textAlign='center' verticalAlign='middle'>
            <GridRow textAlign='center'>
              <GridColumn >
                <Header textAlign='center'  as='h2' size='huge'>Details</Header>
              </GridColumn>
              <GridColumn >
              </GridColumn>

            </GridRow>
          </Grid>

          <Grid centered columns={'equal'} textAlign='center' verticalAlign='middle'>
            <GridRow>
              <GridColumn textAlign='center'>
                <Header as='h3' size='medium'>Plaintiff</Header>
              </GridColumn>
              <GridColumn textAlign='center'>
                {this.state.isEditMode ? (
                  <Input size='medium'
                    name='plaintiff'
                    onChange={(e, { name, value }) => this.handleInputChange(e, { name, value })}
                    value={this.state.plaintiff}
                  />
                ) : (
                  <Label>
                    <Header as='h4' size='medium'>{current.plaintiff}</Header>
                  </Label>
                )}
              </GridColumn>
            </GridRow>
              
            <GridRow>
              <GridColumn textAlign='center' >
                <Header as='h3' size='medium'>Defendant</Header>
              </GridColumn>
              <GridColumn textAlign='center'>
                {this.state.isEditMode ? (
                  <Input size='medium'
                    name='defendant'
                    onChange={(e, { name, value }) => this.handleInputChange(e, { name, value })}
                    value={this.state.defendant}
                  />
                ) : (
                  <Label>
                    <Header as='h4' size='medium'>{current.defendant}</Header>
                  </Label>
                )}
              </GridColumn>
            </GridRow>
              
            <GridRow>
              <GridColumn textAlign='center'>
                <Header as='h3' size='medium'>I'm representing</Header>
              </GridColumn>
              <GridColumn textAlign='center'>
                {this.state.isEditMode ?
                  (<ButtonGroup>
                    <Button  size='medium'
                      name='checkboxRadioGroup' 
                      value='P' 
                      onClick={(e, data) => this.setState({ representingOption: data.value})} 
                      toggle active={this.state.representingOption ==='P'}
                      positive={this.state.representingOption ==='P'}
                    >
                      Plaintiff
                    </Button>
                    <ButtonOr/>
                    <Button size='medium'
                      name='checkboxRadioGroup' 
                      value='D' 
                      onClick={(e, data) => this.setState({ representingOption: data.value})} 
                      toggle active={this.state.representingOption ==='D'}
                      positive={this.state.representingOption ==='D'}
                  
                    >
                      Defendant
                    </Button>
                  </ButtonGroup>) : (this.state.representingOption === 'P' ? (
                    <Label>
                      <Header as='h4' size='medium'>Plaintiff</Header>
                    </Label>
                  ) : (
                    this.state.representingOption === 'D' ? 
                      <Label>
                        <Header as='h4' size='medium'>Defendant</Header>
                      </Label> 
                      : 
                      <Label>
                        <Header as='h4' size='medium'>Neither</Header>
                      </Label>
                  ) )
                }
              </GridColumn>
            </GridRow>
              
            <GridRow>
              <GridColumn  textAlign='center'>
                <Header as='h3' size='medium'>Jurisdiction</Header>
              </GridColumn>
              <GridColumn textAlign='center'>
                {this.state.isEditMode ? (
                  <Dropdown
                    placeholder='Select Jurisdiction'
                    fluid
                    search
                    selection
                    options={this.state.jurisdictionsOptions}
                    value={this.state.jurisdiction_id}
                    onChange={(e, { value }) => {
                      this.setState({ jurisdiction_id: value, jurisdictionError: false });
                      this.props.fetchCourtsByJurisdiction(value);
                    }}
                    error={jurisdictionErrorMessage}
                  />
                ) : (
                  <Label>
                    <Header as='h4' size='medium'>{jurisdictions.current.name}</Header>
                  </Label>
                )}
              </GridColumn>
            </GridRow>
              
            <GridRow>
              <GridColumn textAlign='center'>
                <Header as='h3' size='medium'>Court</Header>
              </GridColumn>
              <GridColumn textAlign='center'>
                {this.state.isEditMode ? (
                  <Dropdown
                    placeholder='Select Court'
                    fluid
                    search
                    selection
                    options={this.state.courtsOptions}
                    value={this.state.court_id}
                    onChange={(e, { value }) => this.setState({ court_id: value })}
                  />
                ) : (
                  <Label>
                    <Header as='h4' size='medium'>{current.court_id ? courts.current.name : 'none selected'}</Header>
                  </Label>
                )}
              </GridColumn>
            </GridRow>
              
            <GridRow>
              <GridColumn textAlign='center'>
                <Header as='h3' size='medium'>Description</Header>
              </GridColumn>
              <GridColumn textAlign='center'>
                {this.state.isEditMode ? (
                  <Form>
                    <TextArea
                      name='description'
                      style={{fontSize: '1.3em'}}
                      rows={6}
                      value={this.state.description}
                      onChange={(e, { name, value }) => this.handleInputChange(e, { name, value })}
                    />
                  </Form>
                ) : (
                  <Header as='h4' size='medium'>{current.description}</Header>
                )}
              </GridColumn>
            </GridRow>
          </Grid>
        </section>

        <section className='matter-details'>
          <Grid centered columns={'equal'} textAlign='center' verticalAlign='middle'>
            <GridRow>
              <GridColumn  textAlign='center'>
                <Header as='h2'>Context
                  <Popup trigger={<Icon name='info circle' size='small' style={{ margin: '0 0  0.2em 0.5em', color: '#336699' }} />}>
                    <Popup.Content>
                      <p>You can add one additional note or one file about this Matter
                        to enhance the information available. This will enable Novo
                        to generate more accurate and relevant answers based on the extended details provided.</p>
                    </Popup.Content>
                  </Popup>
                </Header>
              </GridColumn>
            </GridRow>
            <GridRow>
              <GridColumn textAlign='center'>
                <Button
                  primary
                  content="+ Add File or Note"
                  onClick={() => this.setState({ attachModalOpen: true })}
                />
              </GridColumn>
            </GridRow>

            <GridRow centered textAlign='center' >
              <GridColumn >
                <div className='col-center'>
                  <Header as='h2'>Files</Header>
                  <Segment style={{ maxHeight: '40vh', padding: '0', width: '70vw' }} loading={matters.addingContext}>
                    <Table textAlign='center' celled striped >
                      <Table.Header>
                        <Table.Row >
                          <Table.HeaderCell>File Name</Table.HeaderCell>
                          <Table.HeaderCell>Uploaded</Table.HeaderCell>
                          <Table.HeaderCell>Modified</Table.HeaderCell>
                          <Table.HeaderCell>Actions</Table.HeaderCell>
                          <Table.HeaderCell style={{ minWidth: '100px' }}>Status</Table.HeaderCell>
                        </Table.Row>
                      </Table.Header>
                      {(matters && matters.matterFiles && matters.matterFiles.length > 0) ? (
                        <Table.Body >
                          {matters.matterFiles.map(instance => {
                            return (
                              <Table.Row key={instance.id}>
                                <Table.Cell><Link onClick={(e) => { e.stopPropagation(); this.openDocument(instance); }}>{instance.filename}</Link></Table.Cell>
                                <Table.Cell>{new Date(instance.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })}</Table.Cell>
                                <Table.Cell>{new Date(instance.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })}</Table.Cell>
                                <Table.Cell textAlign="center">
                                  <Popup
                                    content="Delete file"
                                    trigger={
                                      <Button
                                        icon='trash alternate'
                                        size='big'
                                        onClick={() => this.setState({ confirmFileDelete: true, fileDeleting: instance.id })}
                                      />
                                    }
                                  />
                                </Table.Cell>
                                <Table.Cell textAlign="center">
                                  {/* {instance.status !== 'ingested' ? (
                                    <Popup content="Your File is being Ingested by the AI" trigger={
                                      // <Icon name='circle notch' loading size='big'/>
                                      <Progress percent={instance.status} indicating />

                                    } />
                                  ) : (
                                    <Icon name='check' color='green' size='big'/>
                                  )} */}
                                  <Popup
                                    content={
                                      instance.status === 'processing' ? 'Your file is being Uploaded' :
                                        instance.status === 'uploaded' ? 'Your file is being Ingested by the AI' :
                                          instance.status === 'ingested' ? 'Your file is ready' : 'Processing'
                                    }
                                    trigger={
                                      <Progress
                                        style={{ margin: '0' }}
                                        percent={
                                          instance.status === 'processing' ? 33 :
                                            instance.status === 'uploaded' ? 66 :
                                              instance.status === 'ingested' ? 100 : 0
                                        }
                                        indicating
                                      />
                                    }
                                  />

                                </Table.Cell>
                              </Table.Row>
                            )
                          })}
                        </Table.Body>
                      ) : (
                        <Table.Body>
                          <Table.Row>
                            <Table.Cell />
                          </Table.Row>
                        </Table.Body>
                      )
                      }
                    </Table>
                  </Segment>
                </div>
              </GridColumn>
            </GridRow>

            {(matters && matters.matterNotes && matters.matterNotes.length > 0) &&
              <GridRow textAlign='center'>
                <GridColumn >
                  <div className='col-center'>
                    <Header as='h2'>Additional Notes</Header>
                    <Segment style={{ maxHeight: '40vh', width: '60vw' }} loading={matters.addingContext}>
                      <List loading={matters.loading} size='small'>
                        {matters.matterNotes.map(instance => {
                          const isExpanded = this.state.expandedNoteId === instance.id;
                          return (
                            <div key={instance.id}
                              className='matter-note'
                              title='Click to expand'>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <List.Item
                                  className="expandable-note"
                                  style={{ marginTop: '0.5em', marginRight: '0.5em', maxHeight: isExpanded ? '300px' : '2.5em', overflow: isExpanded ? 'auto' : 'hidden' }}
                                  onClick={() => this.toggleNoteExpansion(instance.id)}
                                >
                                  <Header as='h5'>{instance.content}</Header>
                                </List.Item>
                                <Icon
                                  name='trash alternate'
                                  size='small'
                                  className='matter-delete-note-icon'
                                  onClick={() => this.setState({ confirmNoteDelete: true, noteDeleting: instance.id })}
                                />
                              </div>
                              <Divider style={{ marginTop: '0.3em', marginBottom: '0.3em' }} />
                            </div>
                          )
                        })}
                      </List>
                    </Segment>
                  </div>
                </GridColumn>
              </GridRow>
            }

          </Grid>
          <Grid centered columns={'equal'} textAlign='center' verticalAlign='middle'>
            <GridRow>
              <GridColumn  textAlign='center'>
                <Header as='h2'>Matter Conversations</Header>
              </GridColumn>
            </GridRow>
            <GridRow textAlign='center'>
              <GridColumn >
                <div>
                  <List>
                    {(matterConversations && matterConversations.length > 0) && matterConversations
                      .map(instance => {
                        return (
                          <div>
                            <List.Item style={{ marginTop: '0.5em' }}>
                              <Link to={'/conversations/' + instance.id}>
                                {new Date(instance.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })}{": "}
                                {instance.title}
                              </Link>
                            </List.Item>
                          </div>)
                      })}
                  </List>
                </div>
              </GridColumn>
            </GridRow>
            <GridRow>
              <GridColumn textAlign='center'>
                  <Button
                    primary
                    content="Start a new conversation"
                    disabled={matters.matterFiles.some(file => file.status !== 'ingested')}
                    onClick={() => this.props.navigateTo(this.props.id)}
                  />
              </GridColumn>
            </GridRow>
          </Grid>
          <MatterFileModal
            open={this.state.attachModalOpen}
            onClose={() => this.setState({ attachModalOpen: false })}
            onSubmit={this.handleModalSubmit}
            auth={this.props.auth}
            token={this.props.token}
            matterFiles={this.props.matters.matterFiles}
          />
          <Confirm
            content='Delete this file from the Matter?'
            open={this.state.confirmFileDelete}
            onCancel={() => this.setState({ confirmFileDelete: false })}
            onConfirm={() => this.deleteFile(this.state.fileDeleting)}
            cancelButton='Cancel'
            confirmButton="Confirm"
            style={{ maxWidth: '400px' }}
          />
          <Confirm
            content='Delete this note from the Matter?'
            open={this.state.confirmNoteDelete}
            onCancel={() => this.setState({ confirmNoteDelete: false })}
            onConfirm={() => this.deleteNote(this.state.noteDeleting)}
            cancelButton='Cancel'
            confirmButton="Confirm"
            style={{ maxWidth: '400px' }}
          />
        </section>
      </Segment>
    );
  }

  _toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }

  toHTML() {
    return this._toHTML();
  }
}

function MattView(props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const navigateTo = (id) => navigate(`/conversations/new/${id}`);
  return <MatterView id={id} navigateTo={navigateTo} {...props} />;
}
module.exports = MattView;
