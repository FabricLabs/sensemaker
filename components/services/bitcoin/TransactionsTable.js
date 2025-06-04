'use strict';

const React = require('react');
const { Link } = require('react-router-dom');
const { Table } = require('semantic-ui-react');
const toRelativeTime = require('../../../functions/toRelativeTime');
const truncateMiddle = require('../../../functions/truncateMiddle');

class TransactionsTable extends React.Component {
  render () {
    const { transactions } = this.props;

    return (
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Hash</Table.HeaderCell>
            <Table.HeaderCell>Block</Table.HeaderCell>
            <Table.HeaderCell>Timestamp</Table.HeaderCell>
            <Table.HeaderCell>Inputs</Table.HeaderCell>
            <Table.HeaderCell>Outputs</Table.HeaderCell>
            <Table.HeaderCell textAlign='right'>Amount</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {transactions && transactions.length ? (
            transactions.slice(0, 5).map((tx, index) => (
              <Table.Row key={index}>
                <Table.Cell><Link to={`/services/bitcoin/transactions/` + tx.txid}>{truncateMiddle(tx.txid || '', 11, '…')}</Link></Table.Cell>
                <Table.Cell>
                  {(tx.height >= 0) ? <Link to={`/services/bitcoin/blocks/` + tx.blockhash}>{truncateMiddle(tx.blockhash || '', 11, '…')} (#{tx.height})</Link> : '(unconfirmed)'}
                </Table.Cell>
                <Table.Cell><abbr title={(new Date(tx.time * 1000)).toISOString()}>{toRelativeTime(new Date(tx.time * 1000))}</abbr></Table.Cell>
                <Table.Cell>{tx.vin && tx.vin.length} inputs</Table.Cell>
                <Table.Cell>{tx.vout && tx.vout.length} outputs</Table.Cell>
                <Table.Cell textAlign='right'>{tx.value.toFixed(8)} BTC</Table.Cell>
              </Table.Row>
            ))
          ) : (
            <Table.Row>
              <Table.Cell colSpan='6' textAlign='center'>No recent transactions</Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    );
  }
}

module.exports = TransactionsTable; 