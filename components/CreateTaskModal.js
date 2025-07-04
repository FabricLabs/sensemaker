'use strict';

const React = require('react');

const {
    Button,
    Header,
    Segment,
    Table,
    Form,
    Modal,
    Message
  } = require('semantic-ui-react');

  class CreateTaskModal extends React.Component {
    constructor (props) {
      super(props);

      this.state = {
        allValid: true,
        createTaskModalLoading: false
      };
    }

  createTaskModalOpen = () =>{
    this.setState({
        allValid: true,
        createTaskModalLoading: false
      });
  }

  createTaskModalClose = () =>{
    this.props.toggleCreateTaskModal();
    this.setState({
        allValid: true,
        createTaskModalLoading: false
      });
  }


  // Handle input change
  handleInputChange = (e, { name, value }) => {
    this.setState({ [name]: value });
  };

  handleInputChange = (e, { name, value }) => {
    this.setState({ [name]: value }, () => {

    });
  };

  // Handle form submission
  handleSubmit = async () => {
    const { task } = this.state;
    const fetchPromise = fetch('/tasks', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.props.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task }),
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Fetch timed out"));
      }, 15000);
    });

    if (allValid) {
      try {
        this.setState({
          createTaskModalLoading:true
        });

        const response = await Promise.race([timeoutPromise, fetchPromise]);
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message);
        }

        //forced delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        this.setState({ createTaskModalLoading:false });

        setTimeout(() => {
          this.props.logout();
          window.location.href = '/';
        }, 2500)
      } catch (error) {
        //forced delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        this.setState({ createTaskModalLoading: false });
        console.log(error.message);
      }
    }

  };

  render() {
    const {
      allValid,
      createTaskModalLoading } = this.state;

      const {open} = this.props;

    return (
      <Modal open={open} onOpen={this.createTaskModalOpen} onClose={this.createTaskModalClose} size='medium'>
        <Modal.Header>Change Your Password</Modal.Header>
        <Modal.Content>
          <Form onSubmit={this.handlePasswordSubmit}>
            <Form.Input
              label='Task'
              type='text'
              name='task'
              onChange={this.handleInputChange}
              required
            />
            <Modal.Actions>
              <Button.Group>
                <Button
                  content='Close'
                  icon='close'
                  size='small'
                  secondary
                  onClick={this.createTaskModalClose}/>
                <Button
                  content='Create Task'
                  icon='right chevron'
                  loading={createTaskModalLoading}
                  type='submit' size='small'
                  primary
                  disabled={!allValid} />
              </Button.Group>
            </Modal.Actions>
          </Form>
        </Modal.Content>
      </Modal>
    );
  };
}


module.exports = CreateTaskModal;
