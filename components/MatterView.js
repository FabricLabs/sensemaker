'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link, useParams } = require('react-router-dom');

const {
  Segment,
  Header,
  Label,
  List,
  Icon,
  Button,
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
  Confirm
} = require('semantic-ui-react');

const MatterFileModal = require('./MatterFileModal');

class MatterView extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {
      loading: false,
      attachModalOpen: false, //flag to open the attach file or note modal
      addingContext: false,
      isEditMode: false,

      // these are the field for the case that can be edited
      representingOption: '',
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
    };
  }

  componentDidMount() {
    this.props.fetchMatter(this.props.id);
    this.props.fetchMatterConversations(this.props.id);
    this.props.fetchJurisdictions();
    this.props.fetchCourts();
    this.props.fetchMatterFiles(this.props.id);
    this.props.fetchMatterNotes(this.props.id);
  }

  componentDidUpdate(prevProps) {
    const { matters, jurisdictions, courts } = this.props;

    // if (prevProps.matters !== matters) {
    //   console.log(matters);
    // }

    if (this.props.id !== prevProps.id) {
      this.props.fetchMatter(this.props.id);
      this.props.fetchMatterConversations(this.props.id);
      this.props.fetchJurisdictions();
      this.props.fetchCourts();
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
      }
      if (matters.current.court_id) {
        this.props.fetchCourt(matters.current.court_id);
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
    console.log("Note:", note, "Files:", file);
    const id = this.props.id;

    //TO DO: STORE THE FILE SOMEWHERE
    //the actual full file is in "file"

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

  render() {
    const { matters, jurisdictions, courts, matterConversations, conversations } = this.props;
    const { current } = matters;

    const jurisdictionErrorMessage = (!this.state.jurisdictionError) ? null : {
      content: 'Please select a jurisdiction',
      pointing: 'above',
    };
    return (
      <Segment
        loading={matters.loading || jurisdictions.loading || courts.loading || conversations.loading}
        style={{ maxHeight: '100%' }}>
        <section className='matter-header'>
          {this.state.isEditMode ? (
            <Grid columns={2} style={{marginTop:'-1em'}}>
              <GridRow>
                <GridColumn width={10} textAlign='center'>
                  <Input
                    name='title'
                    onChange={(e, { name, value }) => this.handleInputChange(e, { name, value })}
                    value={this.state.title}
                    fluid
                  />
                </GridColumn>
                <GridColumn width={6} style={{ display: 'flex' }}>
                  <Button secondary content='Cancel' size='medium' onClick={this.toggleEditMode} style={{ marginLeft: '1.5em' }} />
                  <Button primary content='Save' size='medium' onClick={this.saveChanges} />
                </GridColumn>
              </GridRow>
            </Grid>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Header as='h1' style={{ marginTop: '0', marginBottom: '0' }}>{current.title}</Header>
              <Popup content="Edit Matter's information" trigger={
                <Icon name='edit' size='large' color='grey' onClick={this.toggleEditMode} style={{ marginLeft: '1em', cursor: 'pointer' }} />
              } />
            </div>
          )}
        </section>
        <section className='matter-details'>
          <Grid columns={2}>
            <GridRow>
              <GridColumn width={13} textAlign='center'>
                <Header as='h2'>Details</Header>
              </GridColumn>
              <GridColumn width={3}>
                <Header as='h4'>I'm representing:</Header>
              </GridColumn>
            </GridRow>
          </Grid>
          <Grid columns={3}>
            <GridRow>
              <GridColumn width={4} style={{ display: 'flex', alignItems: 'center' }}>
                <Header as='h3'>Plaintiff</Header>
              </GridColumn>
              <GridColumn width={10}>
                {this.state.isEditMode ? (
                  <Input
                    name='plaintiff'
                    onChange={(e, { name, value }) => this.handleInputChange(e, { name, value })}
                    value={this.state.plaintiff}
                  />
                ) : (
                  <Label>
                    <Header as='h4'>{current.plaintiff}</Header>
                  </Label>
                )}
              </GridColumn>
              <GridColumn width={2} style={{ display: 'flex', alignItems: 'center' }}>
                <Checkbox
                  radio
                  name='checkboxRadioGroup'
                  checked={this.state.representingOption === 'P'}
                  disabled={!this.state.isEditMode}
                  value='P'
                  onChange={(e, data) => this.setState({ representingOption: data.value })}
                />
              </GridColumn>
            </GridRow>
            <GridRow>
              <GridColumn width={4} style={{ display: 'flex', alignItems: 'center' }}>
                <Header as='h3'>Defendant</Header>
              </GridColumn>
              <GridColumn width={10}>
                {this.state.isEditMode ? (
                  <Input
                    name='defendant'
                    onChange={(e, { name, value }) => this.handleInputChange(e, { name, value })}
                    value={this.state.defendant}
                  />
                ) : (
                  <Label>
                    <Header as='h4'>{current.defendant}</Header>
                  </Label>
                )}
              </GridColumn>
              <GridColumn width={2} style={{ display: 'flex', alignItems: 'center' }}>
                <Checkbox
                  radio
                  name='checkboxRadioGroup'
                  checked={this.state.representingOption === 'D'}
                  value='D'
                  disabled={!this.state.isEditMode}
                  onChange={(e, data) => this.setState({ representingOption: data.value })}
                />
              </GridColumn>
            </GridRow>
            <GridRow>
              <GridColumn width={4} style={{ display: 'flex', alignItems: 'center' }}>
                <Header as='h3'>Jurisdiction</Header>
              </GridColumn>
              <GridColumn width={10}>
                {this.state.isEditMode ? (
                  <Dropdown
                    placeholder='Select Jurisdiction'
                    fluid
                    search
                    selection
                    options={this.state.jurisdictionsOptions}
                    value={this.state.jurisdiction_id}
                    onChange={(e, { value }) => this.setState({ jurisdiction_id: value, jurisdictionError: false })}
                    error={jurisdictionErrorMessage}
                  />
                ) : (
                  <Label>
                    <Header as='h4'>{jurisdictions.current.name}</Header>
                  </Label>
                )}
              </GridColumn>
              <GridColumn width={2} />
            </GridRow>
            <GridRow>
              <GridColumn width={4} style={{ display: 'flex', alignItems: 'center' }}>
                <Header as='h3'>Court</Header>
              </GridColumn>
              <GridColumn width={10}>
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
                    <Header as='h4'>{(current.court_id ? courts.current.name : 'none selected')}</Header>
                  </Label>
                )}
              </GridColumn>
              <GridColumn width={2} />
            </GridRow>
            <GridRow>
              <GridColumn width={4} style={{ display: 'flex', alignItems: 'center' }}>
                <Header as='h3'>Description</Header>
              </GridColumn>
              <GridColumn width={10}>
                {this.state.isEditMode ? (
                  <Form>
                    <TextArea
                      name='description'
                      rows={6}
                      value={this.state.description}
                      onChange={(e, { name, value }) => this.handleInputChange(e, { name, value })}
                    />
                  </Form>
                ) : (
                  <Header as='h5'>{current.description}</Header>
                )}
              </GridColumn>
              <GridColumn width={2} />
            </GridRow>
          </Grid>
        </section>
        <section className='matter-details'>
          <Grid columns={2}>
            <GridRow>
              <GridColumn width={13} textAlign='center'>
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
              <GridColumn width={3} />
            </GridRow>
            {(matters && matters.matterFiles && matters.matterFiles.length > 0) &&
              <GridRow>
                <GridColumn width={4} style={{ paddingTop: '0.5em' }}>
                  <Header as='h3'>Files</Header>
                </GridColumn>
                <GridColumn width={12}>
                  <Table simple>
                    <Table.Header>
                      <Table.Row>
                        <Table.HeaderCell>File Name</Table.HeaderCell>
                        <Table.HeaderCell>Uploaded</Table.HeaderCell>
                        <Table.HeaderCell>Modified</Table.HeaderCell>
                        <Table.HeaderCell>Actions</Table.HeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {matters.matterFiles.map(instance => {
                        return (
                          <Table.Row key={instance.id}>
                            <Table.Cell>{instance.filename}</Table.Cell>
                            <Table.Cell>{new Date(instance.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })}</Table.Cell>
                            <Table.Cell>{new Date(instance.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })}</Table.Cell>
                            <Table.Cell>
                              <Icon
                                name='trash alternate'
                                className='matter-delete-file-icon'
                                onClick={() => this.setState({ confirmFileDelete: true, fileDeleting: instance.id })}
                              />
                            </Table.Cell>
                          </Table.Row>
                        )
                      })}
                    </Table.Body>
                  </Table>
                  <List loading={matters.loading}>
                    {matters.matterFiles.length > 0 && matters.matterFiles
                      .map(instance => {
                        return (
                          <div key={instance.id} className='matter-file'>
                            <List.Item style={{ marginTop: '0.5em', display: 'Flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Label>{instance.filename}</Label>
                              <Icon
                                name='trash alternate'
                                className='matter-delete-file-icon'
                                onClick={() => this.setState({ confirmFileDelete: true, fileDeleting: instance.id })}
                                style={{ marginLeft: '0.5em' }}
                              />
                            </List.Item>
                          </div>
                        )
                      })}
                  </List>
                </GridColumn>
              </GridRow>
            }
            {(matters && matters.matterNotes && matters.matterNotes.length > 0) &&
              <GridRow>
                <GridColumn width={4} style={{ paddingTop: '0.5em' }}>
                  <Header as='h3'>Aditional Notes</Header>
                </GridColumn>
                <GridColumn width={12}>
                  <List loading={matters.loading}>
                    {matters.matterNotes.map(instance => {
                      const isExpanded = this.state.expandedNoteId === instance.id;
                      // const displayArrow= isExpanded? {display: 'block'} : null;
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
                              className='matter-delete-note-icon'
                              onClick={() => this.setState({ confirmNoteDelete: true, noteDeleting: instance.id })}
                            />
                          </div>
                          <Divider style={{ marginTop: '0.3em', marginBottom: '0.3em' }} />
                        </div>
                      )
                    })}
                  </List>
                </GridColumn>
              </GridRow>
            }
            <GridRow>
              <GridColumn width={13} textAlign='center'>
                <Button
                  primary
                  content="+ Add File or Note"
                  onClick={() => this.setState({ attachModalOpen: true })}
                />
              </GridColumn>
              <GridColumn width={3} />
            </GridRow>
          </Grid>
          <Grid columns={2}>
            <GridRow>
              <GridColumn width={13} textAlign='center'>
                <Header as='h2'>Matter Conversations</Header>
              </GridColumn>
              <GridColumn width={3} />
            </GridRow>
            <GridRow>
              <GridColumn width={3} />
              <GridColumn width={13}>
                <div>
                  <List>
                    {(matterConversations && matterConversations.length > 0) && matterConversations
                      .map(instance => {
                        return (
                          <div>
                            <List.Item style={{ marginTop: '0.5em' }}>
                              {/* <Link to={'/matters/'+instance.id+'/conversations/' }> */}
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
              <GridColumn width={13} textAlign='center'>
                <Link to={'/matters/conversations/new/' + this.props.id} >
                  <Button
                    primary
                    content="Start a new conversation"
                  />
                </Link>
              </GridColumn>
              <GridColumn width={3} />
            </GridRow>
          </Grid>
          <MatterFileModal
            open={this.state.attachModalOpen}
            onClose={() => this.setState({ attachModalOpen: false })}
            onSubmit={this.handleModalSubmit}
            auth={this.props.auth}
            token={this.props.token}
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
  return <MatterView id={id} {...props} />;
}
module.exports = MattView;
