'use strict';

const React = require('react');

const {
  Button,
  Form,
  Modal,
  Icon
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
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0]; // Take only the first file
      this.setState({ files: [file] });
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

  render() {
    const { open, onClose } = this.props;
    return (
      <Modal open={open} onClose={onClose} size="small">
        <Modal.Header>Add File or Note</Modal.Header>
        <Modal.Content>
          <div
            onClick={() => this.fileInputRef.current && this.fileInputRef.current.click()}
            onDragOver={this.handleDragOver}
            onDrop={this.handleDrop}
            style={{ border: '2px dashed #bbb', padding: '20px', textAlign: 'center', marginBottom: '20px', cursor: 'pointer' }}
          >
            {(this.state.files.length > 0) ? (
              <>
                <Icon name='file alternate outline' size='big'/>
                <p>{this.state.files[0].name}</p>
              </>
            ) : ('Drag and drop files here or click to upload')}

            <input
              type="file"
              ref={this.fileInputRef}
              onChange={this.handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
          <Form>
            <Form.TextArea
              label="Note"
              placeholder="Write a note..."
              value={this.state.note}
              onChange={this.handleChange}
            />
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={onClose}>Cancel</Button>
          <Button primary onClick={this.handleSubmit}>Add</Button>
        </Modal.Actions>
      </Modal>
    );
  }
}



module.exports = MatterFileModal;
