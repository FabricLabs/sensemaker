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
  Transition,
  Checkbox,
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
      showUncompleteConfirm: false,
      taskToUncomplete: null,
      sortBy: 'created_at',
      sortDirection: 'desc',
      showCompleted: false,
      showIncomplete: true,
      showSettingsModal: false,
      sortPopupOpen: false,
      defaultDueTime: localStorage.getItem('defaultDueTime') || '15:00', // Default to 3:00 PM
      containerHeight: 0,
      taskHeight: 0,
      visibleTaskCount: 0,
      startIndex: 0, // Add tracking for the starting index
      showCreateModal: false,
      newTaskTitle: '',
      newTaskDescription: '',
      newTaskDueDate: null,
      createAIPlan: false
    };

    this.containerRef = React.createRef();
    this.taskRef = React.createRef();
  }

  componentDidMount () {
    this.props.fetchTasks();
    this.props.fetchAgentStats();
    this.updateContainerDimensions();
    window.addEventListener('resize', this.updateContainerDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateContainerDimensions);
  }

  updateContainerDimensions = () => {
    if (this.containerRef.current) {
      const containerHeight = this.containerRef.current.clientHeight;
      const taskHeight = this.taskRef.current ? this.taskRef.current.clientHeight : 56; // Default height if no task

      // Calculate available height by subtracting fixed elements:
      // - Header segment (~100px)
      // - Chat segment (~150px)
      // - Table header (~60px)
      // - Bottom input row (~60px)
      // - Some padding (~30px)
      const fixedElementsHeight = 400;
      const availableHeight = containerHeight - fixedElementsHeight;

      // Calculate how many tasks can fit
      const visibleTaskCount = Math.max(5, Math.floor(availableHeight / taskHeight));

      console.log('Container dimensions:', {
        containerHeight,
        taskHeight,
        availableHeight,
        visibleTaskCount
      });

      this.setState({
        containerHeight,
        taskHeight,
        visibleTaskCount
      });
    }
  }

  componentDidUpdate (prevProps, prevState) {
    const { tasks } = this.props;
    if (prevProps.tasks !== tasks) {
      this.updateContainerDimensions();
    }
  }

  handleTaskCompletionChange = async (e) => {
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
      await this.props.updateTask(taskId, { completed_at: now });
      this.setState({ taskCompletion: now });
      await this.props.fetchTasks();
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
        sortDirection: prevState.sortDirection === 'asc' ? 'desc' : 'asc',
        sortPopupOpen: false
      }));
    } else {
      // If clicking a new field, set it with default direction
      this.setState({
        sortBy: field,
        sortDirection: 'desc', // Default to descending for new sort fields
        sortPopupOpen: false
      });
    }
  }

  handleShowCompletedChange = (checked) => {
    this.setState({
      showCompleted: checked,
      sortPopupOpen: false
    });
  }

  handleShowIncompleteChange = (checked) => {
    this.setState({
      showIncomplete: checked,
      sortPopupOpen: false
    });
  }

  handleLoadMore = () => {
    const { startIndex, visibleTaskCount } = this.state;
    // Always move by the full visibleTaskCount to maintain full pages
    const newStartIndex = startIndex + visibleTaskCount;
    this.setState({ startIndex: newStartIndex });
  }

  handleLoadPrevious = () => {
    const { startIndex, visibleTaskCount } = this.state;
    // Always move back by the full visibleTaskCount
    const newStartIndex = Math.max(0, startIndex - visibleTaskCount);
    this.setState({ startIndex: newStartIndex });
  }

  filterTasks = (tasks) => {
    const { sortBy, sortDirection, showCompleted, showIncomplete, visibleTaskCount, startIndex } = this.state;
    let filteredTasks = [...tasks]; // Create a copy to avoid mutating the original

    // Filter tasks based on completion status
    filteredTasks = filteredTasks.filter(task => {
      if (task.completed_at) {
        return showCompleted;
      } else {
        return showIncomplete;
      }
    });

    // Apply sorting based on user selection
    filteredTasks.sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;

      if (sortBy === 'created_at') {
        return multiplier * (new Date(a.created_at) - new Date(b.created_at));
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

    const totalTasks = filteredTasks.length;

    // Calculate the number of full pages we can show
    const numFullPages = Math.floor(totalTasks / visibleTaskCount);
    const lastFullPageStart = numFullPages * visibleTaskCount;

    // If we're beyond the last full page start, adjust back to it
    let effectiveStartIndex = startIndex;
    if (startIndex > lastFullPageStart) {
      effectiveStartIndex = Math.max(0, totalTasks - visibleTaskCount);
    }

    // If we're showing less than a full page and we're not at the start,
    // try to show a full page
    if (totalTasks - effectiveStartIndex < visibleTaskCount && effectiveStartIndex > 0) {
      effectiveStartIndex = Math.max(0, lastFullPageStart);
    }

    // Ensure we never show less than a full page unless we're at the start
    // and don't have enough items
    if (effectiveStartIndex > 0 && totalTasks - effectiveStartIndex < visibleTaskCount) {
      effectiveStartIndex = Math.max(0, totalTasks - visibleTaskCount);
    }

    const visibleTasks = filteredTasks.slice(effectiveStartIndex, effectiveStartIndex + visibleTaskCount);

    return {
      tasks: visibleTasks,
      hasMore: effectiveStartIndex + visibleTaskCount < totalTasks,
      hasPrevious: effectiveStartIndex > 0,
      totalTasks,
      effectiveStartIndex
    };
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

  handleCreateModalOpen = () => {
    this.setState({ showCreateModal: true });
  }

  handleCreateModalClose = () => {
    this.setState({
      showCreateModal: false,
      newTaskTitle: '',
      newTaskDescription: '',
      newTaskDueDate: null,
      createAIPlan: false
    });
  }

  handleNewTaskSubmit = async () => {
    const { newTaskTitle, newTaskDescription, newTaskDueDate, createAIPlan } = this.state;
    this.setState({ loading: true });

    const taskData = {
      title: newTaskTitle,
      description: newTaskDescription
    };

    if (newTaskDueDate) {
      taskData.due_date = newTaskDueDate;
    }

    const task = await this.props.createTask(taskData);

    if (createAIPlan && task) {
      // Trigger AI planning by simulating a chat message
      await this.props.chat.sendMessage(`Create a plan for the task: ${newTaskTitle}${newTaskDescription ? '\n\nContext: ' + newTaskDescription : ''}`);
    }

    this.setState({
      loading: false,
      showCreateModal: false,
      newTaskTitle: '',
      newTaskDescription: '',
      newTaskDueDate: null,
      createAIPlan: false
    });

    this.props.fetchTasks();
  }

  render () {
    const { agents, network, tasks, response } = this.props;
    const { startIndex, visibleTaskCount, showCreateModal, newTaskTitle, loading } = this.state;
    const filteredTasksData = tasks ? this.filterTasks(tasks.tasks) : { tasks: [], hasMore: false, hasPrevious: false, totalTasks: 0, effectiveStartIndex: 0 };
    const filteredTasks = filteredTasksData.tasks;

    return (
      <sensemaker-task-home class='fade-in' style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Segment style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>Tasks</h2>
            <Button.Group>
              <Button color='black' onClick={this.handleSettingsClick}>
                <Icon name='settings' />
              </Button>
              <Button primary icon labelPosition='right' onClick={this.handleCreateModalOpen}>
                <Icon name='plus' />
                Add Task
              </Button>
            </Button.Group>
          </div>
          <p style={{ margin: '0.5em 0' }}>{BRAND_NAME} will monitor active tasks and perform background work to assist you in completing them.</p>
        </Segment>
        <div ref={this.containerRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Table>
            <Table.Header animation='fade'>
              <Table.Row className='fade-in'>
                <Table.Cell></Table.Cell>
                <Table.Cell>
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
                        className="header-task-input"
                      />
                    </Form.Field>
                  </Form>
                </Table.Cell>
                <Table.Cell textAlign='right'>
                  <Button.Group basic className='desktop-only sort-buttons'>
                    <Popup
                      trigger={
                        <Button icon>
                          <Icon name={this.state.sortDirection === 'asc' ? 'sort amount up' : 'sort amount down'} />
                        </Button>
                      }
                      on='click'
                      position='bottom right'
                      wide
                      open={this.state.sortPopupOpen}
                      onOpen={() => this.setState({ sortPopupOpen: true })}
                      onClose={() => this.setState({ sortPopupOpen: false })}
                      content={
                        <div style={{ padding: '0.5em' }}>
                          <div style={{ marginBottom: '1em' }}>
                            <div style={{ display: 'flex', gap: '0.5em' }}>
                              <Select
                                fluid
                                value={this.state.sortBy}
                                onChange={(e, data) => {
                                  this.handleSortChange(data.value);
                                }}
                                options={[
                                  { key: 'created_at', text: 'Creation Date', value: 'created_at' },
                                  { key: 'due_date', text: 'Due Date', value: 'due_date' },
                                  { key: 'completed_at', text: 'Completion Date', value: 'completed_at' }
                                ]}
                              />
                              <Button
                                icon
                                onClick={() => {
                                  this.handleSortChange(this.state.sortBy);
                                }}
                              >
                                <Icon name={this.state.sortDirection === 'asc' ? 'sort amount up' : 'sort amount down'} />
                              </Button>
                            </div>
                          </div>
                          <div style={{ marginBottom: '0.5em' }}>
                            <Form.Checkbox
                              label="Show incomplete tasks"
                              checked={this.state.showIncomplete}
                              onChange={(e, data) => {
                                this.handleShowIncompleteChange(data.checked);
                              }}
                            />
                          </div>
                          <div>
                            <Form.Checkbox
                              label="Show completed tasks"
                              checked={this.state.showCompleted}
                              onChange={(e, data) => {
                                this.handleShowCompletedChange(data.checked);
                              }}
                            />
                          </div>
                        </div>
                      }
                    />
                  </Button.Group>
                </Table.Cell>
              </Table.Row>
            </Table.Header>
            <Table.Body animation='fade'>
              {filteredTasksData.hasPrevious && (
                <Table.Row className='fade-in load-more-row'>
                  <Table.Cell colSpan="3" textAlign="center" style={{ cursor: 'pointer' }} onClick={this.handleLoadPrevious}>
                    <Icon name="arrow up" />
                    Show Previous ({filteredTasksData.effectiveStartIndex} more)
                  </Table.Cell>
                </Table.Row>
              )}
              {filteredTasks.map((x, index) => {
                return (
                  <Table.Row
                    className='fade-in'
                    key={x.id}
                    ref={index === 0 ? this.taskRef : null}
                  >
                    <Table.Cell>
                      <Button.Group basic className='desktop-only action-buttons' style={{ marginLeft: '3px' }}>
                        <Button
                          icon
                          onClick={() => this.handleTaskCompletionChange({ target: { id: x.id } })}
                          color={x.completed_at ? 'green' : undefined}
                          className={`complete-button ${x.completed_at ? 'completed' : 'incomplete'}`}
                        >
                          <Icon name='check' />
                        </Button>
                      </Button.Group>
                    </Table.Cell>
                    <Table.Cell>
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
                            padding: '0.5em 1em'
                          }}
                          className="task-title-container"
                        >
                          <Popup
                            trigger={
                              <Link to={`/tasks/${x.id}`}>{x.title}</Link>
                            }
                            hoverable
                            position='bottom left'
                            wide
                          >
                            <Popup.Content>
                              <div style={{ padding: '0.5em' }}>
                                <div style={{ marginBottom: '0.5em' }}>
                                  <strong>Created:</strong> {toRelativeTime(x.created_at)}
                                </div>
                                <div style={{ marginBottom: '0.5em' }}>
                                  {!x.completed_at ? (
                                    <div
                                      style={{ cursor: 'pointer' }}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        this.props.navigate(`/tasks/${x.id}?edit=due_date`);
                                      }}
                                    >
                                      <strong>Due Date:</strong>{' '}
                                      {x.due_date ? toRelativeTime(x.due_date) : 'Click to set'}
                                    </div>
                                  ) : (
                                    <div>
                                      <strong>Due Date:</strong>{' '}
                                      <abbr title={x.due_date}>{x.due_date ? toRelativeTime(x.due_date) : 'Not set'}</abbr>
                                    </div>
                                  )}
                                </div>
                                <div style={{ marginBottom: '0.5em' }}>
                                  <strong>Status:</strong> {x.completed_at ? 'Completed' : 'In Progress'}
                                </div>
                              </div>
                            </Popup.Content>
                          </Popup>
                          {x.can_edit && <Icon name='pencil' color='grey' style={{ opacity: 0 }} className="edit-icon" />}
                        </div>
                      )}
                    </Table.Cell>
                    <Table.Cell textAlign='right'>
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
              {filteredTasksData.hasMore && (
                <Table.Row className='fade-in load-more-row'>
                  <Table.Cell colSpan="3" textAlign="center" style={{ cursor: 'pointer' }} onClick={this.handleLoadMore}>
                    <Icon name="arrow down" />
                    Show More ({filteredTasksData.totalTasks - (filteredTasksData.effectiveStartIndex + visibleTaskCount)} remaining)
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
          <Segment style={{ marginTop: 0 }}>
            <ChatBox {...this.props} context={{ tasks: tasks?.tasks }} placeholder='Ask about these tasks...' />
          </Segment>
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

        <Modal
          open={showCreateModal}
          onClose={this.handleCreateModalClose}
          size="tiny"
          className="create-task-modal"
        >
          <Modal.Header>Create New Task</Modal.Header>
          <Modal.Content>
            <Form>
              <Form.Field>
                <label>Task Title</label>
                <Input
                  fluid
                  placeholder="Enter task title..."
                  value={newTaskTitle}
                  onChange={(e) => this.setState({ newTaskTitle: e.target.value })}
                  autoFocus
                />
              </Form.Field>
              <Form.Field>
                <label>Description</label>
                <Form.TextArea
                  placeholder="Enter task description..."
                  value={this.state.newTaskDescription}
                  onChange={(e) => this.setState({ newTaskDescription: e.target.value })}
                  style={{ minHeight: 100 }}
                />
              </Form.Field>
              <Form.Field>
                <label>Due Date (Optional)</label>
                <Input
                  fluid
                  type="datetime-local"
                  value={this.state.newTaskDueDate || ''}
                  onChange={(e) => this.setState({ newTaskDueDate: e.target.value })}
                />
              </Form.Field>
              <Form.Field>
                <Checkbox
                  label={<span><Icon name='brain' /> Generate a plan for this task</span>}
                  checked={this.state.createAIPlan}
                  onChange={(e, data) => this.setState({ createAIPlan: data.checked })}
                />
              </Form.Field>
            </Form>
          </Modal.Content>
          <Modal.Actions>
            <Button negative onClick={this.handleCreateModalClose}>
              Cancel
            </Button>
            <Button
              positive
              loading={loading}
              disabled={!newTaskTitle.trim() || loading}
              onClick={this.handleNewTaskSubmit}
            >
              Add Task
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
          defaultDueTime={this.state.defaultDueTime}
          onDefaultDueTimeChange={(time) => {
            localStorage.setItem('defaultDueTime', time);
            this.setState({ defaultDueTime: time });
          }}
        />

        <style>{`
          @media (max-width: 960px) {
            .desktop-only {
              display: none !important;
            }
          }

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
          .ui.table thead td {
            padding: 0.8em 1em !important;
          }

          /* Add proper spacing for table cells */
          .ui.table tbody td {
            padding: 0.8em 0.5em !important;
            vertical-align: middle;
            font-weight: bold;
          }

          /* Add proper spacing for the task title cell */
          .ui.table td:nth-child(2) {
            padding-left: 1em !important;
          }

          /* Add task input styling */
          .header-task-input input {
            border: 1px solid transparent !important;
            transition: border-color 0.2s ease;
          }

          .header-task-input input:focus {
            border: 1px solid rgba(34, 36, 38, 0.15) !important;
          }

          .load-more-row:hover {
            background-color: rgba(0, 0, 0, 0.03) !important;
          }

          .load-more-row td {
            color: rgba(0, 0, 0, 0.6);
            font-weight: normal !important;
            padding: 0.5em !important;
          }

          .create-task-modal {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
          }

          .create-task-modal input[type="datetime-local"] {
            padding: 0.67857143em 1em;
          }

          .create-task-modal textarea {
            font-family: inherit;
            line-height: 1.4;
            padding: 0.67857143em 1em;
          }

          .create-task-modal .field {
            margin-bottom: 1em !important;
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
