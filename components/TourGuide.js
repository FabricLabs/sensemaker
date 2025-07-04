'use strict';

const React = require('react');
const Joyride = require('react-joyride');
const { Button } = require('semantic-ui-react');

function CustomTooltip (props) {
  const { backProps, closeProps, continuous, index, primaryProps, skipProps, step, tooltipProps } =
    props;

  return (
    <div className="tooltip__body" {...tooltipProps}>
      <button className="tooltip__close" {...closeProps}>
        &times;
      </button>
      {step.title && <h4 className="tooltip__title">{step.title}</h4>}
      <div className="tooltip__content">{step.content}</div>
      <div className="tooltip__footer">
        <button className="tooltip__button" {...skipProps}>
          {skipProps.title}
        </button>
        <div className="tooltip__spacer">
          {index > 0 && (
            <button className="tooltip__button" {...backProps}>
              {backProps.title}
            </button>
          )}
          {continuous && (
            <button className="tooltip__button tooltip__button--primary" {...primaryProps}>
              {primaryProps.title}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

class TourGuide extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      run: false,
      stepIndex: 0,
      steps: this.transformSteps(props.steps || []),
      completedSteps: this.loadCompletedSteps()
    };

    this.handleNext = this.handleNext.bind(this);
    this.handlePrevious = this.handlePrevious.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleSkip = this.handleSkip.bind(this);
    this.startTour = this.startTour.bind(this);
    this.resumeTour = this.resumeTour.bind(this);
  }

  transformSteps(steps) {
    return steps.map(step => ({
      target: step.target,
      content: (
        <div>
          <h3>{step.title}</h3>
          <p>{step.content}</p>
          {step.component}
        </div>
      ),
      placement: step.placement || 'auto',
      disableBeacon: true,
      ...step
    }));
  }

  loadCompletedSteps() {
    try {
      const saved = localStorage.getItem('tourCompletedSteps');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading completed steps:', e);
      return [];
    }
  }

  saveCompletedSteps(steps) {
    try {
      localStorage.setItem('tourCompletedSteps', JSON.stringify(steps));
    } catch (e) {
      console.error('Error saving completed steps:', e);
    }
  }

  handleNext() {
    const { stepIndex, steps, completedSteps } = this.state;
    
    // Execute action if defined for this step
    if (steps[stepIndex].action) {
      steps[stepIndex].action();
    }

    // Mark current step as completed
    const newCompletedSteps = [...completedSteps, stepIndex];
    this.saveCompletedSteps(newCompletedSteps);

    if (stepIndex < steps.length - 1) {
      this.setState({
        stepIndex: stepIndex + 1,
        completedSteps: newCompletedSteps
      });
    } else {
      this.handleClose();
    }
  }

  handlePrevious() {
    const { stepIndex } = this.state;
    if (stepIndex > 0) {
      this.setState({ stepIndex: stepIndex - 1 });
    }
  }

  handleClose() {
    this.setState({ run: false });
  }

  handleSkip() {
    this.handleClose();
  }

  startTour() {
    this.setState({
      run: true,
      stepIndex: 0,
      completedSteps: []
    });
    this.saveCompletedSteps([]);
  }

  resumeTour() {
    const { completedSteps } = this.state;
    const nextStep = completedSteps.length;
    
    if (nextStep < this.state.steps.length) {
      this.setState({
        run: true,
        stepIndex: nextStep
      });
    } else {
      this.startTour();
    }
  }

  render () {
    const { run, stepIndex, steps } = this.state;

    return (
      <div>
        <Joyride
          steps={steps}
          run={run}
          stepIndex={stepIndex}
          continuous
          showProgress
          showSkipButton
          styles={{
            options: {
              primaryColor: '#2185d0',
              textAlign: 'left',
              zIndex: 1000,
            }
          }}
          callback={({ action, index, type }) => {
            if (type === 'step:after' && action === 'next') {
              this.handleNext();
            } else if (type === 'step:after' && action === 'prev') {
              this.handlePrevious();
            } else if (type === 'step:after' && action === 'skip') {
              this.handleSkip();
            } else if (type === 'tour:end') {
              this.handleClose();
            }
          }}
        />
      </div>
    );
  }
}

module.exports = TourGuide;
