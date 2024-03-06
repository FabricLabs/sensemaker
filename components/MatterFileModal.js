'use strict';

// Dependencies
const React = require('react');

// Components
const {
  Button,
  Form,
  Modal,
  Icon,
  Divider,
  Header
} = require('semantic-ui-react');

// Actions
const {
  postAPI
} = require('../actions/apiActions');

class MatterFileModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      note: '',
      filename: null,
      file: null
    };
    this.fileInputRef = React.createRef();
  }

  componentDidUpdate(prevProps) {
    if (this.props.filename !== prevProps.filename) {
      this.setState({ filename: this.props.filename });
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
        this.setState({ filename: file.name, file: file });
      }
    }
  };

  handleFileChange = async (e) => {
    const files = e.target.files;

    if (files.length > 0) {
      const file = files[0]; // Take only the first file
      const data = new FormData();

      console.debug('File:', file.name, file.size, file.type); // Debugging log
      this.setState({ filename: file.name, file: file });

      // data.append('filename', file.name);
      // data.append('size', file.size);
      // data.append('type', file.type);
      // data.append('file', file);

      // const blob = new Blob([file], { type: file.type });

      data.append('name', file.name);
      data.append('file', file);

      // postAPI('/files', data, this.props.auth.token);

     const reponse = await fetch('/files', {
        headers: {
          'Authorization': `Bearer ${this.props.auth.token}`,
          // 'Content-Type': 'multipart/form-data',
        },
        method: 'POST',
        body: data
      });
      const respuesta = await reponse.json();
      console.log(respuesta);
    }
  };

  handleChange = (e, { value }) => {
    this.setState({ note: value });
  };

  handleSubmit = () => {
    // TO DO: HANDLE FILE FORMATS, SECURITY, ERRORS
    this.props.onSubmit(this.state.note, this.state.filename, this.state.file);
   // console.log('Submitting:', this.state.note, this.state.filename); // Debugging log
    this.setState({
      note: '',
      filename: null,
      file: null
    });
  };
  handleOpen = () => {
    this.setState({
      note: '',
      filename: null,
      file: null
    });
  }

  handleClose = () => {
    if (!this.props.filename) {
      this.setState({ filename: null, });
    }
    if (!this.props.note) {
      this.setState({ note: null, });
    }
    this.setState({
      note: '',
      filename: null,
      file: null
    });
    this.props.onClose();
  }

  removeFile = () => {
    this.setState({ filename: null, file: null });
    //this.props.deleteFile();
  };

  render() {
    const { open } = this.props;
    return (
      <Modal open={open} onOpen={this.handleOpen} onClose={this.handleClose} size="tiny">
        <Modal.Header>Add File or Note</Modal.Header>
        <Modal.Content>
          {(this.state.filename) && (
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
            {(this.state.filename) ? (
              <div className='file-container'>
                <Icon name='file alternate' size='big' />
                <p>{this.state.filename}</p>
              </div>
            ) : (
              <div>
                <Icon name='upload' size='big' />
                <p>Drag and drop files here or click to upload</p>
              </div>
            )}
            <input
              name='file'
              type="file"
              ref={this.fileInputRef}
              onChange={this.handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
          <Divider horizontal>Or</Divider>
          <Form>
            <Form.TextArea
              label="Note"
              placeholder="Write a note..."
              value={this.state.note}
              onChange={this.handleChange}
            // disabled={(this.state.filename)}
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
