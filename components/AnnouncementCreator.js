'use strict';

// Dependencies
const React = require('react');
const marked = require('marked');
const $ = require('jquery');
const store = require('../stores/redux');

// Semantic UI
const {
  Button,
  Form,
  Header,
  Icon,
  Message,
  Segment,
  Container,
  Modal
} = require('semantic-ui-react');

class AnnouncementCreator extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      username: '',
      password: '',
      title: '',
      body: '',
      modalOpen: false,
      modalLoading: false,
      connectionProblem: false,
      announFail: false,
      announSent: false,
      errorMessage: ''
    };

  }

  componentDidUpdate(prevProps) {
    // If a new login request has been initiated or an error has occurred, stop loading
    if ((this.props.error === null && prevProps.error !== null) || (this.props.error && prevProps.error !== this.props.error)) {
      this.setState({ loading: false });
    }
  }
  handleTitleChange = (event) => {
    this.setState({ title: event.target.value });
  };

  handleBodyChange = (event) => {
    this.setState({ body: event.target.value });   
  };

  handleSubmit = async (event) => {
    event.preventDefault();
    const { title, body } = this.state;

    if (title || body) {
      this.setState({ modalOpen: true });
    }
  };

  handleClear = (event) => {
    event.preventDefault();
    this.setState({ title: '', body: '' });
  }
  handleModalClose = () => {
    this.setState({
      modalOpen: false,
      modalLoading: false,
      connectionProblem: false,
      announFail: false,
      announSent: false,
      errorMessage: ''
    });
  }
  handleModalSend = async () => {

    const { title, body, } = this.state;
    const state = store.getState();
    const token = state.auth.token;

    const dataToSend = {
      title,
      body
    };

    this.setState({ modalLoading: true });

    const fetchPromise = fetch('/announcements', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    });
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Fetch timed out'));
      }, 15000);
    });
    try {
      const response = await Promise.race([timeoutPromise, fetchPromise]);
      if (response.ok) {
        //forced delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        this.setState({
          announSent: true,
          announFail: false,
          modalLoading: false,
          connectionProblem: false,
        });

      } else {
        this.setState({
          announSent: false,
          announFail: true,
          modalLoading: false,
          connectionProblem: false,
          errorMessage: 'API request failed with status:' + response.status
        });
        console.error('API request failed with status:', response.status);
      }

    } catch (error) {
      if (error.message === 'Fetch timed out') {
        this.setState({
          announSent: false,
          announFail: false,
          modalLoading: false,
          connectionProblem: true,
        });
      }
    }
  }

  render() {

    const {
      title,
      body,
      loading,
      modalLoading,
      modalOpen,
      announSent,
      announFail,
      connectionProblem,
      errorMessage
    } = this.state;


    return (
      <Container fluid style={{ paddingTop: '2em', }}>
        <Header as='h4'>Create an Announcement - Markdown is allowed</Header>
        <Segment>
          <Form fluid onSubmit={this.handleSubmit} method='POST' autocomplete='off'>
            <Form.Field>
              <label>Title (optional)</label>
              <input placeholder='Title' name='title' autoComplete='title' value={title} onChange={this.handleTitleChange} />
            </Form.Field>
            <Form.Field>
              <label><p>Body</p></label>
              <Form.TextArea placeholder='Write your announcement here' style={{ minHeight: '8em' }} value={body} onChange={this.handleBodyChange} required={true} />
            </Form.Field>
            <Button primary loading={loading} type='submit' size='small' style={{ width: '7em' }} >Submit</Button>
            <Button loading={loading} size='small' onClick={this.handleClear} style={{ width: '7em' }} >Clear</Button>
          </Form>
          {(title || body) && (
            <div style={{ paddingTop: '2em', }}>
              <label>Preview</label>
              <Message info>
                <Message.Header>
                  <span dangerouslySetInnerHTML={{ __html: marked.parse(title) }} />
                </Message.Header>
                <Message.Content>
                  <span dangerouslySetInnerHTML={{ __html: marked.parse(body) }} />
                </Message.Content>
              </Message>
            </div>
          )
          }
        </Segment>
        <Modal
          onClose={this.handleModalClose}
          onOpen={() => this.setState({ modalOpen: true })}
          open={modalOpen}
          size='mini'>
          <Modal.Header>
            Publishing&nbsp;
            <Icon name='announcement' />
          </Modal.Header>
          <Modal.Content>
            <Modal.Description>
              <p>Do you want to publish this announcement?</p>
            </Modal.Description>
          </Modal.Content>
          <Modal.Actions>
            {/*When the feedback is sent it shows this message  */}
            {announSent && (
              <Message positive>
                <Message.Header>Announcement published!</Message.Header>
                <p>Your announcement has been successfully published.</p>
              </Message>
            )}
            {/*When the feedback could not be sent it shows this message  */}
            {announFail && (
              <Message error>
                <Message.Header>Announcement could not be published</Message.Header>
                <p>{errorMessage}</p>
              </Message>
            )}
            {connectionProblem && (
              <Message error>
                <Message.Header>Announcement could not be published</Message.Header>
                <p>Please check your internet connection.</p>
              </Message>
            )}
            <Button
              content='Close'
              icon='close'
              onClick={this.handleModalClose}
              labelPosition='right'
              size='small'
              secondary
            />
            {/*This button is shown only if Feedback wasnt sent yet */}
            {!announSent && (
              <Button
                content='Publish'
                icon={modalLoading ? 'spinner' : 'checkmark'}
                onClick={this.handleModalSend}
                labelPosition='right'
                size='small'
                loading={modalLoading}
                positive
              />)}
          </Modal.Actions>
        </Modal>
      </Container>
    );
  }
}

module.exports = AnnouncementCreator;