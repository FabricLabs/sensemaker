'use strict';

const React = require('react');
const merge = require('lodash.merge');
const debounce = require('lodash.debounce');

const {
  Button,
  Icon,
  Input,
  List,
  Message,
  ButtonGroup,
  Popup
} = require('semantic-ui-react');

class ListContent extends React.Component {
  constructor(props = {}) {
    super(props);

    // Parse content as JSON array or use empty array
    let items = [];
    try {
      if (props.content) {
        items = typeof props.content === 'string' ? JSON.parse(props.content) : props.content;
        if (!Array.isArray(items)) items = [];
      }
    } catch (error) {
      console.warn('Failed to parse list content:', error);
      items = [];
    }

    this.settings = merge({
      state: {
        status: 'INITIALIZED',
        editMode: false,
        currentItems: items,
        newItemText: '',
        error: null,
        contentHistory: [], // Track content history for undo
        isImproving: false // Track AI improvement status
      }
    }, props);

    this.state = this.settings.state;

    // Debounce content changes to prevent excessive updates
    this.handleContentChange = debounce(this.handleContentChange.bind(this), 1000);
    this.handleAddItem = this.handleAddItem.bind(this);
    this.handleRemoveItem = this.handleRemoveItem.bind(this);
    this.handleMoveItem = this.handleMoveItem.bind(this);
    this.handleEditItem = this.handleEditItem.bind(this);
    this.handleImproveWithAI = this.handleImproveWithAI.bind(this);
    this.handleUndo = this.handleUndo.bind(this);

    return this;
  }

  componentDidMount() {
    this.setState({ status: 'READY' });
  }

  componentDidUpdate(prevProps) {
    // Update local content state when content prop changes
    if (prevProps.content !== this.props.content) {
      let items = [];
      try {
        if (this.props.content) {
          items = typeof this.props.content === 'string' ? JSON.parse(this.props.content) : this.props.content;
          if (!Array.isArray(items)) items = [];
        }
      } catch (error) {
        console.warn('Failed to parse list content:', error);
        items = [];
      }
      this.setState({ currentItems: items });
    }

    // Reset error state when edit succeeds
    if (prevProps.error !== this.props.error) {
      this.setState({ error: this.props.error });
    }
  }

  handleContentChange() {
    const contentString = JSON.stringify(this.state.currentItems);
    if (this.props.onContentChange) {
      this.props.onContentChange(contentString);
    }
  }

  handleAddItem = () => {
    if (!this.state.newItemText.trim()) return;

    this.setState(prev => ({
      contentHistory: [...prev.contentHistory, [...prev.currentItems]],
      currentItems: [...prev.currentItems, this.state.newItemText.trim()],
      newItemText: ''
    }), () => {
      this.handleContentChange();
    });
  };

  handleRemoveItem = (index) => {
    this.setState(prev => ({
      contentHistory: [...prev.contentHistory, [...prev.currentItems]],
      currentItems: prev.currentItems.filter((_, i) => i !== index)
    }), () => {
      this.handleContentChange();
    });
  };

  handleMoveItem = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    this.setState(prev => {
      const newItems = [...prev.currentItems];
      const [moved] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, moved);

      return {
        contentHistory: [...prev.contentHistory, [...prev.currentItems]],
        currentItems: newItems
      };
    }, () => {
      this.handleContentChange();
    });
  };

  handleEditItem = (index, newText) => {
    this.setState(prev => {
      const newItems = [...prev.currentItems];
      newItems[index] = newText;

      return {
        contentHistory: [...prev.contentHistory, [...prev.currentItems]],
        currentItems: newItems
      };
    }, () => {
      this.handleContentChange();
    });
  };

  handleImproveWithAI = async () => {
    if (this.state.isImproving) return;

    try {
      this.setState({ isImproving: true });
      // Save current content to history
      this.setState(prev => ({
        contentHistory: [...prev.contentHistory, [...prev.currentItems]]
      }));

      const response = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + this.props.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant. Improve the following list by making items more clear, concise, and well-organized. Fix any typos or grammar issues. Return only the improved list items as a JSON array.'
            },
            {
              role: 'user',
              content: JSON.stringify(this.state.currentItems)
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to improve list');
      }

      const result = await response.json();
      let improvedItems;
      try {
        improvedItems = JSON.parse(result.choices[0].message.content);
        if (!Array.isArray(improvedItems)) {
          throw new Error('AI did not return a valid array');
        }
      } catch (error) {
        throw new Error('AI returned invalid JSON');
      }

      this.setState({ currentItems: improvedItems }, () => {
        this.handleContentChange();
      });
    } catch (error) {
      this.setState({ error: { message: 'Failed to improve list: ' + error.message } });
    } finally {
      this.setState({ isImproving: false });
    }
  };

  handleUndo = () => {
    this.setState(prev => {
      if (prev.contentHistory.length === 0) return prev;

      const previousItems = prev.contentHistory[prev.contentHistory.length - 1];
      const newHistory = prev.contentHistory.slice(0, -1);

      return {
        currentItems: previousItems,
        contentHistory: newHistory
      };
    }, () => {
      this.handleContentChange();
    });
  };

  handleDismissError = () => {
    this.setState({ error: null });
  };

  renderViewMode() {
    const { currentItems } = this.state;

    if (!currentItems.length) {
      return (
        <Message info>
          <Message.Header>Empty List</Message.Header>
          <p>This list contains no items. Click Edit to add items.</p>
        </Message>
      );
    }

    return (
      <List ordered style={{ marginTop: '1em' }}>
        {currentItems.map((item, index) => (
          <List.Item key={index} style={{ marginBottom: '0.5em' }}>
            {this.renderListItem ? this.renderListItem(item, index) : item}
          </List.Item>
        ))}
      </List>
    );
  }

  renderEditMode() {
    const { currentItems, newItemText, isImproving, contentHistory } = this.state;

    return (
      <div style={{ marginTop: '1em' }}>
        {/* Add Item Controls */}
        <div style={{ marginBottom: '1em', display: 'flex', gap: '0.5em' }}>
          <Input
            fluid
            placeholder="Add new item..."
            value={newItemText}
            onChange={(e) => this.setState({ newItemText: e.target.value })}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                this.handleAddItem();
              }
            }}
          />
          <Button primary onClick={this.handleAddItem} disabled={!newItemText.trim()}>
            <Icon name='plus' /> Add
          </Button>
        </div>

        {/* AI and Undo Controls */}
        <div style={{ marginBottom: '1em' }}>
          <ButtonGroup>
            <Button
              loading={isImproving}
              disabled={isImproving || currentItems.length === 0}
              onClick={this.handleImproveWithAI}
            >
              <Icon name='magic' /> Improve with AI
            </Button>
            <Button
              disabled={contentHistory.length === 0}
              onClick={this.handleUndo}
            >
              <Icon name='undo' /> Undo
            </Button>
          </ButtonGroup>
        </div>

        {/* List Items */}
        {currentItems.length > 0 ? (
          <List divided style={{ marginTop: '1em' }}>
            {currentItems.map((item, index) => (
              <List.Item key={index} style={{ padding: '0.75em 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                  <span style={{ minWidth: '2em', color: '#666' }}>{index + 1}.</span>
                  <Input
                    fluid
                    value={item}
                    onChange={(e) => this.handleEditItem(index, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <ButtonGroup size='mini'>
                    <Popup content="Move Up" trigger={
                      <Button
                        icon='arrow up'
                        disabled={index === 0}
                        onClick={() => this.handleMoveItem(index, index - 1)}
                      />
                    } />
                    <Popup content="Move Down" trigger={
                      <Button
                        icon='arrow down'
                        disabled={index === currentItems.length - 1}
                        onClick={() => this.handleMoveItem(index, index + 1)}
                      />
                    } />
                    <Popup content="Remove Item" trigger={
                      <Button
                        icon='trash'
                        color='red'
                        onClick={() => this.handleRemoveItem(index)}
                      />
                    } />
                  </ButtonGroup>
                </div>
              </List.Item>
            ))}
          </List>
        ) : (
          <Message info>
            <Message.Header>No Items</Message.Header>
            <p>Add items using the input field above.</p>
          </Message>
        )}
      </div>
    );
  }

  render() {
    const { editable = true, hideEditButton = false, externalEditMode, onEditModeChange } = this.props;
    const { editMode, error } = this.state;

    // Use external edit mode if provided, otherwise use internal state
    const currentEditMode = externalEditMode !== undefined ? externalEditMode : editMode;

    const handleEditToggle = () => {
      if (externalEditMode !== undefined && onEditModeChange) {
        // Use external control
        onEditModeChange(!externalEditMode);
      } else {
        // Use internal state
        this.setState(prev => ({ editMode: !prev.editMode }));
      }
    };

    return (
      <fabric-list-content>
        {editable && !hideEditButton && (
          <div style={{ float: 'right', marginBottom: '1em' }}>
            <Button
              icon
              labelPosition='left'
              onClick={handleEditToggle}
            >
              <Icon name='edit' />
              {currentEditMode ? 'View' : 'Edit'}
            </Button>
          </div>
        )}
        <div style={{ clear: 'both' }}>
          {error && (
            <Message negative onDismiss={this.handleDismissError}>
              <Message.Header>Error</Message.Header>
              <p>{error.content || error.message || 'An error occurred while editing the list.'}</p>
            </Message>
          )}
          {currentEditMode ? this.renderEditMode() : this.renderViewMode()}
        </div>
      </fabric-list-content>
    );
  }
}

module.exports = ListContent;