'use strict';

const React = require('react');
const { Link } = require('react-router-dom');
const { List, Header } = require('semantic-ui-react');

class NodesList extends React.Component {
  render() {
    const { nodes } = this.props;

    return (
      <div>
        <Header as='h2'>
          <Link to='/services/bitcoin/nodes'>Nodes</Link>
        </Header>
        <List divided relaxed>
          {nodes && nodes.length ? (
            nodes.map((node, index) => (
              <List.Item key={index}>
                <List.Content>
                  <List.Header>{node.name}</List.Header>
                  <List.Description>
                    {node.network} • {node.roles.join(', ')}
                  </List.Description>
                </List.Content>
              </List.Item>
            ))
          ) : (
            <List.Item>
              <List.Content>
                <List.Description>No nodes available</List.Description>
              </List.Content>
            </List.Item>
          )}
        </List>
      </div>
    );
  }
}

module.exports = NodesList; 