'use strict';

const React = require('react');
const { Table } = require('semantic-ui-react');

class NodesTable extends React.Component {
  render () {
    const { nodes } = this.props;

    return (
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Network</Table.HeaderCell>
            <Table.HeaderCell>URL</Table.HeaderCell>
            <Table.HeaderCell>Roles</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {nodes && nodes.map((node, index) => (
            <Table.Row key={index}>
              <Table.Cell>{node.name}</Table.Cell>
              <Table.Cell>{node.network}</Table.Cell>
              <Table.Cell>{node.url}</Table.Cell>
              <Table.Cell>{node.roles.join(', ')}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    );
  }
}

module.exports = NodesTable; 