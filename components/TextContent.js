'use strict';

const React = require('react');
const merge = require('lodash.merge');
const debounce = require('lodash.debounce');
const TextareaAutosize = require('react-textarea-autosize').default;

const {
  Button,
  Icon,
  Message
} = require('semantic-ui-react');

class TextContent extends React.Component {
  constructor (props = {}) {
    super(props);

    this.settings = merge({
      state: {
        status: 'INITIALIZED',
        editMode: false,
        currentContent: props.content || '',
        error: null
      }
    }, props);

    this.state = this.settings.state;
    this.editorRef = React.createRef();

    // Debounce content changes to prevent excessive updates
    this.handleContentChange = debounce(this.handleContentChange.bind(this), 1000);
    this.handleTextareaChange = this.handleTextareaChange.bind(this);

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
    // Update local state immediately for responsive typing
    this.setState({ currentContent: newContent });
    // Debounce the callback to parent
    this.handleContentChange(event);
  };

  handleDismissError = () => {
    this.setState({ error: null });
  };

  render () {
    const { content, editable = true, hideEditButton = false, externalEditMode, onEditModeChange } = this.props;
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