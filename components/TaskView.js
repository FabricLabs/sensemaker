'use strict';

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link, useParams } = require('react-router-dom');

// Semantic UI
const {
  Breadcrumb,
  Button,
  Divider,
  Form,
  Segment,
  Header,
  Icon,
  Input
} = require('semantic-ui-react');

// Local Components
// const GeneratedResponse = require('./GeneratedResponse');

// Functions
const toRelativeTime = require('../functions/toRelativeTime');

class TaskPage extends React.Component {
  constructor (settings = {}) {
    super(settings);

    this.state = {
      loading: false,
      isEditingDescription: false,
      editedDescription: '',
      isEditingTitle: false,
      editedTitle: '',
      isTitleHovered: false,
      isDescriptionHovered: false
    };

    this.handleDescriptionEdit = this.handleDescriptionEdit.bind(this);
    this.toggleDescriptionEdit = this.toggleDescriptionEdit.bind(this);
    this.saveDescription = this.saveDescription.bind(this);
    this.handleTitleEdit = this.handleTitleEdit.bind(this);
    this.saveTitle = this.saveTitle.bind(this);
    this.toggleTitleEdit = this.toggleTitleEdit.bind(this);
    this.handleTitleHover = this.handleTitleHover.bind(this);
    this.handleDescriptionHover = this.handleDescriptionHover.bind(this);

    return this;
  }

  componentDidMount () {
    console.debug('[SENSEMAKER:TASK]', 'TaskPage mounted!');
    this.props.fetchResource();
  }

  handleDescriptionEdit (e) {
    this.setState({ editedDescription: e.target.value });
  }

  toggleDescriptionEdit () {
    this.setState(prevState => ({
      isEditingDescription: !prevState.isEditingDescription,
      editedDescription: !prevState.isEditingDescription ? this.props.api?.resource?.description : prevState.editedDescription
    }));
  }

  async saveDescription () {
    this.setState({ loading: true });
    await this.props.updateTask(this.props.api.resource.id, { description: this.state.editedDescription });
    await this.props.fetchResource();
    this.setState({ isEditingDescription: false, loading: false });
  }

  handleTitleEdit (e) {
    this.setState({ editedTitle: e.currentTarget.textContent });
  }

  async saveTitle (e) {
    if (e.key === 'Enter' || e.type === 'blur') {
      e.preventDefault();
      this.setState({ loading: true });
      await this.props.updateTask(this.props.api.resource.id, { title: this.state.editedTitle });
      await this.props.fetchResource();
      this.setState({ isEditingTitle: false, loading: false });
    } else if (e.key === 'Escape') {
      this.setState({
        isEditingTitle: false,
        editedTitle: this.props.api?.resource?.title || ''
      });
    }
  }

  toggleTitleEdit () {
    this.setState(prevState => ({
      isEditingTitle: !prevState.isEditingTitle,
      editedTitle: !prevState.isEditingTitle ? this.props.api?.resource?.title || '' : prevState.editedTitle
    }));
  }

  handleTitleHover (isHovered) {
    this.setState({ isTitleHovered: isHovered });
  }

  handleDescriptionHover (isHovered) {
    this.setState({ isDescriptionHovered: isHovered });
  }

  render () {
    const { api } = this.props;
    return (
      <div className='fade-in'>
        <div className='uppercase'>
          <Button onClick={() => { history.back(); }} icon color='black'><Icon name='left chevron' /> Back</Button>
          <Breadcrumb style={{ marginLeft: '1em' }}>
            <Breadcrumb.Section><Link to='/tasks'>Tasks</Link></Breadcrumb.Section>
            <Breadcrumb.Divider icon='right chevron' />
            <Breadcrumb.Section active>{api?.resource?.title || 'Loading...'}</Breadcrumb.Section>
          </Breadcrumb>
        </div>
        <Segment loading={api?.resource?.loading} style={{ maxHeight: '100%' }}>
          <Header as='h1'>
            {this.state.isEditingTitle ? (
              <div
                contentEditable
                suppressContentEditableWarning
                onInput={this.handleTitleEdit}
                onKeyDown={this.saveTitle}
                onBlur={this.saveTitle}
                style={{
                  border: '1px solid #ccc',
                  padding: '0.5em',
                  borderRadius: '4px',
                  minHeight: '1.5em',
                  outline: 'none',
                  fontSize: '1.5em',
                  fontWeight: 'bold'
                }}
              >
                {this.state.editedTitle}
              </div>
            ) : (
              <div
                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                onMouseEnter={() => this.handleTitleHover(true)}
                onMouseLeave={() => this.handleTitleHover(false)}
                onClick={this.toggleTitleEdit}
              >
                <span>{api?.resource?.title}</span>
                {this.state.isTitleHovered && (
                  <Icon
                    name='pencil'
                    style={{
                      marginLeft: '0.5em',
                      opacity: 0.6,
                      fontSize: '0.7em'
                    }}
                  />
                )}
              </div>
            )}
          </Header>
          {(api?.resource?.created_at) ? <p>Created <abbr title={api?.resource?.created_at}>{toRelativeTime(api?.resource?.created_at)}</abbr></p> : null}
          {(api?.resource?.due_date) ? <p>Due <abbr title={api?.resource?.due_date}>{toRelativeTime(api?.resource?.due_date)}</abbr></p> : null}
          <Divider />
          {this.state.isEditingDescription ? null : (
            <div style={{ float: 'right', opacity: this.state.isDescriptionHovered ? 1 : 0, transition: 'opacity 0.2s' }}>
              <Button onClick={this.toggleDescriptionEdit}><Icon name='edit' /></Button>
            </div>
          )}
          <Header as='h2'>Description</Header>
          {this.state.isEditingDescription ? (
            <Form>
              <Form.TextArea
                value={this.state.editedDescription}
                onChange={this.handleDescriptionEdit}
                style={{ marginBottom: '1em' }}
              />
              <Button.Group>
                <Button onClick={this.toggleDescriptionEdit}>Cancel</Button>
                <Button.Or />
                <Button positive onClick={this.saveDescription}>Save</Button>
              </Button.Group>
            </Form>
          ) : (
            <div
              onMouseEnter={() => this.handleDescriptionHover(true)}
              onMouseLeave={() => this.handleDescriptionHover(false)}
            >
              <p>{api?.resource?.description}</p>
            </div>
          )}
          {/* <Divider />
          <Header as='h2'>Notes</Header>
          <Form>
            <Form.TextArea placeholder='Add a note...' />
            <Button primary>Save</Button>
          </Form> */}
          <Divider />
          {/*
          <Header as='h2'>Recommendation</Header>
          <GeneratedResponse
            request={{
              query: 'Suggest next steps for completing the task.  Respond directly to the user.',
              messages: [{ role: 'user', content: `The task to complete: ${JSON.stringify(api?.resource || {})}` }]
            }}
            context={{ task: api?.resource }}
            placeholder={'Let\'s start with...'}
            {...this.props}
          />
          */}
        </Segment>
      </div>
    );
  }

  _toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }

  toHTML () {
    return this._toHTML();
  }
}

function TaskView (props) {
  const { id } = useParams();
  return <TaskPage {...props} id={id} />;
}

module.exports = TaskView;
