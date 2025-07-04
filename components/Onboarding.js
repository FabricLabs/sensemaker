'use strict';

const React = require('react');
const {
  Modal,
  Button,
  Header,
  Icon,
  List,
  Image,
  Segment,
  Grid,
  Form,
  Input,
  TextArea,
  Dropdown,
  Checkbox,
  Progress,
  Transition,
  Message,
  Popup,
  Step
} = require('semantic-ui-react');

const { toast } = require('../functions/toast');
const FabricMessage = require('@fabric/core/types/message');

// Local Components
const DepositAddress = require('./DepositAddress');

class Onboarding extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: true,
      currentStep: 0,
      completedSteps: [], // Track which steps have been completed
      transitioning: false,
      contentVisible: false, // Start hidden for smooth fade in
      contentHeight: 'auto',
      // Configuration data
      aiPersonality: 'Sensemaker',
      aiPersonalityTraits: ['helpful'],
      aiTemperature: 0.0,
      goals: [''],
      savingConfiguration: false,
      saveProgress: 0,
      saveProgressLabel: '',
      personalityOptions: [
        { key: 'helpful', value: 'helpful', text: 'Helpful' },
        { key: 'professional', value: 'professional', text: 'Professional' },
        { key: 'friendly', value: 'friendly', text: 'Friendly' },
        { key: 'analytical', value: 'analytical', text: 'Analytical' },
        { key: 'creative', value: 'creative', text: 'Creative' },
        { key: 'empathetic', value: 'empathetic', text: 'Empathetic' },
        { key: 'concise', value: 'concise', text: 'Concise' },
        { key: 'detailed', value: 'detailed', text: 'Detailed' },
        { key: 'enthusiastic', value: 'enthusiastic', text: 'Enthusiastic' }
      ],
      steps: [
        {
          title: 'First-Time Setup',
          content: 'Before we get started, we need to configure your node.  This will help us understand your goals and preferences, fine-tuning your instance to suit your needs.',
          icon: 'settings',
          image: '/images/onboarding/welcome.png'
        },
        {
          title: 'Personality',
          content: 'Let\'s start with your node\'s personality.',
          icon: 'brain',
          image: '/images/onboarding/ai-setup.png'
        },
        {
          title: 'Define Goals',
          content: 'Establish a set of personal goals you want to achieve.  These will guide the AI\'s recommendations and actions.',
          icon: 'target',
          image: '/images/onboarding/goals.png'
        },
        {
          title: 'Start Earning',
          content: 'Learn how your node can earn Bitcoin by providing services to other Sensemaker instances.',
          icon: 'bitcoin',
          image: '/images/onboarding/bitcoin.png'
        }
      ]
    };
  }

  componentDidMount() {
    // Create ref for content measurement
    this.contentRef = React.createRef();

    // Modal opens by default, so initialize content
    this.setState({
      contentVisible: false
    });

    // Wait for modal to render, then measure and set height before showing content
    setTimeout(() => {
      const initialHeight = this.measureContentHeight();
      this.setState({
        contentHeight: initialHeight ? `${initialHeight}px` : 'auto'
      });

      // Small delay to let height be set, then fade in content
      setTimeout(() => {
        this.setState({ contentVisible: true });
      }, 50);
    }, 100);
  }

  componentDidUpdate(prevProps, prevState) {
    // If modal was closed and then reopened, ensure content is visible
    if (!prevState.open && this.state.open && !this.state.contentVisible) {
      setTimeout(() => {
        const initialHeight = this.measureContentHeight();
        this.setState({
          contentVisible: true,
          contentHeight: initialHeight ? `${initialHeight}px` : 'auto'
        });
      }, 100);
    }
  }

  measureContentHeight = () => {
    if (this.contentRef.current) {
      // Create a temporary clone to measure natural height
      const element = this.contentRef.current;
      const clone = element.cloneNode(true);

      // Style the clone for measurement
      clone.style.position = 'absolute';
      clone.style.visibility = 'hidden';
      clone.style.height = 'auto';
      clone.style.maxHeight = 'none';
      clone.style.top = '-9999px';
      clone.style.left = '-9999px';
      clone.style.width = element.offsetWidth + 'px';

      // Add to DOM, measure, then remove
      document.body.appendChild(clone);
      const naturalHeight = clone.scrollHeight + 24; // Add extra buffer for Message component margins
      document.body.removeChild(clone);

      // Cap the height at 70% of viewport height to match maxHeight in CSS
      const maxHeight = Math.floor(window.innerHeight * 0.7);
      return Math.min(naturalHeight, maxHeight);
    }
    return null;
  }

  handleOpen = () => {
    this.setState({
      open: true,
      contentVisible: false
    });

    // Small delay to ensure modal is rendered, measure height, then fade in content
    setTimeout(() => {
      const initialHeight = this.measureContentHeight();
      this.setState({
        contentVisible: true,
        contentHeight: initialHeight ? `${initialHeight}px` : 'auto'
      });
    }, 100);
  };

  handleClose = () => this.setState({
    open: false,
    contentVisible: false,
    transitioning: false,
    contentHeight: 'auto'
  });

  handleNext = () => {
    if (this.state.transitioning) return;

    // Check if current step can be completed
    if (!this.canCompleteCurrentStep()) {
      return; // Don't advance if step requirements aren't met
    }

    if (this.state.currentStep < this.state.steps.length - 1) {
      // Mark current step as completed
      const completedSteps = [...this.state.completedSteps];
      if (!completedSteps.includes(this.state.currentStep)) {
        completedSteps.push(this.state.currentStep);
      }

      // Start transition: fade out current content
      this.setState({
        transitioning: true,
        contentVisible: false,
        completedSteps: completedSteps
      });

      // After fade out completes, change step and measure new height
      setTimeout(() => {
        const nextStep = this.state.currentStep + 1;
        this.setState({
          currentStep: nextStep,
          transitioning: false
        });

        // Small delay to ensure step change is rendered, then measure and animate height
        setTimeout(() => {
          const newHeight = this.measureContentHeight();
          this.setState({
            contentHeight: newHeight ? `${newHeight}px` : 'auto'
          });

          // After height starts animating, fade in content
          setTimeout(() => {
            this.setState({
              contentVisible: true
            });


          }, 100);
        }, 50);
      }, 250); // Fade out duration
    } else {
      this.handleFinish();
    }
  };
  handlePrevious = () => {
    if (this.state.transitioning) return;

    if (this.state.currentStep > 0) {
      // Start transition: fade out current content
      this.setState({
        transitioning: true,
        contentVisible: false
      });

      // After fade out completes, change step and measure new height
      setTimeout(() => {
        this.setState(prevState => ({
          currentStep: prevState.currentStep - 1,
          transitioning: false
        }));

        // Small delay to ensure step change is rendered, then measure and animate height
        setTimeout(() => {
          const newHeight = this.measureContentHeight();
          this.setState({
            contentHeight: newHeight ? `${newHeight}px` : 'auto'
          });

          // After height starts animating, fade in content
          setTimeout(() => {
            this.setState({
              contentVisible: true
            });
          }, 100);
        }, 50);
      }, 250); // Fade out duration
    }
  };

  canCompleteCurrentStep = () => {
    const { currentStep } = this.state;

    switch (currentStep) {
      case 0: // Welcome step - always completable
        return true;
      case 1: // AI Configuration step
        return this.state.aiPersonality.trim() !== '' && this.state.aiPersonalityTraits.length > 0;
      case 2: // Goals step
        return this.state.goals.some(goal => goal.trim() !== '');
      case 3: // Bitcoin step - always completable
        return true;
      default:
        return true;
    }
  };

  handleFinish = async () => {
    // Mark final step as completed
    const completedSteps = [...this.state.completedSteps];
    if (!completedSteps.includes(this.state.currentStep)) {
      completedSteps.push(this.state.currentStep);
    }

    this.setState({
      completedSteps,
      savingConfiguration: true,
      saveProgress: 0,
      saveProgressLabel: 'Starting configuration save...'
    });

    // Define the configuration steps
    const configSteps = [
      {
        endpoint: '/settings/NODE_NAME',
        value: this.state.aiPersonality,
        label: 'Saving AI name...'
      },
      {
        endpoint: '/settings/NODE_PERSONALITY',
        value: JSON.stringify(this.state.aiPersonalityTraits),
        label: 'Saving personality traits...'
      },
      {
        endpoint: '/settings/NODE_TEMPERATURE',
        value: this.state.aiTemperature,
        label: 'Saving creativity settings...'
      },
      {
        endpoint: '/settings/NODE_GOALS',
        value: JSON.stringify(this.state.goals.filter(goal => goal.trim() !== '')),
        label: 'Saving node goals...'
      },
      {
        endpoint: '/settings/IS_CONFIGURED',
        value: true,
        label: 'Finalizing configuration...'
      }
    ];

    try {
      const auth = this.props.auth;

      if (!auth || !auth.token) {
        throw new Error('Authentication required. Please refresh and try again.');
      }

      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.token}`
      };

      // Process each configuration step with progress updates
      for (let i = 0; i < configSteps.length; i++) {
        const step = configSteps[i];

        this.setState({
          saveProgress: Math.round(((i) / configSteps.length) * 100),
          saveProgressLabel: step.label
        });

        console.debug('[ONBOARDING]', `Making PUT request to ${step.endpoint}:`, step.value);

        const response = await fetch(step.endpoint, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ value: step.value })
        });

        console.debug('[ONBOARDING]', `Response from ${step.endpoint}:`, response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[ONBOARDING]', `Error response body:`, errorText);
          throw new Error(`Failed to save ${step.endpoint}: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.debug('[ONBOARDING]', `Success response from ${step.endpoint}:`, result);

        // Small delay to show progress visually
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Complete progress
      this.setState({
        saveProgress: 100,
        saveProgressLabel: '✓ Configuration saved successfully!'
      });

      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success('Configuration saved successfully!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Start fade-out transition for the modal
      this.setState({
        savingConfiguration: false,
        contentVisible: false
      });

      // Wait for fade-out to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Call the completion callback to notify parent component
      if (this.props.onConfigurationComplete) {
        this.props.onConfigurationComplete();
      }

      // Close the modal with a smooth fade-out
      setTimeout(() => {
        this.setState({
          open: false,
          contentHeight: 'auto'
        });
      }, 200);
    } catch (error) {
      console.error('[ONBOARDING]', 'Failed to save configuration:', error);
      this.setState({
        savingConfiguration: false,
        saveProgress: 0,
        saveProgressLabel: ''
      });
      toast.error(`Failed to save configuration: ${error.message}`, {
        position: 'bottom-right',
        autoClose: 4000,
      });
    }
  };



  handleInputChange = (field, value) => {
    this.setState({ [field]: value });
  };

  handleGoalChange = (index, value) => {
    const goals = [...this.state.goals];
    goals[index] = value;
    this.setState({ goals });
  };

  addGoal = () => {
    this.setState(prevState => ({
      goals: [...prevState.goals, '']
    }));
  };

  addSuggestedGoal = (goalText) => {
    // Check if this goal already exists
    if (this.state.goals.includes(goalText)) {
      return; // Don't add duplicates
    }

    // Find first empty slot or add to end
    const goals = [...this.state.goals];
    const emptyIndex = goals.findIndex(goal => goal.trim() === '');

    if (emptyIndex !== -1) {
      // Fill empty slot
      goals[emptyIndex] = goalText;
    } else {
      // Add new goal
      goals.push(goalText);
    }

    this.setState({ goals });
  };

  getStepCompletionStatus = (stepIndex) => {
    const { completedSteps, currentStep } = this.state;

    // Check if step is completed
    if (completedSteps.includes(stepIndex)) {
      return { completed: true, current: false };
    }

    // Check if it's the current step
    if (stepIndex === currentStep) {
      return { completed: false, current: true, canComplete: this.canCompleteCurrentStep() };
    }

    // For other steps, check if they would be completable with current data
    let canComplete = false;
    switch (stepIndex) {
      case 0: // Welcome step - always completable
        canComplete = true;
        break;
      case 1: // AI Configuration step
        canComplete = this.state.aiPersonality.trim() !== '' && this.state.aiPersonalityTraits.length > 0;
        break;
      case 2: // Goals step
        canComplete = this.state.goals.some(goal => goal.trim() !== '');
        break;
      case 3: // Bitcoin step - always completable
        canComplete = true;
        break;
      default:
        canComplete = true;
    }

    return { completed: false, current: false, canComplete };
  };

  removeGoal = (index) => {
    if (this.state.goals.length > 1) {
      const goals = [...this.state.goals];
      goals.splice(index, 1);
      this.setState({ goals });
    }
  };



  renderStepContent = () => {
    const { currentStep } = this.state;

    switch (currentStep) {
      case 0: // Welcome
        return (
          <Segment basic>
            <Message info>
              <Message.Header>Welcome to Your Node</Message.Header>
              <p>Before we get started, let's get configured.  Here's what you'll need to do:</p>
            </Message>
            <div style={{ marginTop: '1.5rem' }}>
              {/* Step 1: Choose a Personality */}
              {(() => {
                const status = this.getStepCompletionStatus(1);
                return (
                  <Message
                    color={status.completed ? 'green' : status.current ? 'blue' : undefined}
                    style={{ marginBottom: '1rem' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Message.Header>
                        <Icon name="brain" color="blue" style={{ marginRight: '0.5rem' }} />
                        1. Choose a Personality
                      </Message.Header>
                      <Checkbox
                        checked={status.completed}
                        disabled
                        style={{ pointerEvents: 'none' }}
                      />
                    </div>
                  </Message>
                );
              })()}

              {/* Step 2: Set Your Goals */}
              {(() => {
                const status = this.getStepCompletionStatus(2);
                return (
                  <Message
                    color={status.completed ? 'green' : status.current ? 'blue' : undefined}
                    style={{ marginBottom: '1rem' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Message.Header>
                        <Icon name="target" color="green" style={{ marginRight: '0.5rem' }} />
                        2. Set Your Goals
                      </Message.Header>
                      <Checkbox
                        checked={status.completed}
                        disabled
                        style={{ pointerEvents: 'none' }}
                      />
                    </div>
                  </Message>
                );
              })()}

              {/* Step 3: Start Earning Bitcoin */}
              {(() => {
                const status = this.getStepCompletionStatus(3);
                return (
                  <Message
                    color={status.completed ? 'green' : status.current ? 'blue' : undefined}
                    style={{ marginBottom: '1rem' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Message.Header>
                        <Icon name="bitcoin" color="orange" style={{ marginRight: '0.5rem' }} />
                        3. Start Earning Bitcoin
                      </Message.Header>
                      <Checkbox
                        checked={status.completed}
                        disabled
                        style={{ pointerEvents: 'none' }}
                      />
                    </div>
                  </Message>
                );
              })()}
            </div>
          </Segment>
        );

      case 1: // AI Configuration
        return (
          <Segment basic>
            <Message>
              <Message.Header>Customize Your AI Assistant</Message.Header>
              <p>Choose how your AI assistant will interact with you. These settings help personalize the AI's responses to match your preferences.</p>
            </Message>
            <Form>
              <Form.Field>
                <Popup
                  trigger={<label style={{ cursor: 'help' }}>AI Name <Icon name="question circle outline" size="small" /></label>}
                  content="Choose a name for your AI assistant. This is how the AI will identify itself in conversations."
                  position="top left"
                />
                <Input
                  placeholder="e.g., Sensemaker, Assistant, Guide"
                  value={this.state.aiPersonality}
                  onChange={(e) => this.handleInputChange('aiPersonality', e.target.value)}
                />
              </Form.Field>
              <Form.Field>
                <Popup
                  trigger={<label style={{ cursor: 'help' }}>Traits <Icon name="question circle outline" size="small" /></label>}
                  content="Select a number of personality traits that describe how you want your AI to communicate with you."
                  position="top left"
                />
                <Dropdown
                  selection
                  multiple
                  search
                  upward
                  options={this.state.personalityOptions}
                  value={this.state.aiPersonalityTraits}
                  onChange={(e, { value }) => this.handleInputChange('aiPersonalityTraits', value)}
                  placeholder="Search and select traits..."
                />
              </Form.Field>
              <Form.Field>
                <Popup
                  trigger={<label style={{ cursor: 'help' }}>Stability: {(1.0 - this.state.aiTemperature).toFixed(1)} <Icon name="question circle outline" size="small" /></label>}
                  content="Controls response reliability. 1.0 = very reliable and focused, 0.0 = highly creative and varied. Higher values work better for factual questions."
                  position="top left"
                />
                <div style={{ padding: '1rem 0' }}>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={1.0 - this.state.aiTemperature}
                    onChange={(e) => this.handleInputChange('aiTemperature', 1.0 - parseFloat(e.target.value))}
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      background: '#ddd',
                      outline: 'none',
                      WebkitAppearance: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', color: '#666', marginTop: '0.5rem' }}>
                    <span>Creative</span>
                    <span>Reliable</span>
                  </div>
                </div>
              </Form.Field>
            </Form>
          </Segment>
        );
      case 2: // Goals Configuration
        return (
          <Segment basic>
            <Message>
              <Message.Header>What Do You Want to Achieve?</Message.Header>
              <p>Set the primary objectives for your Sensemaker instance. These goals will guide how the AI assists you and what recommendations it provides.</p>
            </Message>
            <Popup
              trigger={<Header as="h4" style={{ marginTop: '1.5rem', marginBottom: '0.5rem', cursor: 'help' }}>Suggested Goals <Icon name="question circle outline" size="small" /></Header>}
              content="Click any of these common goals to quickly add them to your list. You can customize them later."
              position="top left"
            />
            <div style={{ marginBottom: '1rem' }}>
              <Popup
                trigger={
                  <Button basic style={{ marginBottom: '0.5em' }} onClick={() => this.addSuggestedGoal('Learn new skills and technologies')}>
                    <Icon name="graduation cap" />
                    Learn Skills
                  </Button>
                }
                content="Focus on acquiring new knowledge and technical skills"
                position="top center"
              />
              <Popup
                trigger={
                  <Button basic style={{ marginBottom: '0.5em' }} onClick={() => this.addSuggestedGoal('Manage personal finances effectively')}>
                    <Icon name="dollar sign" />
                    Financial Management
                  </Button>
                }
                content="Get help with budgeting, investments, and financial planning"
                position="top center"
              />
              <Popup
                trigger={
                  <Button basic style={{ marginBottom: '0.5em' }} onClick={() => this.addSuggestedGoal('Stay updated with industry trends')}>
                    <Icon name="chart line" />
                    Industry Trends
                  </Button>
                }
                content="Keep track of developments in your field or areas of interest"
                position="top center"
              />
              <Popup
                trigger={
                  <Button basic style={{ marginBottom: '0.5em' }} onClick={() => this.addSuggestedGoal('Improve productivity and time management')}>
                    <Icon name="clock" />
                    Productivity
                  </Button>
                }
                content="Optimize your workflow and manage time more effectively"
                position="top center"
              />
              <Popup
                trigger={
                  <Button basic style={{ marginBottom: '0.5em' }} onClick={() => this.addSuggestedGoal('Research and analyze documents efficiently')}>
                    <Icon name="search" />
                    Research
                  </Button>
                }
                content="Get assistance with research tasks and document analysis"
                position="top center"
              />
              <Popup
                trigger={
                  <Button basic style={{ marginBottom: '0.5em' }} onClick={() => this.addSuggestedGoal('Generate creative content and ideas')}>
                    <Icon name="lightbulb" />
                    Creativity
                  </Button>
                }
                content="Brainstorm ideas and create original content"
                position="top center"
              />
            </div>
            <Popup
              trigger={<Header as="h4" style={{ marginBottom: '0.5rem', cursor: 'help' }}>Your Goals <Icon name="question circle outline" size="small" /></Header>}
              content="Add your own custom goals or edit the suggested ones. These will guide how your AI assistant helps you."
              position="top left"
            />
            <Form>
              {this.state.goals.map((goal, index) => (
                <Form.Field key={index}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Input
                      placeholder={`Goal ${index + 1}`}
                      value={goal}
                      onChange={(e) => this.handleGoalChange(index, e.target.value)}
                      style={{ flex: 1, marginRight: '10px' }}
                    />
                    {this.state.goals.length > 1 && (
                      <Button
                        icon="trash"
                        color="red"
                        size="small"
                        onClick={() => this.removeGoal(index)}
                      />
                    )}
                  </div>
                </Form.Field>
              ))}
              <Button
                icon="plus"
                content="Add Goal"
                onClick={this.addGoal}
                basic
              />
            </Form>
          </Segment>
        );
      case 3: // Earning Introduction
        return (
          <Segment basic>
            <Message positive>
              <Message.Header>Monetize Your Node</Message.Header>
              <p>Your Sensemaker node can earn Bitcoin by providing services to other nodes in the network.</p>
            </Message>

            <Header as="h4">How It Works</Header>
            <Message>
              <List bulleted>
                <List.Item>Your node connects to other Sensemaker instances</List.Item>
                <List.Item>You offer AI processing, document analysis, and other services</List.Item>
                <List.Item>Other nodes pay you in Bitcoin for these services</List.Item>
                <List.Item>Your node manages all private keys securely</List.Item>
              </List>
            </Message>

            <Header as="h4">Fund Your Node</Header>
            <DepositAddress
              bridge={this.props.bridge}
              autoFetch={true}
              showLabel={true}
              onAddressFetched={(address) => {
                // Update local state for compatibility
                this.setState({
                  depositAddress: address,
                  loadingDepositAddress: false
                });
              }}
            />

            <Message info>
              <Message.Header>Important</Message.Header>
              <p>Only send Bitcoin (BTC) to this address. Your node will automatically manage earnings and payments.</p>
            </Message>
          </Segment>
        );

      default:
        return null;
    }
  };

  render() {
    const { open, currentStep, steps } = this.state;
    const currentStepData = steps[currentStep];
    return (
      <>
        <Icon
          name="graduation cap"
          size="large"
          style={{ cursor: 'pointer', color: 'black' }}
          onClick={this.handleOpen}
        />
        <Modal
          open={open}
          onClose={this.handleClose}
          size="large"
          centered
          closeIcon={false}
          style={{ maxWidth: '600px' }}
        >
          <Modal.Header>First-Time Setup</Modal.Header>
          <Modal.Content
            className="onboarding-modal-content"
            style={{
              height: this.state.contentHeight,
              minHeight: '300px',
              maxHeight: '70vh',
              padding: 0,
              overflow: 'auto',
              transition: 'height 400ms ease-in-out'
            }}
          >
            <div ref={this.contentRef} style={{
              opacity: this.state.contentVisible ? 1 : 0,
              transition: 'opacity 300ms ease-in-out',
              padding: '0'
            }}>
              {this.renderStepContent()}
            </div>
          </Modal.Content>
          <Modal.Actions style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: '0 0 200px', marginRight: '1rem' }}>
              {this.state.savingConfiguration ? (
                <>
                  <Progress
                    percent={this.state.saveProgress}
                    indicating
                    progress
                    size="small"
                    color="green"
                    style={{ marginBottom: '0.5rem' }}
                  />
                  <div style={{ fontSize: '0.85em', color: '#666', textAlign: 'left' }}>
                    {this.state.saveProgressLabel}
                  </div>
                </>
              ) : currentStep === 0 ? null : (
                <>
                  <Progress
                    percent={Math.round((currentStep / (steps.length - 1)) * 100)}
                    size="small"
                    color="blue"
                    style={{ marginBottom: '0.5rem' }}
                  />
                  <div style={{ fontSize: '0.85em', color: '#666', textAlign: 'left' }}>
                    Step {currentStep} of {steps.length - 1}
                  </div>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {currentStep > 0 && !this.state.savingConfiguration && (
                <Button
                  onClick={this.handlePrevious}
                  disabled={this.state.transitioning}
                >
                  <Icon name="left chevron" />
                  Previous
                </Button>
              )}
              <Button
                primary
                onClick={this.handleNext}
                disabled={this.state.transitioning || !this.canCompleteCurrentStep() || this.state.savingConfiguration}
                loading={this.state.transitioning || this.state.savingConfiguration}
              >
                {this.state.savingConfiguration ? 'Saving Configuration...' :
                  currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
                {currentStep < steps.length - 1 && !this.state.savingConfiguration && <Icon name="right chevron" />}
              </Button>
            </div>
          </Modal.Actions>
        </Modal>
      </>
    );
  }
}

module.exports = Onboarding;