'use strict';

const React = require('react');
const { Link } = require('react-router-dom');
const { Table } = require('semantic-ui-react');
const toRelativeTime = require('../../../functions/toRelativeTime');
const truncateMiddle = require('../../../functions/truncateMiddle');

class BlocksTable extends React.Component {
  render () {
    const { blocks } = this.props;

    return (
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Height</Table.HeaderCell>
            <Table.HeaderCell>Hash</Table.HeaderCell>
            <Table.HeaderCell>Timestamp</Table.HeaderCell>
            <Table.HeaderCell>Transactions</Table.HeaderCell>
            <Table.HeaderCell>Size</Table.HeaderCell>
            <Table.HeaderCell>Subsidy</Table.HeaderCell>
            <Table.HeaderCell>Fees Paid</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {blocks && blocks.length ? (
            blocks.slice(0, 5).map((block, index) => (
              <Table.Row key={index}>
                <Table.Cell>{block.height}</Table.Cell>
                <Table.Cell><Link to={`/services/bitcoin/blocks/` + block.hash}>{truncateMiddle(block.hash || '', 11, '…')}</Link></Table.Cell>
                <Table.Cell><abbr title={(new Date(block.time * 1000)).toISOString()}>{toRelativeTime(new Date(block.time * 1000))}</abbr></Table.Cell>
                <Table.Cell>{block.nTx}</Table.Cell>
                <Table.Cell>{(block.size / 1024 / 1024).toFixed(3)} MB</Table.Cell>
                <Table.Cell>{block.subsidy?.toFixed(8)} BTC</Table.Cell>
                <Table.Cell>{block.feesPaid?.toFixed(8)} BTC</Table.Cell>
              </Table.Row>
            ))
          ) : (
            <Table.Row>
              <Table.Cell colSpan='7' textAlign='center'>No recent blocks</Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    );
  }
}

module.exports = BlocksTable; 