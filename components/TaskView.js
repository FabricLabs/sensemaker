'use strict';

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link, useParams, useSearchParams } = require('react-router-dom');

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
const GeneratedResponse = require('./GeneratedResponse');
const MarkdownContent = require('./MarkdownContent');

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
      isDescriptionHovered: false,
      action: null,
      isEditingDueDate: false,
      selectedDueDate: null,
      selectedDueTime: null
    };

    this.handleDescriptionEdit = this.handleDescriptionEdit.bind(this);
    this.toggleDescriptionEdit = this.toggleDescriptionEdit.bind(this);
    this.saveDescription = this.saveDescription.bind(this);
    this.handleTitleEdit = this.handleTitleEdit.bind(this);
    this.saveTitle = this.saveTitle.bind(this);
    this.toggleTitleEdit = this.toggleTitleEdit.bind(this);
    this.handleTitleHover = this.handleTitleHover.bind(this);
    this.handleDescriptionHover = this.handleDescriptionHover.bind(this);
    this.handleDueDateSelect = this.handleDueDateSelect.bind(this);
    this.handleDueDateSubmit = this.handleDueDateSubmit.bind(this);

    return this;
  }

  componentDidMount () {
    console.debug('[SENSEMAKER:TASK]', 'TaskPage mounted!');
    this.props.fetchResource();

    // Check for action and edit parameters
    const searchParams = new URLSearchParams(window.location.search);
    const action = searchParams.get('action');
    const edit = searchParams.get('edit');

    // Set default date to tomorrow at 3 PM
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 15, 0, 0, 0);

    let dueDate;
    if (this.props.api?.resource?.due_date) {
      dueDate = new Date(this.props.api.resource.due_date);
    } else {
      dueDate = tomorrow;
    }

    this.setState({
      action,
      isEditingDueDate: edit === 'due_date',
      selectedDueDate: dueDate.toISOString().split('T')[0],
      selectedDueTime: dueDate.toLocaleTimeString('en-US', { hour12: false }).slice(0, 5)
    });
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

  async saveDescription (content) {
    this.setState({ loading: true });
    await this.props.updateTask(this.props.api.resource.id, { description: content });
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

  async handleDueDateSelect (event) {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  }

  async handleDueDateSubmit () {
    const { selectedDueDate, selectedDueTime } = this.state;

    // Create date in local timezone
    const [year, month, day] = selectedDueDate.split('-').map(Number);
    const [hours, minutes] = selectedDueTime.split(':').map(Number);
    const combinedDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

    this.setState({ loading: true });
    await this.props.updateTask(this.props.api.resource.id, { due_date: combinedDateTime });
    await this.props.fetchResource();
    this.setState({
      isEditingDueDate: false,
      loading: false,
      selectedDueDate: null,
      selectedDueTime: null
    });

    // Remove the edit parameter from URL
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.delete('edit');
    window.history.replaceState({}, '', `${window.location.pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`);
  }

  formatDate (dateStr) {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: 'numeric', minute: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', dateOptions);
    const formattedTime = date.toLocaleTimeString('en-US', timeOptions);
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    const isWithinDay = dateOnly.getTime() === tomorrowOnly.getTime();

    if (isWithinDay) {
      return (
        <span style={{ color: 'red' }}>
          {formattedDate} at {formattedTime} (tomorrow!)
        </span>
      );
    }

    return `${formattedDate} at ${formattedTime}`;
  }

  render () {
    const { api } = this.props;
    const { action } = this.state;

    if (action === 'work') {
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
            <Header as='h1'>{api?.resource?.title}</Header>
            <p>{api?.resource?.description}</p>
            <Divider />
            <GeneratedResponse
              request={{
                query: 'Begin working on this task. What are the first steps we should take?',
                messages: [{ role: 'user', content: `The task to complete: ${JSON.stringify(api?.resource || {})}` }]
              }}
              context={{ task: api?.resource }}
              placeholder={'Let\'s start with...'}
              {...this.props}
            />
          </Segment>
        </div>
      );
    }

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
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1em' }}>
            <p style={{ margin: 0 }}>
              Due: {api?.resource?.due_date ? (
                this.formatDate(api.resource.due_date)
              ) : (
                <span style={{ color: '#999', fontStyle: 'italic' }}>Not set</span>
              )}
            </p>
            {!api?.resource?.completed_at && (
              <Button
                icon
                basic
                size='tiny'
                style={{ marginLeft: '0.5em' }}
                onClick={() => this.setState({ isEditingDueDate: true })}
              >
                <Icon name='calendar' />
              </Button>
            )}
          </div>
          {this.state.isEditingDueDate && (
            <div style={{ marginBottom: '1em' }}>
              <div style={{ display: 'flex', gap: '1em', alignItems: 'center' }}>
                <input
                  type="date"
                  name="selectedDueDate"
                  value={this.state.selectedDueDate}
                  onChange={this.handleDueDateSelect}
                  style={{
                    padding: '0.5em',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    fontSize: '1em'
                  }}
                />
                <input
                  type="time"
                  name="selectedDueTime"
                  value={this.state.selectedDueTime}
                  onChange={this.handleDueDateSelect}
                  style={{
                    padding: '0.5em',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    fontSize: '1em'
                  }}
                />
                <Button
                  primary
                  size='tiny'
                  onClick={() => this.handleDueDateSubmit()}
                  loading={this.state.loading}
                >
                  Set Due Date
                </Button>
              </div>
            </div>
          )}
          <Divider />
          <Header as='h2'
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            onMouseEnter={() => this.handleDescriptionHover(true)}
            onMouseLeave={() => this.handleDescriptionHover(false)}
            onClick={this.toggleDescriptionEdit}
          >
            Description
            {this.state.isDescriptionHovered && (
              <Icon
                name='pencil'
                style={{
                  marginLeft: '0.5em',
                  opacity: 0.6,
                  fontSize: '0.7em'
                }}
              />
            )}
          </Header>
          <MarkdownContent {...this.props} content={api?.resource?.description || ''} />
          {this.state.isEditingDescription ? (
            <textarea
              value={this.state.editedDescription}
              onChange={(e) => this.setState({ editedDescription: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  this.saveDescription(e.target.value);
                } else if (e.key === 'Escape') {
                  this.setState({
                    isEditingDescription: false,
                    editedDescription: this.props.api?.resource?.description || ''
                  });
                }
              }}
              onBlur={(e) => this.saveDescription(e.target.value)}
              style={{
                border: '1px solid #ccc',
                padding: '0.5em',
                borderRadius: '4px',
                minHeight: '1.5em',
                outline: 'none',
                width: '100%',
                resize: 'vertical',
                fontFamily: 'inherit',
                fontSize: 'inherit'
              }}
            />
          ) : (
            <div
              style={{
                minHeight: '1.5em',
                cursor: 'pointer',
                whiteSpace: 'pre-wrap'
              }}
              onClick={this.toggleDescriptionEdit}
            >
              {api?.resource?.description ||
                <span style={{ color: '#999', fontStyle: 'italic' }}>
                  Click to add description...
                </span>
              }
            </div>
          )}
          {/* <Divider />
          <Header as='h2'>Notes</Header>
          <Form>
            <Form.TextArea placeholder='Add a note...' />
            <Button primary>Save</Button>
          </Form> */}
          <Divider />
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
  const [searchParams] = useSearchParams();
  return <TaskPage {...props} id={id} />;
}

module.exports = TaskView;
