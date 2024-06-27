'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link, Navigate } = require('react-router-dom');

const {
  Segment,
  Header,
  Icon,
  Button,
  Form,
  Popup,
  Table,
  FormField,
  Checkbox,
  Message,
} = require('semantic-ui-react');

class MattersNew extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {
      representingOption: 'Plaintiff',
      jurisdictionsOptions: null,
      courtsOptions: null,
      title: '',
      description: null,
      plaintiff: '',
      defendant: '',
      court_id: null,
      jurisdiction_id: null,
      jurisdictionError: false,
      creating: false,
      resetFlag: false,
      errorCreating: '',
    };
    this.handleSubmit = this.handleSubmit.bind(this);

  }

  componentDidMount() {
    this.props.fetchJurisdictions();
  }

  componentDidUpdate(prevProps) {
    const { jurisdictions, courts, matters } = this.props;
    //this block builds the options for the jurisdiction options
    if (prevProps.jurisdictions !== jurisdictions) {
      if (jurisdictions.jurisdictions.length > 0) {
        const options = jurisdictions.jurisdictions.map(instance => ({
          key: instance.id,
          value: instance.id,
          text: instance.name
        }));
        options.sort((a, b) => a.text.localeCompare(b.text));
        this.setState({ jurisdictionsOptions: options });
      }
    }
    //this block builds the options for the courts options, the app will come here after jurisdiction is selected
    if (prevProps.courts !== courts) {
      if (courts.courts.length > 0) {
        const options = courts.courts.map(instance => ({
          key: instance.id,
          value: instance.id,
          text: instance.name
        }));
        options.sort((a, b) => a.text.localeCompare(b.text));
        options.unshift({
          key: 'none',
          value: '',
          text: 'None'
        });
        this.setState({ courtsOptions: options });
      }
    }
    if (this.state.creating) {
      if (prevProps.matters !== matters && !matters.loading) {
        if (matters.creationSuccess) {
          this.setState({ creating: false, resetFlag: true, errorCreating: '' });
        } else {
          this.setState({ creating: false, errorCreating: matters.error });
        }
      }
    }
  };

  handleInputChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value
    });
  };

  resetForm = () => {
    this.setState({
      representingOption: 'Plaintiff',
      jurisdictionsOptions: null,
      courtsOptions: null,
      title: '',
      description: null,
      plaintiff: '',
      defendant: '',
      court_id: null,
      jurisdiction_id: null,
      jurisdictionError: false,
      creating: false,
      resetFlag: false,
    })
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    const { representingOption, title, description, defendant, plaintiff, court_id, jurisdiction_id } = this.state;

    this.setState({ jurisdictionError: jurisdiction_id === null, });

    // Check all conditions are met before proceeding
    if (title && plaintiff && defendant && jurisdiction_id !== null) {
      this.setState({ creating: true });
      const representing = representingOption === 'Plaintiff' ? 'P' : 'D';
      console.log('este es el court id', court_id);
      this.props.createMatter(title, description, plaintiff, defendant, representing, jurisdiction_id, court_id);
    }
  };

  selectJurisdiction = (value) => {
    const { courts } = this.props;
    this.setState({ jurisdiction_id: value, jurisdictionError: false });
    //once the jurisdiction is selected, it looks for the courts related to that jurisdiction
    this.props.fetchCourtsByJurisdiction(value);
  }

  render() {
    const { jurisdictions, courts, matters } = this.props;
    const {
      representingOption,
      courtsOptions,
      jurisdictionsOptions,
      jurisdictionError,
      resetFlag,
      title,
      errorCreating
    } = this.state;


    const jurisdictionErrorMessage = (!jurisdictionError) ? null : {
      content: 'Please select a jurisdiction',
      pointing: 'above',
    };

    return (
      <Segment style={{ height: '97vh', overflow: 'visible' }} className='center-elements-column'>
        <Header as='h1'>New Matter</Header>
        {(matters && matters.creationSuccess && resetFlag && !errorCreating) ? (
          <Message positive style={{ maxWidth: '350px' }}>
            <Message.Header>Matter successfully created!</Message.Header>
            <Message.Content className='center-elements-column'>
              <p>Your Matter was created, you can add files and notes to it, you can visit your Matter page by clicking here:</p>
              <Link to={`/matters/${matters.idCreated}`} onClick={this.resetForm}><h3>{title}</h3></Link>
            </Message.Content>
          </Message>
        ) : (
          <Form
            onSubmit={this.handleSubmit}
            loading={(jurisdictions.loading || courts.loading)}
            className='ui segment new-matter-form'
            style={{ position: 'relative', zIndex: 1000, overflow: 'visible' }}
          >
            <Table basic='very' stripped>
              <Table.Body>
                <Table.Row >
                  <Table.Cell width={3} className='required field'>
                    <label className='matter-label'>Matter Name</label>
                  </Table.Cell>
                  <Table.Cell width={12}>
                    <Form.Input name='title' required onChange={this.handleInputChange} />
                  </Table.Cell>
                  <Table.Cell width={1} />
                </Table.Row>
                <Table.Row>
                  <Table.Cell width={3} className='required field'>
                    <label className='matter-label'>Plaintiff</label>
                  </Table.Cell>
                  <Table.Cell width={12}>
                    <Form.Input name='plaintiff' required onChange={this.handleInputChange} />
                  </Table.Cell>
                  <Table.Cell width={1}>
                    <Popup trigger={<Icon name='info circle' />}>
                      <Popup.Content>
                        <p>Write however these will appear in court documents</p>
                      </Popup.Content>
                    </Popup>
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell width={3} className='required field'>
                    <label className='matter-label'>Defendant</label>
                  </Table.Cell>
                  <Table.Cell width={12}>
                    <Form.Input name='defendant' required onChange={this.handleInputChange} />
                  </Table.Cell>
                  <Table.Cell width={1}>
                    <Popup trigger={<Icon name='info circle' />}>
                      <Popup.Content>
                        <p>Write however these will appear in court documents</p>
                      </Popup.Content>
                    </Popup>
                  </Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell width={3} className='required field'>
                    <label className='matter-label'>Who are you representing?</label>
                  </Table.Cell>
                  <Table.Cell width={12}>
                    <FormField>
                      <Checkbox
                        radio
                        label='Plaintiff'
                        name='checkboxRadioGroup'
                        value='Plaintiff'
                        checked={representingOption === 'Plaintiff'}
                        onChange={(e, data) => this.setState({ representingOption: data.value })}
                      />
                    </FormField>
                    <FormField>
                      <Checkbox
                        radio
                        label='Defendant'
                        name='checkboxRadioGroup'
                        value='Defendant'
                        checked={representingOption === 'Defendant'}
                        onChange={(e, data) => this.setState({ representingOption: data.value })}
                      />
                    </FormField>
                  </Table.Cell>
                  <Table.Cell width={1} />
                </Table.Row>
                <Table.Row>
                  <Table.Cell />
                  <Table.Cell>
                    <Form.Dropdown
                      placeholder='Select Jurisdiction'
                      label='Jurisdiction'
                      fluid
                      search
                      selection
                      required
                      options={jurisdictionsOptions}
                      onChange={(e, { value }) => this.selectJurisdiction(value)}
                      error={jurisdictionErrorMessage}
                    />
                  </Table.Cell>
                  <Table.Cell />
                </Table.Row>
                <Table.Row>
                  <Table.Cell />
                  <Table.Cell>
                    <Form.Dropdown
                      placeholder='Select Court'
                      label='Court (optional)'
                      fluid
                      search
                      selection
                      options={courtsOptions}
                      onChange={(e, { value }) => this.setState({ court_id: value })}
                      disabled={!this.state.jurisdiction_id || this.props.courts.loading}
                    />
                  </Table.Cell>
                  <Table.Cell />
                </Table.Row>
                <Table.Row>
                  <Table.Cell />
                  <Table.Cell>
                    <Form.TextArea
                      name='description'
                      label='Description (optional)'
                      rows={4}
                      onChange={this.handleInputChange} />
                  </Table.Cell>
                  <Table.Cell />
                </Table.Row>
                {errorCreating && (
                  <Table.Row>
                    <Table.Cell />
                    <Table.Cell>
                      <Message negative style={{ maxWidth: '500px' }}>
                        <Message.Header content='Error Creating this Matter' />
                        <Message.Content content={errorCreating} />
                      </Message>
                    </Table.Cell>
                    <Table.Cell />
                  </Table.Row>)}
                <Table.Row>
                  <Table.Cell />
                  <Table.Cell >
                    <Button.Group>
                      <Link to={"/matters/"} disabled={this.state.creating}>
                        <Form.Button
                          secondary
                          content='Cancel'
                          disabled={this.state.creating}
                        />
                      </Link>
                      <Form.Button
                        primary
                        content='Create'
                        style={{ marginLeft: '1em' }}
                        type='submit'
                        loading={this.state.creating}
                      />
                    </Button.Group>
                  </Table.Cell>
                  <Table.Cell />
                </Table.Row>
              </Table.Body>
            </Table>
          </Form>
        )}
        {/* <Link to={"/matters/"}>Back to Matters </Link> */}
      </Segment>
    );
  }

  _toHTML() {
    return ReactDOMServer.renderToString(this.render());
  }

  toHTML() {
    return this._toHTML();
  }
}

module.exports = MattersNew;
