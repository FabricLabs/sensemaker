'use strict';

const React = require('react');

const {
  Button,
  Form,
  Modal,
  Icon,
  Divider,
  Header
} = require('semantic-ui-react');


class MatterFileModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      note: '',
      files: [],
    };
    this.fileInputRef = React.createRef();
  }

  handleDragOver = (e) => {
    e.preventDefault();
  };

  handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!this.state.note) {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0]; // Take only the first file
        this.setState({ files: [file] });
      }
    }
  };

  handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      const file = files[0]; // Take only the first file
      this.setState({ files: [file] });
    }
  };


  handleChange = (e, { value }) => {
    this.setState({ note: value });
  };

  handleSubmit = () => {
    this.props.onSubmit(this.state.note, this.state.files);
    // Reset the state
    this.setState({ note: '', files: [] });
    console.log('Submitting:', this.state.note, this.state.files); // Debugging log
  };

  handleClose = () => {
    this.setState({
      note: '',
      files: [],
    });
    this.props.onClose();
  }
  removeFile = () => {
    this.setState({ files: [] });
  };

  render() {
    const { open } = this.props;
    return (
      <Modal open={open} onClose={this.handleClose} size="tiny">
        <Modal.Header>Add File or Note</Modal.Header>
        <Modal.Content>
          {(this.state.files.length > 0) && (
            <Header as='h4' onClick={this.removeFile} style={{ cursor: 'pointer' }}>
              <Icon name='close' />
              Remove file
            </Header>
          )}
          <div
            onClick={() => this.fileInputRef.current && this.fileInputRef.current.click()}
            onDragOver={this.handleDragOver}
            onDrop={this.handleDrop}
            className={`attach-file-area ${this.state.note ? 'disabled-attach' : ''}`}
          >
            {(this.state.files.length > 0) ? (
              <div className='file-container'>
                <Icon name='file alternate' size='big' />
                <p>{this.state.files[0].name}</p>
              </div>
            ) : (
              <div>
                <Icon name='upload' size='big' />
                <p>Drag and drop files here or click to upload</p>
              </div>
            )}

            <input
              type="file"
              ref={this.fileInputRef}
              onChange={this.handleFileChange}
              style={{ display: 'none' }}
              disabled={this.state.note}
            />
          </div>
          <Divider horizontal>Or</Divider>
          <Form>
            <Form.TextArea
              label="Note"
              placeholder="Write a note..."
              value={this.state.note}
              onChange={this.handleChange}
              disabled={(this.state.files.length > 0)}
            />
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={this.handleClose}>Cancel</Button>
          <Button primary onClick={this.handleSubmit}>Add</Button>
        </Modal.Actions>
      </Modal>
    );
  }
}



module.exports = MatterFileModal;
