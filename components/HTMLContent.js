'use strict';

const React = require('react');
const merge = require('lodash.merge');
const debounce = require('lodash.debounce');
const TextareaAutosize = require('react-textarea-autosize').default;

const {
  Button,
  Icon,
  Message,
  ButtonGroup,
  Popup
} = require('semantic-ui-react');

class HTMLContent extends React.Component {
  constructor (props = {}) {
    super(props);

    this.settings = merge({
      state: {
        status: 'INITIALIZED',
        editMode: false,
        previewMode: false,
        currentContent: props.content || '',
        error: null,
        contentHistory: [], // Track content history for undo
        isImproving: false // Track AI improvement status
      }
    }, props);

    this.state = this.settings.state;
    this.editorRef = React.createRef();

    // Debounce content changes to prevent excessive updates
    this.handleContentChange = debounce(this.handleContentChange.bind(this), 1000);
    this.handleTextareaChange = this.handleTextareaChange.bind(this);
    this.handleImproveWithAI = this.handleImproveWithAI.bind(this);
    this.handleUndo = this.handleUndo.bind(this);

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
              content: 'You are an AI HTML assistant. Improve the following HTML while maintaining its structure and functionality. Make it more semantic, accessible, and well-formed. Ensure proper HTML5 structure and fix any syntax issues.'
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

  // Sanitize HTML to prevent XSS attacks
  sanitizeHTML = (html) => {
    // Basic HTML sanitization - in production, consider using a library like DOMPurify
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };

  render () {
    const { content, editable = true, hideEditButton = false, externalEditMode, onEditModeChange } = this.props;
    const { editMode, previewMode, error } = this.state;

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

    const handlePreviewToggle = () => {
      this.setState(prev => ({ previewMode: !prev.previewMode }));
    };

    return (
      <fabric-html-content>
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
            <>
              <div style={{ marginBottom: '1em' }}>
                <ButtonGroup>
                  <Button
                    icon
                    labelPosition='left'
                    onClick={handlePreviewToggle}
                    active={showPreview}
                  >
                    <Icon name={showPreview ? 'code' : 'eye'} />
                    {showPreview ? 'Code' : 'Preview'}
                  </Button>
                </ButtonGroup>
              </div>

              {showPreview ? (
                <div className="html-preview" style={{
                  padding: '1em',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#f9f9f9',
                  minHeight: '200px',
                  marginBottom: '1em'
                }}>
                  <div style={{ marginBottom: '0.5em', fontSize: '0.9em', color: '#666', borderBottom: '1px solid #ddd', paddingBottom: '0.5em' }}>
                    <Icon name='eye' />
                    HTML Preview
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: this.sanitizeHTML(this.state.currentContent) }} />
                </div>
              ) : (
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
                    marginBottom: '1em'
                  }}
                  placeholder="Enter HTML content..."
                />
              )}

              <div style={{ display: 'flex', gap: '1em' }}>
                <ButtonGroup>
                  <Button
                    icon
                    labelPosition='left'
                    onClick={this.handleImproveWithAI}
                    loading={this.state.isImproving}
                    disabled={this.state.isImproving}
                  >
                    <Icon name='magic' />
                    Improve with AI
                  </Button>
                  <Button
                    icon
                    labelPosition='left'
                    onClick={this.handleUndo}
                    disabled={this.state.contentHistory.length === 0}
                  >
                    <Icon name='undo' />
                    Undo
                  </Button>
                </ButtonGroup>
              </div>
            </>
          ) : (
            <div className="html-content">
              <div style={{ marginBottom: '0.5em', fontSize: '0.9em', color: '#666', borderBottom: '1px solid #ddd', paddingBottom: '0.5em' }}>
                <Icon name='code' />
                HTML Content
                <Popup
                  trigger={<Icon name='info circle' style={{ marginLeft: '0.5em', cursor: 'help' }} />}
                  content="This content is rendered as HTML. Scripts and dangerous attributes have been sanitized for security."
                  position="top center"
                />
              </div>
              <div style={{
                clear: 'both',
                padding: '1em',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#fff',
                minHeight: '100px'
              }}>
                <div dangerouslySetInnerHTML={{ __html: this.sanitizeHTML(content || '') }} />
              </div>
            </div>
          )}
        </div>
      </fabric-html-content>
    );
  }
}

module.exports = HTMLContent;
