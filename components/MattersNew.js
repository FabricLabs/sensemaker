'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Card,
  Segment,
  Header,
  Label,
  List,
  Loader,
  Icon,
  Button,
  Form,
  Input,
  Popup,
  Table,
  FormField,
  Checkbox,
  Dropdown,
  TextArea,
} = require('semantic-ui-react');

class MattersNew extends React.Component {
  constructor(settings = {}) {
    super(settings);
    this.state = {
      loading: false,
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

    };
    this.handleSubmit = this.handleSubmit.bind(this);

  }

  componentDidMount() {
    this.props.fetchCourts();
    this.props.fetchJurisdictions();
  }

  componentDidUpdate(prevProps) {
    const { jurisdictions, courts, matters } = this.props;
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
        if(matters.creationSuccess)
        {
          console.log("matter creado");
        } else {
          console.log(matters.error);

        }
      }
    }
  };

  handleInputChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value
    });
  };

  handleSubmit = async (event) => {
    const {
      representingOption,
      title,
      description,
      defendant,
      plaintiff,
      court_id,
      jurisdiction_id
    } = this.state;
    event.preventDefault();
    if (jurisdiction_id === null) {
      this.setState({ jurisdictionError: true });
    } else {
      this.setState({ creating: true });
      const representing = (representingOption === 'Plaintiff' ? 'P' : 'D');
      this.props.createMatter(title, plaintiff, defendant, representing, jurisdiction_id, court_id);
      console.log
        (representing,
          title,
          description,
          plaintiff,
          defendant,
          court_id,
          jurisdiction_id);
    }
  }

  render() {
    const { jurisdictions, courts } = this.props;
    const { loading, representingOption, courtsOptions, jurisdictionsOptions, jurisdictionError } = this.state;

    const jurisdictionErrorMessage = (!jurisdictionError) ? null : {
      content: 'Please select a jurisdiction',
      pointing: 'above',
    };
    return (
      <Segment style={{ marginRight: '1em', height: '97vh', overflow: 'visible' }} className='center-elements-column'>
        <Header as='h1'>New Matter</Header>
        <Form
          onSubmit={this.handleSubmit}
          loading={(jurisdictions.loading || courts.loading)}
          className='ui segment new-matter-form'
          style={{ position: 'relative', zIndex: 1000, overflow: 'visible' }}
        >
          <Table basic='very' stripped>
            <Table.Body>
              <Table.Row >
                <Table.Cell width={3}>
                  <Header as='h4'>Matter Name</Header>
                </Table.Cell>
                <Table.Cell width={12}>
                  <Form.Input name='title' required onChange={this.handleInputChange} />
                </Table.Cell>
                <Table.Cell width={1} />
              </Table.Row>
              <Table.Row>
                <Table.Cell width={3}>
                  <Header as='h4'  >Plaintiff</Header>
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
                <Table.Cell width={3}>
                  <Header as='h4'>Defendant</Header>
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
                <Table.Cell width={3}>
                  <Header as='h4'>Who are you representing?</Header>
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
                    required={true}
                    options={jurisdictionsOptions}
                    onChange={(e, { value }) => this.setState({ jurisdiction_id: value, jurisdictionError: false })}
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
              <Table.Row>
                <Table.Cell />
                <Table.Cell >
                  <Button.Group>
                    <Link to={"/matters/"}>
                      <Form.Button
                        secondary
                        content='Cancel'
                      />
                    </Link>
                    <Form.Button
                      primary
                      content='Create'
                      style={{ marginLeft: '1em' }}
                      type='submit'
                    />
                  </Button.Group>
                </Table.Cell>
                <Table.Cell />
              </Table.Row>
            </Table.Body>
          </Table>
          {/* <Input label='Matter Name' name='matterName'></Input> */}

        </Form>

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
