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
      attachFile: null,
    };
    this.fileInputRef = React.createRef();
  }

  componentDidUpdate(prevProps) {
    if (this.props.attachFile !== prevProps.attachFile) {
      this.setState({ attachFile: this.props.attachFile });
    }
    if (this.props.note !== prevProps.note) {
      this.setState({ note: this.props.note });
    }
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
        this.setState({ attachFile: file });
      }
    }
  };

  handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      const file = files[0]; // Take only the first file
      this.setState({ attachFile: file });
    }
  };


  handleChange = (e, { value }) => {
    this.setState({ note: value });
  };

  handleSubmit = () => {
    // TO DO: HANDLE FILE FORMATS, SECURITY
    this.props.onSubmit(this.state.note, this.state.attachFile);
    console.log('Submitting:', this.state.note, this.state.attachFile); // Debugging log
  };

  handleClose = () => {
    if (!this.props.attachFile) {
      this.setState({ attachFile: null, });
    }
    if (!this.props.note) {
      this.setState({ note: null, });
    }
    this.props.onClose();
  }
  removeFile = () => {
    this.setState({ attachFile: null });
    this.props.deleteFile();
  };

  render() {
    const { open } = this.props;
    return (
      <Modal open={open} onClose={this.handleClose} size="tiny">
        <Modal.Header>Add File or Note</Modal.Header>
        <Modal.Content>
          {(this.state.attachFile) && (
            <Header as='h4' onClick={this.removeFile} style={{ cursor: 'pointer' }}>
              <Icon name='close' />
              Remove file
            </Header>
          )}
          <div
            onClick={() => this.fileInputRef.current && this.fileInputRef.current.click()}
            onDragOver={this.handleDragOver}
            onDrop={this.handleDrop}
            className='attach-file-area'
          >
            {(this.state.attachFile) ? (
              <div className='file-container'>
                <Icon name='file alternate' size='big' />
                <p>{this.state.attachFile.name}</p>
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
            // disabled={this.state.note}
            />
          </div>
          <Divider horizontal>Or</Divider>
          <Form>
            <Form.TextArea
              label="Note"
              placeholder="Write a note..."
              value={this.state.note}
              onChange={this.handleChange}
            // disabled={(this.state.attachFile)}
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
