'use strict';

const React = require('react');

const {
  Button,
  Header,
  Form,
  Message,
  Sidebar,
  Popup,
  Icon,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} = require('semantic-ui-react');

const { Rating } = require('react-simple-star-rating');
const store = require('../stores/redux');


class InformationSidebar extends React.Component {

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
    // Check if the resetInformationSidebar prop has changed
    if (this.props.resetInformationSidebar !== prevProps.resetInformationSidebar) {
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
    this.props.toggleInformationSidebar();
  }

  sendFeedback = async () => {
    const { rating, comment } = this.state;
    const { thumbsUpClicked, thumbsDownClicked, checkingMessageID } = this.props;
    const state = store.getState();
    const token = state.auth.token;

    const dataToSend = {
      rating,
      comment,
      thumbsUpClicked,
      thumbsDownClicked,
      message: checkingMessageID,
    };

    console.log(dataToSend);
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

  formatDateTime = (dateTimeStr) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateTimeStr).toLocaleString('en-US', options);
  }

  render() {
    const {
      // modalOpen,
      rating,
      feedbackSent,
      feedbackFail,
      sending,
      connectionProblem,
    } = this.state;
    const { visible, documentSection, documentInfo } = this.props;

    return (
      <Sidebar
        as={Form}
        animation='overlay'
        direction='right'
        visible={visible}
        width='wide'
        style={documentSection ? { width: '600px' } : null}
      >
        <Icon name='close' size='big' onClick={() => this.handleClose()} className='feedback-close' />
        {visible ? (
          documentSection ?
            ((documentInfo && documentInfo.file_id) ? (
              <section className='info-sidebar center-elements-column'>
                {/* this is just a random document, we need to add documentId to the src */}
                <Card fluid className='info-file-card' style={{ paddingBottom: '1.5em' }}>
                  <CardContent header={documentInfo.filename} style={{ paddingBottom: '0' }}>
                    {/* <CardHeader>{documentInfo.filename}</CardHeader> */}
                  </CardContent>
                  <CardContent style={{ paddingTop: '0.5em', marginBottom: '1.5em' }}>
                    {this.props.matterTitle && (
                      <CardDescription>
                        <strong>Matter:</strong> {this.props.matterTitle}
                      </CardDescription>
                    )}
                    <CardDescription>
                      <strong>Created:</strong> {this.formatDateTime(documentInfo.created_at)}
                    </CardDescription>
                    <CardDescription>
                      <strong>Modified:</strong> {this.formatDateTime(documentInfo.updated_at)}
                    </CardDescription>
                  </CardContent>
                </Card>
                <iframe
                  src={`${window.location.protocol}//${window.location.hostname}:${window.location.port}/files/serve/${documentInfo.file_id}`}
                  className='document-frame'
                ></iframe>
              </section>
            ) : (
              <section className='info-sidebar center-elements-column'>
                <h3>File not found</h3>
              </section>
            ))
            : (
              (this.props.thumbsUpClicked || this.props.thumbsDownClicked) ?
                (<div className='info-sidebar center-elements-column'>

                  <Header as='h2' style={{ color: '#fff', marginBottom: '2rem' }} >Feedback</Header>
                  {/* <Icon name='close' onClick={() => this.handleClose()} className='feedback-close' /> */}
                  <Button.Group size='medium'>
                    {(this.props.thumbsDownClicked) ? (
                      <Popup
                        trigger={
                          <Button icon='thumbs down' color='grey' size='medium' />
                        }>
                        <Popup.Content>
                          <p>Report something wrong with this statement.</p>
                        </Popup.Content>
                      </Popup>
                    ) : (
                      <Popup
                        trigger={
                          <Button icon='thumbs up' size='medium' color='green' />
                        }>
                        <Popup.Header>Tell Us What You Liked!</Popup.Header>
                        <Popup.Content>
                          <p>We provide human feedback to our models, so you can annotate this message with a comment.</p>
                        </Popup.Content>
                      </Popup>
                    )}
                  </Button.Group>
                  <Header size='small' style={{ color: '#fff' }}>Let us know your opinion!</Header>
                  {(!feedbackSent && !connectionProblem) && (<Form.Field>
                    <div style={{ marginBottom: '0.5rem' }} className='center-elements-row'>
                      <Rating
                        size={35}
                        transition={true}
                        onClick={this.handleRatingChange}
                        initialValue={rating}
                      />
                    </div>
                    <Header style={{ color: '#fff' }}>Comment</Header>
                    <Form.TextArea
                      placeholder='Enter your comment...'
                      style={{ resize: 'none' }}
                      rows={4}
                      name='comment'
                      onChange={this.handleInputChange}
                    />
                  </Form.Field>

                  )}
                  <Form.Field>
                    {/*When the feedback is sent it shows this message  */}
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
                </div>) : (
                  <div className='info-sidebar'>
                    <p>{this.props.checkingMessageID}</p>
                    <Header>Cases Sourced</Header>
                    {
                      // TODO: implement message->case API
                      // All cases retuned by the search against the message ID (inline = true)
                    }
                    <fabric-search-results>
                      <div id='fabric-search-results'></div> {/* This div is required for the component to work */}
                      <fabric-state>
                        <code>{JSON.stringify(this.state, null, '  ')}</code>
                      </fabric-state>
                    </fabric-search-results>
                  </div>
                )
            )
        ) : (
          <div className='info-sidebar center-elements-column' />
        )}
      </Sidebar>
    )
  };
}

module.exports = InformationSidebar;
