'use strict';

const React = require('react');
const {
  Message,
  Transition
} = require('semantic-ui-react');

/**
 * Custom Toast component using Semantic UI Message
 */
class Toast extends React.Component {
    constructor(props) {
    super(props);

    this.state = {
      visible: true,
      progress: 100, // Start at 100% and count down
      showProgress: true, // Separate flag to control progress bar visibility
      isExiting: false, // Flag for custom exit animation
      progressScalingOut: false // Flag for progress bar scale out animation
    };

    this.timeoutId = null;
    this.progressIntervalId = null;
    this.isDismissing = false;
  }

  componentDidMount() {
    // Auto-dismiss after specified duration
    if (this.props.duration && this.props.duration > 0) {
      this.timeoutId = setTimeout(() => {
        this.dismiss();
      }, this.props.duration);

      // Start progress countdown
      this.startProgressCountdown();
    }
  }

  componentWillUnmount() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.progressIntervalId) {
      clearInterval(this.progressIntervalId);
    }
  }

  startProgressCountdown = () => {
    if (!this.props.duration || this.props.duration <= 0) return;

    // Update progress every 50ms for smooth animation
    const updateInterval = 50;
    const totalSteps = this.props.duration / updateInterval;
    const decrementPerStep = 100 / totalSteps;
    let currentStep = 0;

    this.progressIntervalId = setInterval(() => {
      // Don't update progress if we're dismissing
      if (this.isDismissing) {
        clearInterval(this.progressIntervalId);
        this.progressIntervalId = null;
        return;
      }

      currentStep++;
      this.setState(() => {
        // Calculate progress as percentage remaining
        const newProgress = Math.max(0, 100 - (currentStep * decrementPerStep));

        // Stop the interval when we reach the end or progress is effectively 0
        if (currentStep >= totalSteps || newProgress <= 0.5) { // Use 0.5 threshold to avoid floating point issues
          clearInterval(this.progressIntervalId);
          this.progressIntervalId = null;
          return { progress: 0, showProgress: false }; // Ensure it ends at exactly 0 and hide progress
        }

        return { progress: newProgress };
      });
    }, updateInterval);
  };

  pauseProgress = () => {
    if (this.progressIntervalId) {
      clearInterval(this.progressIntervalId);
      this.progressIntervalId = null;
    }
  };

    resumeProgress = () => {
    if (this.state.progress > 0 && !this.progressIntervalId && !this.isDismissing) {
      // Calculate remaining time based on current progress
      const remainingProgress = this.state.progress;
      const remainingTime = (remainingProgress / 100) * this.props.duration;

      // Restart progress countdown with remaining time
      const updateInterval = 50;
      const totalSteps = remainingTime / updateInterval;
      const decrementPerStep = remainingProgress / totalSteps;
      let currentStep = 0;

      this.progressIntervalId = setInterval(() => {
        // Don't update progress if we're dismissing
        if (this.isDismissing) {
          clearInterval(this.progressIntervalId);
          this.progressIntervalId = null;
          return;
        }

        currentStep++;
        this.setState(() => {
          const newProgress = Math.max(0, remainingProgress - (currentStep * decrementPerStep));

          // Stop the interval when we reach the end or progress is effectively 0
          if (currentStep >= totalSteps || newProgress <= 0.5) { // Use 0.5 threshold to avoid floating point issues
            clearInterval(this.progressIntervalId);
            this.progressIntervalId = null;
            return { progress: 0, showProgress: false }; // Ensure it ends at exactly 0 and hide progress
          }

          return { progress: newProgress };
        });
      }, updateInterval);
    }
  };

  dismiss = () => {
    // Set dismissing flag to prevent any further progress updates
    this.isDismissing = true;

    // Immediately clear intervals and timeouts
    this.pauseProgress();
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

        // First, start scaling out the progress bar
    this.setState({
      progressScalingOut: true
    });

    // After progress bar fades out, start the toast exit animation
    setTimeout(() => {
      this.setState({
        showProgress: false,
        progress: 0,
        isExiting: true
      });
    }, 150); // Wait for progress scale out to complete

    // Wait for all animations to complete before calling onDismiss
    setTimeout(() => {
      if (this.props.onDismiss) {
        this.props.onDismiss(this.props.id);
      }
    }, 350); // 150ms progress scale + 200ms toast slide out
  };

  handleClick = () => {
    if (this.props.dismissOnClick !== false) {
      this.dismiss();
    }
  };

  handleMouseEnter = () => {
    // Pause auto-dismiss and progress on hover
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.pauseProgress();
  };

  handleMouseLeave = () => {
    // Resume auto-dismiss and progress on mouse leave (if duration specified and not dismissing)
    if (this.props.duration && this.props.duration > 0 && this.state.visible && !this.isDismissing) {
      const remainingTime = (this.state.progress / 100) * this.props.duration;
      this.timeoutId = setTimeout(() => {
        this.dismiss();
      }, remainingTime);

      this.resumeProgress();
    }
  };

  getProgressColor = () => {
    const { type } = this.props;
    switch (type) {
      case 'success': return '#21ba45'; // Semantic UI green
      case 'error': return '#db2828'; // Semantic UI red
      case 'warning': return '#f2711c'; // Semantic UI orange
      case 'info': return '#2185d0'; // Semantic UI blue
      default: return '#2185d0';
    }
  };

  render() {
    const { type = 'info', message, header } = this.props;

    // Don't render if we're exiting and the animation time has passed
    if (this.state.isExiting) {
      return (
        <div className="toast-slide-out-right" style={{ marginBottom: '0.5em' }}>
          <Message
            positive={type === 'success'}
            negative={type === 'error'}
            warning={type === 'warning'}
            info={type === 'info'}
            onDismiss={this.dismiss}
            onClick={this.handleClick}
            onMouseEnter={this.handleMouseEnter}
            onMouseLeave={this.handleMouseLeave}
            style={{
              cursor: this.props.dismissOnClick !== false ? 'pointer' : 'default',
              margin: 0
            }}
          >
            {header && <Message.Header>{header}</Message.Header>}
            <div>{message}</div>

            {/* Progress bar showing remaining time - hidden during exit */}
          </Message>
        </div>
      );
    }

    return (
      <div className="toast-fade-slide-in" style={{ marginBottom: '0.5em' }}>
        <Message
          positive={type === 'success'}
          negative={type === 'error'}
          warning={type === 'warning'}
          info={type === 'info'}
          onDismiss={this.dismiss}
          onClick={this.handleClick}
          onMouseEnter={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
          style={{
            cursor: this.props.dismissOnClick !== false ? 'pointer' : 'default',
            margin: 0
          }}
                >
          {/* Custom progress bar showing remaining time - attached to top */}
          {this.props.duration && this.props.duration > 0 && this.state.showProgress && (
            <div 
              className={this.state.progressScalingOut ? 'progress-scale-out' : ''}
              style={{
                position: 'relative',
                margin: '-1em -1.5em 0.75em -1.5em',
                width: 'calc(100% + 3em)',
                height: '3px',
                backgroundColor: 'rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: `${this.state.progress}%`,
                  backgroundColor: this.getProgressColor(),
                  transition: 'width 0.05s ease-out'
                }}
              />
            </div>
          )}

          {header && <Message.Header>{header}</Message.Header>}
          <div>{message}</div>
        </Message>
      </div>
    );
  }
}

module.exports = Toast;
