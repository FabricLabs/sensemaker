'use strict';

// Dependencies
const React = require('react');

// Semantic UI
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

const InfoSidebarDocument = require('./InfoSidebarDocument');

class InformationSidebar extends React.Component {
  constructor (props) {
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
      showDebug: false, // Add state for debug section visibility
    };
  }

  componentDidUpdate (prevProps) {
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
      showDebug: false,
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
        console.error('API request failed with status:', response.status);
      }
    } catch (error) {
      if (error.message === 'Fetch timed out') {
        this.setState({
          feedbackSent: false,
          feedbackFail: false,
          sending: false,
          connectionProblem: true,
        });

        setTimeout(() => {
          this.handleClose();
        }, 1000);
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
      showDebug,
    } = this.state;
    const { visible, documentSection, documentInfo, documentSections } = this.props;

    return (
      <Sidebar
        as={Form}
        animation='overlay'
        direction='right'
        visible={visible}
        width='wide'
        style={documentSection ? { width: '600px' } : {}}

      >
        <Icon name='close' size='big' onClick={() => this.handleClose()} className='feedback-close' />
        {visible ? (
          documentSection ?
            ((documentInfo && (documentInfo.fabric_id || documentInfo.file_id)) ? (
              <InfoSidebarDocument documentInfo={documentInfo} documentSections={documentSections}/>
            ) : (
              <section className='info-sidebar center-elements-column'>
                <h3>File not found</h3>
              </section>
            ))
            : (
              (this.props.thumbsUpClicked || this.props.thumbsDownClicked) ?
                (<div className='info-sidebar center-elements-column'>
                  <Header as='h2' style={{ color: '#fff', marginBottom: '2rem' }} >Feedback</Header>
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
                    <Header inverted>Message Detail</Header>
                    {
                      // TODO: implement message->data API
                      // All data returned by the search against the message ID (inline = true)
                      // HTTP/1.1 SEARCH /messages/:id
                      // TODO: Standardize `SEARCH` as a verb on all Resources, to return a list of document metadata and links to referenced documents
                    }
                    <fabric-search-results>
                      <div id='fabric-search-results'></div> {/* This div is required for the component to work */}
                      <fabric-state>
                        <code>{JSON.stringify(this.state, null, '  ')}</code>
                      </fabric-state>
                    </fabric-search-results>
                    <Card fluid>
                      <CardContent>
                        <CardHeader>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong>Author:</strong> {this.props.message?.author || 'Unknown'}
                            </div>
                            <div>
                              <strong>Timestamp:</strong> {this.formatDateTime(this.props.message?.updated_at)}
                            </div>
                          </div>
                          {this.props.message?.attachments && this.props.message.attachments.length > 0 && (
                            <div style={{ marginTop: '0.5em' }}>
                              <strong>Attachments:</strong>
                              <ul style={{ marginTop: '0.5em', paddingLeft: '1.5em' }}>
                                {this.props.message.attachments.map((attachment, index) => (
                                  <li key={index}>
                                    <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                      {attachment.name || attachment.url}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardHeader>
                        <CardDescription>
                          <Button
                            basic
                            size='small'
                            onClick={() => this.setState({ showDebug: !this.state.showDebug })}
                            style={{ marginTop: '1em' }}
                          >
                            <Icon name={this.state.showDebug ? 'chevron down' : 'chevron right'} />
                            {this.state.showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
                          </Button>
                          {this.state.showDebug && (
                            <div style={{
                              marginTop: '1em',
                              padding: '1em',
                              backgroundColor: '#1b1c1d',
                              borderRadius: '4px',
                              maxHeight: '400px',
                              overflowY: 'auto'
                            }}>
                              <Header size='small' inverted>Debug Information</Header>
                              <div style={{ marginTop: '0.5em' }}>
                                <div style={{ marginBottom: '0.5em' }}>
                                  <strong style={{ color: '#fff' }}>Message ID:</strong>
                                  <code style={{ color: '#fff', marginLeft: '0.5em' }}>{this.props.checkingMessageID}</code>
                                </div>
                                <div style={{ marginBottom: '0.5em' }}>
                                  <strong style={{ color: '#fff' }}>State:</strong>
                                  <pre style={{
                                    color: '#fff',
                                    marginTop: '0.5em',
                                    backgroundColor: '#2d2d2d',
                                    padding: '0.5em',
                                    borderRadius: '4px',
                                    overflowX: 'auto'
                                  }}>
                                    {JSON.stringify(this.state, null, '  ')}
                                  </pre>
                                </div>
                                <div>
                                  <strong style={{ color: '#fff' }}>Message Data:</strong>
                                  <pre style={{
                                    color: '#fff',
                                    marginTop: '0.5em',
                                    backgroundColor: '#2d2d2d',
                                    padding: '0.5em',
                                    borderRadius: '4px',
                                    overflowX: 'auto'
                                  }}>
                                    {JSON.stringify(this.props.message, null, '  ')}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardDescription>
                      </CardContent>
                    </Card>
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
