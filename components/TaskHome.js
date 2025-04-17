'use strict';

// Constants
const { BRAND_NAME } = require('../constants');

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

// Components
// Semantic UI
const {
  Button,
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

// Functions
const toRelativeTime = require('../functions/toRelativeTime');

class TaskHome extends React.Component {
  constructor (settings = {}) {
    super(settings);

    this.state = {
      loading: false,
      editingTaskId: null,
      editingTaskTitle: '',
      taskTitle: '',
      selectedTasks: new Set(),
      searchQuery: '',
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
      showCompleted: false
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

  handleSortChange = (e, { value }) => {
    this.setState({ sortBy: value });
  }

  filterTasks = (tasks) => {
    const { searchQuery, sortBy, showCompleted } = this.state;
    let filteredTasks = tasks;

    // Filter out completed tasks by default
    if (!showCompleted) {
      filteredTasks = tasks.filter(task => !task.completed_at);
    }

    // Apply search filter
    if (searchQuery) {
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filteredTasks.sort((a, b) => {
      if (sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === 'due_date') {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      } else if (sortBy === 'completed_at') {
        if (!a.completed_at && !b.completed_at) return 0;
        if (!a.completed_at) return 1;
        if (!b.completed_at) return -1;
        return new Date(b.completed_at) - new Date(a.completed_at);
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
    this.props.history.push(`/tasks/${task.id}`);
  }

  render () {
    const { agents, network, tasks, response } = this.props;

    // Prepare agent options for dropdown
    const agentOptions = agents?.agents?.map(agent => ({
      key: agent.id,
      text: agent.name || agent.username,
      value: agent.id,
      image: { avatar: true, src: agent.avatar_url || undefined }
    })) || [];

    const filteredTasks = tasks ? this.filterTasks(tasks.tasks) : [];

    return (
      <sensemaker-task-home class='fade-in' style={{ height: '100%' }}>
        <Segment className='fade-in' loading={network?.loading} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flexShrink: 0 }}>
            <h2>Tasks</h2>
            <p>{BRAND_NAME} will monitor active tasks and perform background work to assist you in completing them.</p>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Table>
              <Table.Header fullWidth={true} style={{ flexShrink: 0 }}>
                <Table.Row>
                  <Table.HeaderCell></Table.HeaderCell>
                  <Table.HeaderCell>
                    <Input
                      fluid
                      icon='search'
                      placeholder='Search tasks...'
                      value={this.state.searchQuery}
                      onChange={this.handleSearchChange}
                    />
                  </Table.HeaderCell>
                  <Table.HeaderCell></Table.HeaderCell>
                  <Table.HeaderCell textAlign='right'>
                    <Button.Group>
                      <Button basic active={!this.state.showCompleted} onClick={() => this.setState({ showCompleted: false })}><Icon name='asterisk' /> Active</Button>
                      <Button basic active={this.state.showCompleted} onClick={() => this.setState({ showCompleted: true })}><Icon name='check' /> Completed</Button>
                      <Button basic disabled><Icon name='disk' /> Archive</Button>
                    </Button.Group>
                  </Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body animation='fade right'>
                {filteredTasks.map((x) => {
                  return (
                    <Table.Row className='fade-in' key={x.id}>
                      <Table.Cell collapsing>
                        <Button.Group basic className='desktop-only action-buttons'>
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
                      <Table.Cell collapsing>
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
                              gap: '0.5em'
                            }}
                            className="task-title-container"
                          >
                            <Link to={`/tasks/${x.id}`}>{x.title}</Link>
                            {x.can_edit && <Icon name='pencil' color='grey' style={{ opacity: 0 }} className="edit-icon" />}
                          </div>
                        )}
                        <style>{`
                          .task-title-container:hover .edit-icon {
                            opacity: 1 !important;
                            transition: opacity 0.2s ease;
                          }
                        `}</style>
                      </Table.Cell>
                      <Table.Cell collapsing></Table.Cell>
                      <Table.Cell collapsing textAlign='right'>
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
                <Table.Row className='fade-in'>
                  <Table.Cell collapsing></Table.Cell>
                  <Table.Cell colSpan="3">
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
                          action={
                            <Transition visible={this.state.isTaskFormFocused || this.state.taskTitle} animation='slide right' duration={300}>
                              <Button primary attached='right' type='submit'>
                                Create
                                <Icon name='right chevron' />
                              </Button>
                            </Transition>
                          }
                        />
                      </Form.Field>
                    </Form>
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>
            <ChatBox {...this.props} context={{ tasks: tasks?.tasks }} placeholder='Ask about these tasks...' />
          </div>
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
          {/* Uncomplete Confirmation Modal */}
          <Modal
            size="tiny"
            open={this.state.showUncompleteConfirm}
            onClose={this.handleUncompleteCancel}
          >
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

          {/* Archive Confirmation Modal */}
          <Modal
            size="tiny"
            open={this.state.showArchiveConfirm}
            onClose={this.handleArchiveCancel}
          >
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

          {/* Visibility Confirmation Modal */}
          <Modal
            size="tiny"
            open={this.state.showVisibilityModal}
            onClose={this.handleVisibilityCancel}
          >
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
          `}</style>
        </Segment>
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

module.exports = TaskHome;
