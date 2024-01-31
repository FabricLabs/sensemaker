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
      selectedOption: 'Plaintiff',
      jurisdictionsOptions: null,
      courtsOptions: null,
    };
  }

  componentDidMount() {
    this.props.fetchCourts();
    this.props.fetchJurisdictions();
  }

  componentDidUpdate(prevProps) {
    const { jurisdictions, courts } = this.props;
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
  };


  render() {
    const { jurisdictions, courts } = this.props;
    const { loading, selectedOption, courtsOptions, jurisdictionsOptions } = this.state;

    console.log("jurisdictions", jurisdictions);
    console.log("courts", courts);

    return (
      <Segment style={{ marginRight: '1em', height: '97vh' }} className='center-elements-column'>
        <Header as='h1'>New Matters</Header>
        <Form style={{ minWidth: '500px', marginTop: '2em' }} loading={(jurisdictions.loading || courts.loading)}>

          <Table basic='very' stripped>
            <Table.Body>
              <Table.Row >
                <Table.Cell width={5}>
                  <Header as='h4'>Matter Name</Header>
                </Table.Cell>
                <Table.Cell width={10}>
                  <Form.Input required />
                </Table.Cell>
                <Table.Cell width={1} />
              </Table.Row>
              <Table.Row>
                <Table.Cell width={5}>
                  <Header as='h4'>Plaintiff</Header>
                </Table.Cell>
                <Table.Cell width={10}>
                  <Form.Input required />
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
                <Table.Cell width={5}>
                  <Header as='h4'>Defendant</Header>
                </Table.Cell>
                <Table.Cell width={10}>
                  <Form.Input required />
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
                <Table.Cell width={5}>
                  <Header as='h4'>Who are you representing?</Header>
                </Table.Cell>
                <Table.Cell width={10}>
                  <FormField>
                    <Checkbox
                      radio
                      label='Plaintiff'
                      name='checkboxRadioGroup'
                      value='Plaintiff'
                      checked={selectedOption === 'Plaintiff'}
                      onChange={(e, data) => this.setState({ selectedOption: data.value })}
                    />
                  </FormField>
                  <FormField>
                    <Checkbox
                      radio
                      label='Defendant'
                      name='checkboxRadioGroup'
                      value='Defendant'
                      checked={selectedOption === 'Defendant'}
                      onChange={(e, data) => this.setState({ selectedOption: data.value })}
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
                  />
                </Table.Cell>
                <Table.Cell />
              </Table.Row>
              <Table.Row>
                <Table.Cell />
                <Table.Cell>
                  <Form.TextArea name='description' label='Description' rows={4} />
                </Table.Cell>
                <Table.Cell />
              </Table.Row>
              <Table.Row>
                <Table.Cell />
                <Table.Cell>
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
