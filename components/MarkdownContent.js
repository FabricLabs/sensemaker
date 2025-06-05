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
        previewMode: false
      }
    }, props);

    this.state = this.settings.state;
    this.editorRef = React.createRef();

    this.handleContentChange = debounce(this.handleContentChange.bind(this), 1000);
    return this;
  }

  componentDidMount () {
    this.setState({ status: 'READY' });
  }

  handleContentChange (event) {
    const newContent = event.target.value;
    if (this.props.onContentChange) {
      this.props.onContentChange(newContent);
    }
  }

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
    const { content, editable = true } = this.props;
    const { editMode, previewMode } = this.state;

    return (
      <fabric-markdown-content>
        {editable && (
          <div style={{ float: 'right', marginBottom: '1em' }}>
            <Button
              icon
              labelPosition='left'
              onClick={() => this.setState(prev => ({ editMode: !prev.editMode, previewMode: false }))}
            >
              <Icon name='edit' />
              {editMode ? 'View' : 'Edit'}
            </Button>
          </div>
        )}
        {editMode ? (
          <div style={{ margin: '1em 0', clear: 'both' }}>
            {this.renderEditingToolbar()}
            {!previewMode ? (
              <TextareaAutosize
                ref={this.editorRef}
                defaultValue={content}
                onChange={this.handleContentChange}
                minRows={10}
                style={{
                  width: '100%',
                  padding: '1em',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  lineHeight: '1.6'
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
