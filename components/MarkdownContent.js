'use strict';

const React = require('react');
const marked = require('marked');
const merge = require('lodash.merge');
const debounce = require('lodash.debounce');
const TextareaAutosize = require('react-textarea-autosize').default;

const {
  Button,
  Icon,
  Popup
} = require('semantic-ui-react');

class MarkdownContent extends React.Component {
  constructor(props = {}) {
    super(props);

    this.settings = merge({
      state: {
        status: 'INITIALIZED',
        editMode: false,
        previewMode: false,
        currentContent: props.content || ''
      }
    }, props);

    this.state = this.settings.state;
    this.editorRef = React.createRef();

    this.handleContentChange = debounce(this.handleContentChange.bind(this), 1000);
    this.handleTextareaChange = this.handleTextareaChange.bind(this);
    return this;
  }

  componentDidMount () {
    this.setState({ status: 'READY' });
  }

  componentDidUpdate (prevProps) {
    // Reset previewMode when switching out of edit mode (either external or internal)
    const wasInEditMode = prevProps.externalEditMode === true || (prevProps.externalEditMode === undefined && this.state.editMode);
    const isInEditMode = this.props.externalEditMode === true || (this.props.externalEditMode === undefined && this.state.editMode);

    if (wasInEditMode && !isInEditMode) {
      this.setState({ previewMode: false });
    }

    // Update local content state when content prop changes
    if (prevProps.content !== this.props.content) {
      this.setState({ currentContent: this.props.content || '' });
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

  insertMarkdownSyntax = (syntax, wrapper = false) => {
    const editor = this.editorRef.current;
    if (!editor) return;

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const text = editor.value;
    const selectedText = text.substring(start, end);

    let newText;
    if (wrapper) {
      newText = text.substring(0, start) +
        syntax[0] + selectedText + syntax[1] +
        text.substring(end);
    } else {
      newText = text.substring(0, start) +
        (start === end ? syntax : syntax + selectedText) +
        text.substring(end);
    }

    editor.value = newText;
    this.handleContentChange({ target: { value: newText }});
    
    // Restore focus and selection
    editor.focus();
    if (start === end) {
      editor.selectionEnd = start + syntax.length;
    } else if (wrapper) {
      editor.selectionEnd = end + syntax[0].length + syntax[1].length;
    } else {
      editor.selectionEnd = end + syntax.length;
    }
  }

  renderEditingToolbar = () => {
    return (
      <Button.Group size='small' style={{ marginBottom: '1em' }}>
        <Popup
          content='Bold'
          trigger={
            <Button icon onClick={() => this.insertMarkdownSyntax('**', true)}>
              <Icon name='bold' />
            </Button>
          }
        />
        <Popup
          content='Italic'
          trigger={
            <Button icon onClick={() => this.insertMarkdownSyntax('*', true)}>
              <Icon name='italic' />
            </Button>
          }
        />
        <Popup
          content='Header'
          trigger={
            <Button icon onClick={() => this.insertMarkdownSyntax('### ')}>
              <Icon name='header' />
            </Button>
          }
        />
        <Popup
          content='Link'
          trigger={
            <Button icon onClick={() => this.insertMarkdownSyntax('[]()', true)}>
              <Icon name='linkify' />
            </Button>
          }
        />
        <Popup
          content='Code'
          trigger={
            <Button icon onClick={() => this.insertMarkdownSyntax('`', true)}>
              <Icon name='code' />
            </Button>
          }
        />
        <Popup
          content='Toggle Preview'
          trigger={
            <Button icon onClick={() => this.setState(prev => ({ previewMode: !prev.previewMode }))}>
              <Icon name='eye' />
            </Button>
          }
        />
      </Button.Group>
    );
  }

  render () {
    const { content, editable = true, hideEditButton = false, externalEditMode, onEditModeChange } = this.props;
    const { editMode, previewMode } = this.state;

    // Use external edit mode if provided, otherwise use internal state
    const currentEditMode = externalEditMode !== undefined ? externalEditMode : editMode;

    // Only use previewMode when actually in edit mode
    const showPreview = currentEditMode && previewMode;
    const handleEditToggle = () => {
      if (externalEditMode !== undefined && onEditModeChange) {
        // Use external control
        onEditModeChange(!externalEditMode);
      } else {
        // Use internal state
        this.setState(prev => ({ editMode: !prev.editMode, previewMode: false }));
      }
    };

    return (
      <fabric-markdown-content>
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
        {currentEditMode ? (
          <div style={{ clear: 'both' }}>
            {this.renderEditingToolbar()}
            {!showPreview ? (
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
              <div className="markdown-preview" style={{ padding: '1em', border: '1px solid #ddd', borderRadius: '4px', clear: 'both' }}>
                <div dangerouslySetInnerHTML={{ __html: marked.parse(content || '') }} />
              </div>
            )}
          </div>
        ) : (
          <div className="markdown-content" style={{ clear: 'both' }}>
            <div dangerouslySetInnerHTML={{ __html: marked.parse(content || '') }} />
          </div>
        )}
      </fabric-markdown-content>
    );
  }
}

module.exports = MarkdownContent;
