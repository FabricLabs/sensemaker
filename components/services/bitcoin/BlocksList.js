'use strict';

const React = require('react');
const { Link } = require('react-router-dom');
const { List } = require('semantic-ui-react');
const toRelativeTime = require('../../../functions/toRelativeTime');
const truncateMiddle = require('../../../functions/truncateMiddle');

class BlocksList extends React.Component {
  render() {
    const { blocks } = this.props;

    return (
      <List divided relaxed>
        {blocks && blocks.length ? (
          blocks.slice(0, 5).map((block, index) => (
            <List.Item key={index}>
              <List.Content>
                <List.Header>
                  <Link to={`/services/bitcoin/blocks/` + block.hash}>
                    Block #{block.height}
                  </Link>
                </List.Header>
                <List.Description>
                  {block.nTx} transactions • {toRelativeTime(new Date(block.time * 1000))}
                </List.Description>
              </List.Content>
            </List.Item>
          ))
        ) : (
          <List.Item>
            <List.Content>
              <List.Description>No recent blocks</List.Description>
            </List.Content>
          </List.Item>
        )}
      </List>
    );
  }
}

module.exports = BlocksList; 