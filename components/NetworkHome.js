'use strict';

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Button,
  Card,
  Segment,
  Header,
  Label,
  List,
  Loader,
  Divider,
  Icon,
  Table
} = require('semantic-ui-react');

class NetworkHome extends React.Component {
  constructor (settings = {}) {
    super(settings);

    this.state = {
      loading: false,
    };
  }

  componentDidMount () {
    // this.props.fetchPeers();
  }

  componentDidUpdate (prevProps) {
    const { peers } = this.props;
    if (prevProps.peers !== peers) {
      // if (!peers.loading) {
      //   this.setState({ loading: false });
      // }
    }
  };

  render () {
    const { network } = this.props;
    // const { loading } = this.state;

    return (
      <Segment loading={network.loading} style={{ maxHeight: '100%', height: '97vh' }}>
        <Header as='h1'>NETWORK</Header>
        <Card>
          <Card.Content>
            <Card.Header>Status</Card.Header>
            <Card.Meta>Connected</Card.Meta>
            <Card.Description>
              <Icon name='check' color='green' /> Connected to the network.
            </Card.Description>
          </Card.Content>
        </Card>
        <Divider />
        <Header as='h2'>Local</Header>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Peer</Table.HeaderCell>
              <Table.HeaderCell>Address</Table.HeaderCell>
              <Table.HeaderCell>Port</Table.HeaderCell>
              <Table.HeaderCell>Protocol</Table.HeaderCell>
              <Table.HeaderCell>Connected</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell><Label>sensemaker@localhost</Label></Table.Cell>
              <Table.Cell><code>127.0.0.1</code></Table.Cell>
              <Table.Cell><code>3040</code></Table.Cell>
              <Table.Cell><code>http</code></Table.Cell>
              <Table.Cell><Icon name='check' color='green' /></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell><Label>sensemaker@localhost</Label></Table.Cell>
              <Table.Cell><code>127.0.0.1</code></Table.Cell>
              <Table.Cell><code>3040</code></Table.Cell>
              <Table.Cell><code>ws</code></Table.Cell>
              <Table.Cell><Icon name='check' color='green' /></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell><Label>sensemaker@localhost</Label></Table.Cell>
              <Table.Cell><code>127.0.0.1</code></Table.Cell>
              <Table.Cell><code>7777</code></Table.Cell>
              <Table.Cell><code>fabric</code></Table.Cell>
              <Table.Cell><Icon name='check' color='green' /></Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell><Label>ollama@localhost</Label></Table.Cell>
              <Table.Cell><code>127.0.0.1</code></Table.Cell>
              <Table.Cell><code>11434</code></Table.Cell>
              <Table.Cell><code>http</code></Table.Cell>
              <Table.Cell><Icon name='check' color='green' /></Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>

        <Header as='h2'>Peers</Header>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Peer</Table.HeaderCell>
              <Table.HeaderCell>Address</Table.HeaderCell>
              <Table.HeaderCell>Port</Table.HeaderCell>
              <Table.HeaderCell>Protocol</Table.HeaderCell>
              <Table.HeaderCell>Connected</Table.HeaderCell>
              <Table.HeaderCell>Controls</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {network && network.peers && network.peers
              .map(instance => {
                return (<Table.Row>
                  <Table.Cell><Link to={"/peers/" + instance.id}>{instance.title}</Link></Table.Cell>
                  <Table.Cell>{instance.address}</Table.Cell>
                  <Table.Cell>{instance.port}</Table.Cell>
                  <Table.Cell>{instance.protocol}</Table.Cell>
                  <Table.Cell>{instance.connected ? <Icon name='check' color='green' /> : <Icon name='close' color='red' />}</Table.Cell>
                  <Table.Cell><Button><Icon name='stop' /></Button></Table.Cell>
                </Table.Row>)
              })}
          </Table.Body>
        </Table>

        <Divider />

        <Link to={"/peers/new"}>
          <Button primary content='+ Connect Peer' />
        </Link>

        <Header as='h3'>Fabric</Header>
        <List>{network && network.peers && network.peers.map(instance => (<List.Item style={{ marginTop: '0.5em' }}><Header as='h3'><Link to={"/peers/" + instance.id}>{instance.title}</Link></Header></List.Item>))}</List>
      </Segment>
    );
  }

  _toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }

  toHTML () {
    return this._toHTML();
  }
}

module.exports = NetworkHome;
