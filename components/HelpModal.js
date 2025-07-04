'use strict';

const React = require('react');
const {
  Modal,
  Button,
  Icon,
  Header,
  List
} = require('semantic-ui-react');

class HelpModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false
    };
  }

  handleOpen = () => this.setState({ open: true });
  handleClose = () => this.setState({ open: false });

  handleAskQuestion = () => {
    this.handleClose();
    // Navigate to conversations or open chat
    if (this.props.navigate) {
      this.props.navigate('/conversations');
    }
  };

  handleTakeTour = () => {
    this.handleClose();
    if (this.props.onStartTour) {
      this.props.onStartTour();
    }
  };

  render() {
    const { open } = this.state;

    return (
      <>
        <Icon 
          name="question circle" 
          size="large" 
          style={{ cursor: 'pointer', color: 'black' }} 
          onClick={this.handleOpen}
        />
        <Modal
          open={open}
          onClose={this.handleClose}
          size="tiny"
          centered
        >
          <Modal.Header>
            <Icon name="question circle" />
            Help
          </Modal.Header>
          <Modal.Content>
            <List divided relaxed>
              <List.Item>
                <List.Content>
                  <Button 
                    fluid 
                    color="blue" 
                    onClick={this.handleAskQuestion}
                    icon
                    labelPosition="left"
                  >
                    <Icon name="comment" />
                    Ask a Question
                  </Button>
                </List.Content>
              </List.Item>
              <List.Item>
                <List.Content>
                  <Button 
                    fluid 
                    color="green" 
                    onClick={this.handleTakeTour}
                    icon
                    labelPosition="left"
                  >
                    <Icon name="map" />
                    Take the Tour
                  </Button>
                </List.Content>
              </List.Item>
            </List>
          </Modal.Content>
        </Modal>
      </>
    );
  }
}

module.exports = HelpModal;