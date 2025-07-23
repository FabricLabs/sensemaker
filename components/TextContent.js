'use strict';

const React = require('react');
const merge = require('lodash.merge');
const debounce = require('lodash.debounce');
const TextareaAutosize = require('react-textarea-autosize').default;

const {
  Button,
  Icon,
  Message,
  ButtonGroup
} = require('semantic-ui-react');

class TextContent extends React.Component {
  constructor (props = {}) {
    super(props);

    this.settings = merge({
      state: {
        status: 'INITIALIZED',
        editMode: false,
        currentContent: props.content || '',
        error: null,
        contentHistory: [], // Track content history for undo
        isImproving: false, // Track AI improvement status
        isSaving: false // Track save status
      }
    }, props);

    this.state = this.settings.state;
    this.editorRef = React.createRef();

    // Debounce content changes to prevent excessive updates
    this.handleContentChange = debounce(this.handleContentChange.bind(this), 1000);
    this.handleTextareaChange = this.handleTextareaChange.bind(this);
    this.handleImproveWithAI = this.handleImproveWithAI.bind(this);
    this.handleUndo = this.handleUndo.bind(this);
    this.handleSave = this.handleSave.bind(this);

    return this;
  }

  componentDidMount () {
    this.setState({ status: 'READY' });
  }

  componentDidUpdate (prevProps) {
    // Update local content state when content prop changes
    if (prevProps.content !== this.props.content) {
      this.setState({ currentContent: this.props.content || '' });
    }

    // Reset error state when edit succeeds
    if (prevProps.error !== this.props.error) {
      this.setState({ error: this.props.error });
    }
  }

  handleContentChange (event) {
    const newContent = event.target.value;
    if (this.props.onContentChange) {
      this.props.onContentChange(newContent);
    }
  }

  handleTextareaChange = (event) => {
    const newContent = event.target.value;
    // Save current content to history before updating
    this.setState(prev => ({
      currentContent: newContent,
      contentHistory: [...prev.contentHistory, prev.currentContent]
    }));
    // Debounce the callback to parent
    this.handleContentChange(event);
  };

  handleImproveWithAI = async () => {
    if (this.state.isImproving) return;

    try {
      this.setState({ isImproving: true });
      // Save current content to history
      this.setState(prev => ({
        contentHistory: [...prev.contentHistory, prev.currentContent]
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
              content: 'You are an AI writing assistant. Improve the following text while maintaining its core meaning and style. Make it more clear, concise, and engaging.'
            },
            {
              role: 'user',
              content: this.state.currentContent
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to improve content');
      }

      const result = await response.json();
      const improvedContent = result.choices[0].message.content;

      this.setState({ currentContent: improvedContent });
      if (this.props.onContentChange) {
        this.props.onContentChange(improvedContent);
      }
    } catch (error) {
      this.setState({ error: { message: 'Failed to improve content: ' + error.message } });
    } finally {
      this.setState({ isImproving: false });
    }
  };

  handleUndo = () => {
    this.setState(prev => {
      if (prev.contentHistory.length === 0) return prev;

      const previousContent = prev.contentHistory[prev.contentHistory.length - 1];
      const newHistory = prev.contentHistory.slice(0, -1);

      return {
        currentContent: previousContent,
        contentHistory: newHistory
      };
    });
  };

  handleDismissError = () => {
    this.setState({ error: null });
  };

  handleSave = async () => {
    if (this.state.isSaving) return;

    try {
      this.setState({ isSaving: true });

      // Call the onContentChange prop to save the content
      if (this.props.onContentChange) {
        await this.props.onContentChange(this.state.currentContent);
      }

      // Wait a moment for the save to process
      await new Promise(resolve => setTimeout(resolve, 500));

      // Exit edit mode after successful save
      if (this.props.externalEditMode !== undefined && this.props.onEditModeChange) {
        this.props.onEditModeChange(false);
      } else {
        this.setState({ editMode: false });
      }
    } catch (error) {
      this.setState({ error: { message: 'Failed to save content: ' + error.message } });
    } finally {
      this.setState({ isSaving: false });
    }
  };

  render () {
    const { content, editable = true, hideEditButton = false, externalEditMode, onEditModeChange } = this.props;
    const { editMode, error, isSaving } = this.state;

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
      <fabric-text-content>
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
              <p>{error.content || error.message || 'An error occurred while editing the content.'}</p>
            </Message>
          )}
          {currentEditMode ? (
            <div style={{
              position: 'relative',
              opacity: isSaving ? 0.5 : 1,
              transition: 'opacity 0.3s ease',
              pointerEvents: isSaving ? 'none' : 'auto'
            }}>
              {isSaving && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5em',
                  background: 'rgba(255, 255, 255, 0.9)',
                  padding: '1em',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <Icon name='spinner' loading />
                  Saving...
                </div>
              )}
              <TextareaAutosize
                ref={this.editorRef}
                value={this.state.currentContent}
                onChange={this.handleTextareaChange}
                minRows={10}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '1em',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  resize: 'vertical',
                  marginTop: '1em'
                }}
              />
              <div style={{ marginTop: '1em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <ButtonGroup>
                  <Button
                    icon
                    labelPosition='left'
                    onClick={this.handleImproveWithAI}
                    loading={this.state.isImproving}
                    disabled={this.state.isImproving || isSaving}
                  >
                    <Icon name='magic' />
                    Improve with AI
                  </Button>
                  <Button
                    icon
                    labelPosition='left'
                    onClick={this.handleUndo}
                    disabled={this.state.contentHistory.length === 0 || isSaving}
                  >
                    <Icon name='undo' />
                    Undo
                  </Button>
                </ButtonGroup>
                <Button
                  primary
                  icon
                  labelPosition='left'
                  onClick={this.handleSave}
                  loading={isSaving}
                  disabled={isSaving}
                >
                  <Icon name='save' />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-content" style={{
              clear: 'both',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: '1.6',
              padding: '1em',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}>
              {content || ''}
            </div>
          )}
        </div>
      </fabric-text-content>
    );
  }
}

module.exports = TextContent;
