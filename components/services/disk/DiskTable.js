'use strict';

// Dependencies
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { Link } = require('react-router-dom');

const {
  Icon,
  Table
} = require('semantic-ui-react');

const toRelativeTime = require('../../../functions/toRelativeTime');
// const truncateMiddle = require('../../../functions/truncateMiddle');

class DiskTable extends React.Component {
  constructor (props) {
    super(props);

    // Settings
    this.settings = Object.assign({
      debug: false,
      disk: {},
      state: {
        disk: {}
      }
    }, props);

    // React State
    this.state = {
      ...this.settings.state
    };

    // Fabric State
    this._state = {
      disk: {},
      content: this.settings.state
    };

    return this;
  }

  render () {
    const { disk } = this.props;
    return (
      <Table loading={disk.loading}>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Size</Table.HeaderCell>
            <Table.HeaderCell>Created</Table.HeaderCell>
            <Table.HeaderCell>Modified</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {disk?.object?.list && disk.object.list.map((file) => (
            <Table.Row key={file.id}>
              <Table.Cell><Icon name={(
                file.stats.isDirectory
                  ? 'folder'
                  : 'file'
              )} /> <Link to={`/services/disk/${file.path}`}>{file.name}</Link></Table.Cell>
              <Table.Cell>{file.stats.size.toLocaleString() } bytes</Table.Cell>
              <Table.Cell>{toRelativeTime(file.stats.birthtime)}</Table.Cell>
              <Table.Cell>{toRelativeTime(file.stats.mtime)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    );
  }

  toHTML () {
    return ReactDOMServer.renderToString(this.render());
  }
}

module.exports = DiskTable;
