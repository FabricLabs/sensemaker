'use strict';

// Constants
const { BRAND_NAME } = require('../constants');

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link, useNavigate } = require('react-router-dom');

// Components
// Semantic UI
const {
  Button,
  Card,
  Dropdown,
  Form,
  Header,
  Icon,
  Input,
  Modal,
  Popup,
  Segment,
  Select,
  Table,
  Transition
} = require('semantic-ui-react');

// Local Components
const ChatBox = require('./ChatBox');
const GeneratedResponse = require('./GeneratedResponse');
const HeaderBar = require('./HeaderBar');
const UserProfileSection = require('./UserProfileSection');
const TaskSettingsModal = require('./TaskSettingsModal');

// Functions
const toRelativeTime = require('../functions/toRelativeTime');

class TaskHomePage extends React.Component {
  constructor (settings = {}) {
    super(settings);

    this.state = {
      loading: false,
      editingTaskId: null,
      editingTaskTitle: '',
      taskTitle: '',
      selectedTasks: new Set(),
      isTaskFormFocused: false,
      showArchiveConfirm: false,
      taskToArchive: null,
      archiveTransitionVisible: true,
      showVisibilityModal: false,
      taskToMakePublic: null,
      selectedDueDate: null,
      showUncompleteConfirm: false,
      taskToUncomplete: null,
      sortBy: 'created_at',
      sortDirection: 'desc',
      showCompleted: false,
      showSettingsModal: false
    };
  }

  componentDidMount () {
    this.props.fetchTasks();
    this.props.fetchAgentStats();
  }

  componentDidUpdate (prevProps) {
    const { tasks } = this.props;
  }

  handleTaskCompletionChange = (e) => {
    const taskId = e.target.id;
    const task = this.props.tasks.tasks.find(t => t.id === taskId);

    if (task.completed_at) {
      // If task is completed, show confirmation modal before uncompleting
      this.setState({
        showUncompleteConfirm: true,
        taskToUncomplete: task
      });
    } else {
      // If task is not completed, complete it immediately
      const now = new Date();
      this.props.updateTask(taskId, { completed_at: now });
      this.setState({ taskCompletion: now });
      this.props.fetchTasks();
    }
  }

  handleUncompleteConfirm = async () => {
    const { taskToUncomplete } = this.state;
    await this.props.updateTask(taskToUncomplete.id, { completed_at: null });
    this.setState({
      showUncompleteConfirm: false,
      taskToUncomplete: null
    });
    this.props.fetchTasks();
  }

  handleUncompleteCancel = () => {
    this.setState({
      showUncompleteConfirm: false,
      taskToUncomplete: null
    });
  }

  handleTaskInputChange = (e) => {
    this.setState({ taskTitle: e.target.value });
  }

  handleTaskSubmit = async (e) => {
    this.setState({ loading: true })
    const task = await this.props.createTask({ title: this.state.taskTitle });
    this.setState({ taskTitle: '', loading: false });
    this.props.fetchTasks();
  }

  handleEditStart = (task) => {
    this.setState({
      editingTaskId: task.id,
      editingTaskTitle: task.title
    });
  }

  handleEditChange = (e) => {
    this.setState({ editingTaskTitle: e.target.value });
  }

  handleEditSubmit = async (e) => {
    if (e.key === 'Enter') {
      const { editingTaskId, editingTaskTitle } = this.state;
      await this.props.updateTask(editingTaskId, { title: editingTaskTitle });
      this.setState({ editingTaskId: null, editingTaskTitle: '' });
      this.props.fetchTasks();
    } else if (e.key === 'Escape') {
      this.setState({ editingTaskId: null, editingTaskTitle: '' });
    }
  }

  handleEditBlur = async () => {
    const { editingTaskId, editingTaskTitle } = this.state;
    if (editingTaskId) {
      await this.props.updateTask(editingTaskId, { title: editingTaskTitle });
      this.setState({ editingTaskId: null, editingTaskTitle: '' });
      this.props.fetchTasks();
    }
  }

  handleTaskSelection = (taskId) => {
    this.setState(prevState => {
      const newSelectedTasks = new Set(prevState.selectedTasks);
      if (newSelectedTasks.has(taskId)) {
        newSelectedTasks.delete(taskId);
      } else {
        newSelectedTasks.add(taskId);
      }
      return { selectedTasks: newSelectedTasks };
    });
  }

  handleAssignTask = async (taskId, agentId) => {
    await this.props.updateTask(taskId, { assigned_to: agentId });
    this.props.fetchTasks();
  }

  handleSearchChange = (e) => {
    this.setState({ searchQuery: e.target.value });
  }

  handleTaskRecurringToggle = async (taskId, isRecurring) => {
    await this.props.updateTask(taskId, { is_recurring: !isRecurring });
    this.props.fetchTasks();
  }

  handleTaskPauseToggle = async (taskId, isPaused) => {
    await this.props.updateTask(taskId, { is_paused: !isPaused });
    this.props.fetchTasks();
  }

  handleArchiveClick = (task) => {
    if (!task.completed_at) {
      this.setState({
        showArchiveConfirm: true,
        taskToArchive: task
      });
    } else {
      this.handleArchiveConfirm(task);
    }
  }

  handleArchiveConfirm = async (task) => {
    this.setState({ archiveTransitionVisible: false });
    setTimeout(async () => {
      await this.props.updateTask(task.id, { archived: true });
      this.setState({
        showArchiveConfirm: false,
        taskToArchive: null,
        archiveTransitionVisible: true
      });
      this.props.fetchTasks();
    }, 300);
  }

  handleArchiveCancel = () => {
    this.setState({
      showArchiveConfirm: false,
      taskToArchive: null
    });
  }

  handleTaskFormFocus = () => {
    this.setState({ isTaskFormFocused: true });
  }

  handleTaskFormBlur = () => {
    if (!this.state.taskTitle) {
      this.setState({ isTaskFormFocused: false });
    }
  }

  handleSortChange = (field) => {
    // If clicking the same field, toggle direction
    if (field === this.state.sortBy) {
      this.setState(prevState => ({
        sortDirection: prevState.sortDirection === 'asc' ? 'desc' : 'asc'
      }));
    } else {
      // If clicking a new field, set it with default direction
      this.setState({
        sortBy: field,
        sortDirection: 'desc' // Default to descending for new sort fields
      });
    }
  }

  handleShowCompletedChange = (checked) => {
    this.setState({ showCompleted: checked });
  }

  filterTasks = (tasks) => {
    const { sortBy, sortDirection, showCompleted } = this.state;
    let filteredTasks = tasks;

    // Filter completed tasks based on showCompleted setting
    filteredTasks = tasks.filter(task => showCompleted ? true : !task.completed_at);

    // Apply sorting
    filteredTasks.sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;

      if (sortBy === 'created_at') {
        return multiplier * (new Date(b.created_at) - new Date(a.created_at));
      } else if (sortBy === 'due_date') {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return multiplier;
        if (!b.due_date) return -multiplier;
        return multiplier * (new Date(a.due_date) - new Date(b.due_date));
      } else if (sortBy === 'completed_at') {
        if (!a.completed_at && !b.completed_at) return 0;
        if (!a.completed_at) return multiplier;
        if (!b.completed_at) return -multiplier;
        return multiplier * (new Date(b.completed_at) - new Date(a.completed_at));
      }
      return 0;
    });

    return filteredTasks;
  }

  handleVisibilityClick = (task) => {
    this.setState({
      showVisibilityModal: true,
      taskToMakePublic: task
    });
  }

  handleVisibilityConfirm = async () => {
    const { taskToMakePublic } = this.state;
    await this.props.updateTask(taskToMakePublic.id, { is_public: true });
    this.setState({
      showVisibilityModal: false,
      taskToMakePublic: null
    });
    this.props.fetchTasks();
  }

  handleVisibilityCancel = () => {
    this.setState({
      showVisibilityModal: false,
      taskToMakePublic: null
    });
  }

  handleDueDateChange = async (taskId, date) => {
    await this.props.updateTask(taskId, { due_date: date });
    this.props.fetchTasks();
  }

  handleWorkClick = (task) => {
    this.props.navigate(`/tasks/${task.id}?action=work`);
  }

  handleAddClick = () => {
    this.setState({ showTopInput: true }, () => {
      // Focus the input after it's rendered
      setTimeout(() => {
        const input = document.querySelector('.task-form input');
        if (input) input.focus();
      }, 0);
    });
  }

  handleTopInputSubmit = async (e) => {
    e.preventDefault();
    this.setState({ loading: true });
    const task = await this.props.createTask({ title: this.state.taskTitle });
    this.setState({
      taskTitle: '',
      loading: false,
      showTopInput: false
    });
    this.props.fetchTasks();
  }

  handleSettingsClick = () => {
    this.setState({ showSettingsModal: true });
  }

  handleSettingsClose = () => {
    this.setState({ showSettingsModal: false });
  }

  render () {
    const { agents, network, tasks, response } = this.props;
    const filteredTasks = tasks ? this.filterTasks(tasks.tasks) : [];

    return (
      <sensemaker-task-home class='fade-in' style={{ height: '100%' }}>
        <Card fluid>
          <Card.Content>
            <Segment>
              <div style={{ flexShrink: 0 }}>
                <h2><Icon name="settings" style={{ float: 'right', cursor: 'pointer' }} onClick={this.handleSettingsClick} />Tasks</h2>
                <p>{BRAND_NAME} will monitor active tasks and perform background work to assist you in completing them.</p>
              </div>
            </Segment>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}> 
              <Table>
                <Table.Body animation='fade'>
                  <Table.Row className='fade-in'>
                    <Table.Cell width={1}></Table.Cell>
                    <Table.Cell width={12}>
                      <Form fluid onSubmit={this.handleTaskSubmit} style={{ margin: 0, marginLeft: '-1em' }}>
                        <Form.Field fluid onChange={this.handleTaskInputChange} loading={this.state.loading} style={{ marginBottom: 0 }} className={`task-form ${this.state.isTaskFormFocused || this.state.taskTitle ? 'focused' : ''}`}>
                          <Input
                            fluid
                            type='text'
                            name='title'
                            value={this.state.taskTitle}
                            placeholder='Add a new task...'
                            onFocus={this.handleTaskFormFocus}
                            onBlur={this.handleTaskFormBlur}
                            style={{ padding: '0.5em 0' }}
                          />
                        </Form.Field>
                      </Form>
                    </Table.Cell>
                    <Table.Cell width={3} textAlign='right'>
                      <Button.Group basic className='desktop-only action-buttons'>
                        <Button primary icon onClick={this.handleTaskSubmit} disabled={!this.state.taskTitle}>
                          <Icon name='plus' />
                        </Button>
                      </Button.Group>
                    </Table.Cell>
                  </Table.Row>
                  {filteredTasks.map((x) => {
                    return (
                      <Table.Row className='fade-in' key={x.id}>
                        <Table.Cell width={1} collapsing>
                          <Button.Group basic className='desktop-only action-buttons' style={{ marginLeft: '3px' }}>
                            <Popup
                              content={x.completed_at ? 'Mark as incomplete' : 'Mark as complete'}
                              trigger={
                                <Button
                                  icon
                                  onClick={() => this.handleTaskCompletionChange({ target: { id: x.id } })}
                                  color={x.completed_at ? 'green' : undefined}
                                  className={`complete-button ${x.completed_at ? 'completed' : 'incomplete'}`}
                                >
                                  <Icon name='check' />
                                </Button>
                              }
                              position='top center'
                              size='tiny'
                            />
                          </Button.Group>
                        </Table.Cell>
                        <Table.Cell width={12}>
                          {this.state.editingTaskId === x.id ? (
                            <Input
                              fluid
                              value={this.state.editingTaskTitle}
                              onChange={this.handleEditChange}
                              onKeyDown={this.handleEditSubmit}
                              onBlur={this.handleEditBlur}
                              autoFocus
                            />
                          ) : (
                            <div
                              onClick={() => x.can_edit && this.handleEditStart(x)}
                              style={{
                                cursor: x.can_edit ? 'pointer' : 'default',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5em',
                                padding: '0.5em 0'
                              }}
                              className="task-title-container"
                            >
                              <Link to={`/tasks/${x.id}`}>{x.title}</Link>
                              {x.can_edit && <Icon name='pencil' color='grey' style={{ opacity: 0 }} className="edit-icon" />}
                            </div>
                          )}
                        </Table.Cell>
                        <Table.Cell width={3} collapsing textAlign='right'>
                          <Button.Group basic className='desktop-only action-buttons'>
                            {(x.can_edit) ? (
                              <Popup
                                content='Edit task'
                                trigger={
                                  <Button
                                    icon
                                    as={Link}
                                    to={`/tasks/${x.id}?edit=title`}
                                  >
                                    <Icon name='pencil' />
                                  </Button>
                                }
                                position='top center'
                                size='tiny'
                              />
                            ) : null}
                            <Popup
                              content='Archive task'
                              trigger={
                                <Button
                                  icon
                                  onClick={() => this.handleArchiveClick(x)}
                                >
                                  <Icon name='archive' />
                                </Button>
                              }
                              position='top center'
                              size='tiny'
                            />
                            <Popup
                              content='Begin work'
                              trigger={
                                <Button
                                  icon
                                  onClick={() => this.handleWorkClick(x)}
                                >
                                  <Icon name='play' />
                                </Button>
                              }
                              position='top center'
                              size='tiny'
                            />
                          </Button.Group>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                  {/* Empty row for new task creation */}
                  <Table.Row className='fade-in'>
                    <Table.Cell width={1}></Table.Cell>
                    <Table.Cell width={12}>
                      <Form fluid onSubmit={this.handleTaskSubmit} style={{ margin: 0 }}>
                        <Form.Field fluid onChange={this.handleTaskInputChange} loading={this.state.loading} style={{ marginBottom: 0 }} className={`task-form ${this.state.isTaskFormFocused || this.state.taskTitle ? 'focused' : ''}`}>
                          <Input
                            fluid
                            type='text'
                            name='title'
                            value={this.state.taskTitle}
                            placeholder='Add a new task...'
                            onFocus={this.handleTaskFormFocus}
                            onBlur={this.handleTaskFormBlur}
                            style={{ padding: '0.5em 0' }}
                          />
                        </Form.Field>
                      </Form>
                    </Table.Cell>
                    <Table.Cell width={3} textAlign='right'>
                      <Button.Group basic className='desktop-only action-buttons'>
                        <Button
                          primary
                          icon
                          onClick={this.handleTaskSubmit}
                          disabled={!this.state.taskTitle}
                        >
                          <Icon name='plus' />
                        </Button>
                      </Button.Group>
                    </Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table>
              <ChatBox {...this.props} context={{ tasks: tasks?.tasks }} placeholder='Ask about these tasks...' />
            </div>
          </Card.Content>
        </Card>

        {/* <GeneratedResponse
          request={{
            query: 'Suggest next steps for completing the list of tasks.  Respond directly to the user.',
            messages: [
              {
                role: 'user',
                content: `The following is a list of tasks: ${JSON.stringify(
                  tasks.tasks.filter((x) => {
                    return (x.completed_at) ? false : true;
                  }).map((x) => {
                    return {
                      title: x.title,
                      due_date: x.due_date
                    }
                  })
                )}`
              }
            ]
          }}
          chat={this.props.chat}
          context={{ tasks: tasks.tasks, summary: response?.content }}
          fetchResponse={this.props.fetchResponse}
          placeholder={'Let\'s start with...'}
          {...this.props}
        /> */}
        <Modal size="tiny" open={this.state.showUncompleteConfirm} onClose={this.handleUncompleteCancel}>
          <Modal.Header>Mark Task as Incomplete</Modal.Header>
          <Modal.Content>
            <p>Are you sure you want to mark this task as incomplete?</p>
          </Modal.Content>
          <Modal.Actions>
            <Button negative onClick={this.handleUncompleteCancel}>
              Cancel
            </Button>
            <Button positive onClick={this.handleUncompleteConfirm}>
              Mark Incomplete
            </Button>
          </Modal.Actions>
        </Modal>

        <Modal size="tiny" open={this.state.showArchiveConfirm} onClose={this.handleArchiveCancel}>
          <Modal.Header>Archive Incomplete Task</Modal.Header>
          <Modal.Content>
            <p>Are you sure? This task isn't complete.</p>
          </Modal.Content>
          <Modal.Actions>
            <Button negative onClick={this.handleArchiveCancel}>
              Cancel
            </Button>
            <Button positive onClick={() => this.handleArchiveConfirm(this.state.taskToArchive)}>
              Archive
            </Button>
          </Modal.Actions>
        </Modal>

        <Modal size="tiny" open={this.state.showVisibilityModal} onClose={this.handleVisibilityCancel}>
          <Modal.Header>Make Task Public</Modal.Header>
          <Modal.Content>
            <p>Are you sure you want to make this task visible to the public? This action cannot be undone.</p>
          </Modal.Content>
          <Modal.Actions>
            <Button negative onClick={this.handleVisibilityCancel}>
              Cancel
            </Button>
            <Button positive onClick={this.handleVisibilityConfirm}>
              Make Public
            </Button>
          </Modal.Actions>
        </Modal>

        <TaskSettingsModal
          isOpen={this.state.showSettingsModal}
          onClose={this.handleSettingsClose}
          sortBy={this.state.sortBy}
          sortDirection={this.state.sortDirection}
          onSortChange={this.handleSortChange}
          showCompleted={this.state.showCompleted}
          onShowCompletedChange={this.handleShowCompletedChange}
        />

        <style>{`
          .task-title-container:hover .edit-icon {
            opacity: 1 !important;
            transition: opacity 0.2s ease;
          }

          .action-buttons {
            position: relative;
            opacity: 0;
            transition: opacity 0.2s ease;
          }

          tr:hover .action-buttons {
            opacity: 1;
          }

          /* Make first column action buttons always visible */
          td:first-child .action-buttons {
            opacity: 1;
          }

          .complete-button {
            transition: all 0.2s ease !important;
          }

          .complete-button.completed {
            color: #21ba45 !important;
          }

          .complete-button.incomplete {
            opacity: 0;
          }

          tr:hover .complete-button.incomplete {
            opacity: 1;
          }

          .complete-button:hover {
            background-color: #21ba45 !important;
            color: white !important;
          }

          /* Constrain the width of the leftmost column */
          .ui.table td:first-child {
            width: 42px !important;
            min-width: 42px !important;
            max-width: 42px !important;
            padding-right: 0;
          }

          /* Ensure the button group stays compact */
          .ui.table td:first-child .button.group {
            margin: 0;
            display: flex;
            justify-content: center;
          }

          /* Add proper spacing for table cells */
          .ui.table td {
            padding: 0.8em 0.5em !important;
            vertical-align: middle;
          }

          /* Add proper spacing for the task title cell */
          .ui.table td:nth-child(2) {
            padding-left: 1em !important;
          }
        `}</style>
      </sensemaker-task-home>
    );
  }

  _toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }

  toHTML () {
    return this._toHTML();
  }
}

function TaskHome () {
  return (props) => {
    const navigate = useNavigate();
    return <TaskHomePage {...props} navigate={navigate} />;
  };
};

module.exports = TaskHome(TaskHomePage);
