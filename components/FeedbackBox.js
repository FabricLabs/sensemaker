'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Button,
  Form,
  Header,
  Modal,
  Message,
} = require('semantic-ui-react');

class FeedbackBox extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {
      comment: '', //user feedback comment
      sending: false,
      feedbackSent: false,
      feedbackFail: false,
      errorMsg: '',
    };
  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps) {
    if (prevProps.feedback != this.props.feedback) {
      if (this.state.sending && !this.props.feedback.loading) {
        this.setState({
          feedbackFail: !this.props.feedback.sentSuccesfull,
          errorMsg: this.props.feedback.error,
          feedbackSent: this.props.feedback.sentSuccesfull,
        })
      }
    }
  };

  handleInputChange = (e, { name, value }) => {
    this.setState({ [name]: value });
  };

  handleClose = () => {
    this.resetState();
    this.props.toggleInformationSidebar();
  }

  resetState = () => {
    this.setState({
      comment: '', //user feedback comment
      sending: false,
      feedbackSent: false,
      feedbackFail: false,
      errorMsg: '',
    });
  }

  submitFeedback = () => {
    this.setState({ sending: true, feedbackFail: false, errorMsg: '', feedbackSent: false });
    this.props.sendFeedback(this.state.comment);
  }

  render() {
    const { sending, feedbackSent, feedbackFail, errorMsg } = this.state;

    return (
      <Modal
        onOpen={this.resetState}
        open={this.props.open}
        className='col-center'
        id='feedback-box'
        size='tiny'>

        <Modal.Header>Feedback</Modal.Header>
        <Modal.Content>
          <Header as='h4'>Leave us a message</Header>
          <Form>
            <Form.Field>
              <Modal.Actions>
                <Form.TextArea
                  rows={6}
                  placeholder='Enter your comment...'
                  style={{ resize: 'none' }}
                  name='comment'
                  onChange={this.handleInputChange} />
                {feedbackSent && (
                  <Message positive>
                    <Message.Header>Feedback Sent!</Message.Header>
                    <Message.Content>Your comment has been successfully sent.</Message.Content>
                  </Message>
                )}
                {/*When the feedback could not be sent it shows this message  */}
                {feedbackFail && (
                  <Message negative>
                    <Message.Header>Feedback could not be sent</Message.Header>
                    <p>{errorMsg}</p>
                  </Message>
                )}
                <Button.Group >
                  <Button
                    content="Close"
                    icon='close'
                    onClick={() => this.handleClose()}
                    labelPosition='right'
                    size='small'
                    secondary
                  />
                  {/*This button is shown only if Feedback wasnt sent yet */}
                  {(!feedbackSent && !feedbackFail) && (
                    <Button
                      content="Send"
                      icon={sending ? 'spinner' : 'checkmark'}
                      onClick={this.submitFeedback}
                      labelPosition='right'
                      size='small'
                      loading={this.props.feedback.loading}
                      disabled={!this.state.comment}
                      primary
                    />)}
                </Button.Group>
              </Modal.Actions>
            </Form.Field>
          </Form>
        </Modal.Content>
      </Modal>
    );
  }

}

module.exports = FeedbackBox;
