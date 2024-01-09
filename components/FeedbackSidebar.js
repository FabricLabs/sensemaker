'use strict';

const React = require('react');

const {
  Button,
  Header,
  Form,
  Message,
  Sidebar,
  Popup,
  Icon
} = require('semantic-ui-react');

const { Rating } = require('react-simple-star-rating');
const store = require('../stores/redux');


class FeedbackSidebar extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      rating: 0, //user star rating
      comment: '', //user feedback comment
      thumbsUpClicked: false,
      thumbsDownClicked: false,
      sending: false,
      feedbackSent: false,
      feedbackFail: false,
      connectionProblem: false,
    };
  }

  componentDidUpdate(prevProps) {
    // Check if the resetFeedbackSidebar prop has changed
    if (this.props.resetFeedbackSidebar !== prevProps.resetFeedbackSidebar) {
      this.resetState();
    }
  }

  resetState = () => {
    this.setState({
      rating: 0,
      comment: '',
      thumbsUpClicked: false,
      thumbsDownClicked: false,
      sending: false,
      feedbackSent: false,
      feedbackFail: false,
      connectionProblem: false,
    });
  }

  handleInputChange = (e, { name, value }) => {
    this.setState({ [name]: value });
  };
  //handles the user message rating
  handleRatingChange = (rate) => {
    this.setState({ rating: rate });
  };

  handleClose = () => {
    this.resetState();
    this.props.toggleFeedbackSidebar();
  }

  sendFeedback = async () => {
    const { rating, comment, thumbsUpClicked, thumbsDownClicked, ratingMessageID } = this.state;
    const state = store.getState();
    const token = state.auth.token;

    const dataToSend = {
      rating,
      comment,
      thumbsUpClicked,
      thumbsDownClicked,
      message: this.props.ratingMessageID,
    };
    this.setState({ sending: true });

    const fetchPromise = fetch("/reviews", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSend),
    });
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Fetch timed out"));
      }, 15000);
    });

    try {
      this.setState({
        feedbackSent: false,
        feedbackFail: false,
        connectionProblem: false,
      });
      //the promise race runs the fetch against a 15 seconds timeout, to handle possible connection problems
      //if we dont have an answer from fetch after 15 seconds it cuts off
      const response = await Promise.race([timeoutPromise, fetchPromise]);
      if (response.ok) {
        //forced delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        this.setState({ feedbackSent: true, sending: false, });
      } else {
        this.setState({ feedbackFail: true, sending: false, });
        console.error("API request failed with status:", response.status);
      }
    } catch (error) {
      if (error.message === "Fetch timed out") {
        this.setState({
          feedbackSent: false,
          feedbackFail: false,
          sending: false,
          connectionProblem: true,
        });
      }
    }
  }

  render() {
    const {
      // modalOpen,
      rating,
      feedbackSent,
      feedbackFail,
      sending,
      connectionProblem,
      thumbsDownClicked,
      thumbsUpClicked,
    } = this.state;
    const { visible } = this.props;

        // Style for active buttons
        const activeButtonStyle = {
          border: '2px solid #cfcdca',
        };

    return (
      <Sidebar
        as={Form}
        animation='overlay'
        direction='right'
        visible={visible}
        width='wide'
        className='info-sidebar'>

        <Header as='h3' style={{ color: '#fff' }} >Feedback</Header>
        <Icon name='close' onClick={() => this.handleClose()} className='feedback-close' />
        <Button.Group size='mini'>
          <Popup trigger={
            <Button
              icon='thumbs down'
              color='grey'
              size='tiny'
              onClick={() => this.setState({ thumbsDownClicked: true, thumbsUpClicked: false, })}
              active={thumbsDownClicked}
              style={thumbsDownClicked ? activeButtonStyle : {}}
            />
          }>
            <Popup.Content>
              <p>Report something wrong with this statement.</p>
            </Popup.Content>
          </Popup>
          <Popup trigger={
            <Button
              icon='thumbs up'
              size='tiny'
              color='green'
              onClick={() => this.setState({ thumbsDownClicked: false, thumbsUpClicked: true, })}
              active={thumbsUpClicked}
              style={thumbsUpClicked ? activeButtonStyle : {}}
            />
          }>
            <Popup.Header>Tell Us What You Liked!</Popup.Header>
            <Popup.Content>
              <p>We provide human feedback to our models, so you can annotate this message with a comment.</p>
            </Popup.Content>
          </Popup>
        </Button.Group>
        <p>Let us know your opinion!</p>

        {(!feedbackSent && !connectionProblem) && (<div>
          <Rating size={35} transition={true} onClick={this.handleRatingChange} initialValue={rating} style={{ marginBottom: '0.5em' }} />
          <Form.Field>
            <Header style={{ color: '#fff' }}>Comment</Header>
            <Form.TextArea
              placeholder='Enter your comment...'
              style={{ resize: 'none' }}
              rows={3}
              name='comment'
              onChange={this.handleInputChange}
            />
          </Form.Field>
        </div>
        )}
        <Form.Field>
          {/*When the feedback is sent it shows this message  */}
          {feedbackSent && (
            <Message positive>
              <Message.Header>Feedback Sent!</Message.Header>
              <p>Your comment has been successfully sent.</p>
            </Message>
          )}
          {/*When the feedback could not be sent it shows this message  */}
          {feedbackFail && (
            <Message negative>
              <Message.Header>Feedback could not be sent</Message.Header>
              <p>Please try again later.</p>
            </Message>
          )}
          {connectionProblem && (
            <Message negative>
              <Message.Header>Feedback could not be sent</Message.Header>
              <p>Please check your internet connection.</p>
            </Message>
          )}
        </Form.Field>
        <Form.Field>
          <Button.Group >
            <Button
              content="Close"
              icon='close'
              onClick={() => this.handleClose()}
              labelPosition='right'
              size='small'
              color='grey'
            />
            {/*This button is shown only if Feedback wasnt sent yet */}
            {(!feedbackSent && !connectionProblem) && (
              <Button
                content="Send"
                icon={sending ? 'spinner' : 'checkmark'}
                onClick={this.sendFeedback}
                labelPosition='right'
                size='small'
                loading={sending}
                positive
              />)}
          </Button.Group>
        </Form.Field>
      </Sidebar>
    )
  };
}

module.exports = FeedbackSidebar;