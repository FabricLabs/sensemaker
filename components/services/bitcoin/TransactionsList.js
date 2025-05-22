'use strict';

const React = require('react');
const { Link } = require('react-router-dom');
const { List, Header } = require('semantic-ui-react');
const toRelativeTime = require('../../../functions/toRelativeTime');
const truncateMiddle = require('../../../functions/truncateMiddle');

class TransactionsList extends React.Component {
  render() {
    const { transactions } = this.props;

    return (
      <div>
        <List divided relaxed>
          {transactions && transactions.length ? (
            transactions.slice(0, 5).map((tx, index) => (
              <List.Item key={index}>
                <List.Content>
                  <List.Header>
                    <Link to={`/services/bitcoin/transactions/` + tx.txid}>
                      {truncateMiddle(tx.txid || '', 11, '…')}
                    </Link>
                  </List.Header>
                  <List.Description>
                    {tx.value.toFixed(8)} BTC • {toRelativeTime(new Date(tx.time * 1000))}
                  </List.Description>
                </List.Content>
              </List.Item>
            ))
          ) : (
            <List.Item>
              <List.Content>
                <List.Description>No recent transactions</List.Description>
              </List.Content>
            </List.Item>
          )}
        </List>
      </div>
    );
  }
}

module.exports = TransactionsList; 