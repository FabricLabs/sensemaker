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
      isEditingTitle: false,
      editedTitle: '',
      isTitleHovered: false,
      action: null,
      isEditingDueDate: false,
      selectedDueDate: null,
      selectedDueTime: null,
      markdownEditMode: false
    };

    this.handleTitleEdit = this.handleTitleEdit.bind(this);
    this.saveTitle = this.saveTitle.bind(this);
    this.toggleTitleEdit = this.toggleTitleEdit.bind(this);
    this.handleTitleHover = this.handleTitleHover.bind(this);
    this.handleDueDateSelect = this.handleDueDateSelect.bind(this);
    this.handleDueDateSubmit = this.handleDueDateSubmit.bind(this);
    this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
    this.handleMarkdownEditToggle = this.handleMarkdownEditToggle.bind(this);
    this.handleChatResponse = this.handleChatResponse.bind(this);
    this.handleCompleteTask = this.handleCompleteTask.bind(this);

    return this;
  }

  componentDidMount () {
    console.debug('[SENSEMAKER:TASK]', 'TaskPage mounted!');
    this.props.fetchResource();

    // Check for action and edit parameters
    const searchParams = new URLSearchParams(window.location.search);
    const action = searchParams.get('action');
    const edit = searchParams.get('edit');

    // Get default due time from localStorage or props, fallback to 3 PM
    const defaultDueTime = this.props.defaultDueTime ||
                          localStorage.getItem('defaultDueTime') ||
                          '15:00';

    // Parse the default time
    const [hours, minutes] = defaultDueTime.split(':').map(Number);

    // Set default date to tomorrow at the configured time
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hours, minutes, 0, 0);

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

  async handleDueDateSelect (event) {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  }

  async handleDueDateSubmit () {
    const { selectedDueDate, selectedDueTime } = this.state;

    if (!selectedDueDate || !selectedDueTime) {
      return;
    }

    // Combine the date and time strings
    const dateTimeStr = `${selectedDueDate}T${selectedDueTime}`;

    // Create a date object in local timezone
    const combinedDateTime = new Date(dateTimeStr);

    // Ensure valid date
    if (isNaN(combinedDateTime.getTime())) {
      console.error('Invalid date created');
      return;
    }

    this.setState({ loading: true });

    try {
      await this.props.updateTask(this.props.api.resource.id, {
        due_date: combinedDateTime.toISOString()
      });
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
    } catch (error) {
      console.error('Error updating due date:', error);
      this.setState({ loading: false });
    }
  }

  handleDescriptionChange (newContent) {
    this.setState({ loading: true });
    this.props.updateTask(this.props.api.resource.id, { description: newContent })
      .then(() => this.props.fetchResource())
      .finally(() => this.setState({ loading: false }));
  }

  handleMarkdownEditToggle (newMode) {
    this.setState({ markdownEditMode: newMode });
  }

  handleChatResponse (response) {
    if (!response?.choices?.[0]?.message?.content) return;

    this.setState({ loading: true });
    this.props.updateTask(this.props.api.resource.id, {
      recommendation: response.choices[0].message.content
    }).then(() => this.props.fetchResource()).finally(() => this.setState({ loading: false }));
  }

  async handleCompleteTask () {
    this.setState({ loading: true });
    try {
      await this.props.updateTask(this.props.api.resource.id, {
        completed_at: new Date().toISOString()
      });
      await this.props.fetchResource();
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      this.setState({ loading: false });
    }
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
                query: `The task to complete: ${JSON.stringify(api?.resource || {})}` + '\n\nBegin working on this task. What are the first steps we should take?'
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1em' }}>
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
            {!api?.resource?.completed_at && (
              <Button
                positive
                icon
                labelPosition='right'
                onClick={this.handleCompleteTask}
                loading={this.state.loading}
              >
                Mark as Complete
                <Icon name='check' />
              </Button>
            )}
          </div>
          {(api?.resource?.created_at) ? <p>Created <abbr title={api?.resource?.created_at}>{toRelativeTime(api?.resource?.created_at)}</abbr></p> : null}
          {!api?.resource?.completed_at && (
            <Button
              basic
              onClick={() => this.setState({ isEditingDueDate: true })}
              size='tiny'
              style={{ marginLeft: '0.5em' }}
            >
              <Icon name='calendar' />
              {api?.resource?.due_date ? (
                <abbr title={api.resource.due_date}>{this.formatDate(api.resource.due_date)}</abbr>
              ) : (
                <span style={{ color: '#999', fontStyle: 'italic' }}>no due date</span>
              )}
            </Button>
          )}
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
          <Header as='h2'>Description</Header>
          <div style={{ position: 'relative' }}>
            <Button
              icon
              size='small'
              onClick={() => this.handleMarkdownEditToggle(!this.state.markdownEditMode)}
              style={{ position: 'absolute', right: 0, top: '-3em' }}
            >
              <Icon name='edit' />
            </Button>
            <MarkdownContent
              content={api?.resource?.description || ''}
              onContentChange={this.handleDescriptionChange}
              editable={true}
              hideEditButton={true}
              externalEditMode={this.state.markdownEditMode}
              onEditModeChange={this.handleMarkdownEditToggle}
            />
          </div>
          <Divider />
          <Header as='h2'>Recommendation</Header>
          <GeneratedResponse
            request={api?.resource?.recommendation != null ? null : {
              query: `The task to complete: ${JSON.stringify(api?.resource || {})}` + '\n\nSuggest next steps for completing the task.  Respond directly to the user.'
            }}
            initialContent={api?.resource?.recommendation}
            context={{ task: api?.resource }}
            placeholder={'Let\'s start with...'}
            onResponse={this.handleChatResponse}
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
