'use strict';

const React = require('react');
const {
  Button,
  Checkbox,
  Header,
  List,
  Loader,
  Message,
  Segment
} = require('semantic-ui-react');

function pubkeyOf (peer) {
  const raw = peer && (peer.peerID || peer.pubkey);
  if (!raw || peer.isLocal) return null;
  const hex = String(raw).trim().toLowerCase().replace(/^0x/, '');
  if (/^0[23][0-9a-f]{64}$/.test(hex)) return hex.slice(2);
  if (/^[0-9a-f]{64}$/.test(hex)) return hex;
  return null;
}

class LibraryShare extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      loading: true,
      peers: [],
      selected: {},
      library: null,
      error: null,
      notice: null,
      busy: false
    };
    this.load = this.load.bind(this);
    this.toggle = this.toggle.bind(this);
    this.share = this.share.bind(this);
    this.revoke = this.revoke.bind(this);
  }

  componentDidMount () {
    this.load();
  }

  headers () {
    const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
    if (this.props.token) headers.Authorization = 'Bearer ' + this.props.token;
    return headers;
  }

  async load () {
    const folderId = this.props.folderId;
    if (!folderId) return;
    this.setState({ loading: true, error: null });
    try {
      const [peerRes, shareRes] = await Promise.all([
        fetch('/peers', { headers: this.headers() }),
        fetch('/documents/' + encodeURIComponent(folderId) + '/share', { headers: this.headers() })
      ]);
      const peerBody = await peerRes.json();
      const shareBody = await shareRes.json();
      if (!shareRes.ok) {
        throw new Error(shareBody.message || 'Could not load this library.');
      }
      const peers = [];
      const seen = new Set();
      for (const row of (peerBody && peerBody.peers) || []) {
        const id = pubkeyOf(row);
        if (!id || seen.has(id) || row.connected === false) continue;
        seen.add(id);
        peers.push({
          id,
          title: row.alias || row.title || (id.slice(0, 12) + '…')
        });
      }
      this.setState({
        loading: false,
        peers,
        library: shareBody,
        selected: {}
      });
    } catch (err) {
      this.setState({
        loading: false,
        error: err.message || 'Could not load peers.'
      });
    }
  }

  toggle (id) {
    this.setState((prev) => {
      const selected = Object.assign({}, prev.selected);
      selected[id] = !selected[id];
      return { selected };
    });
  }

  chosen () {
    return Object.keys(this.state.selected).filter((id) => this.state.selected[id]);
  }

  async post (method) {
    const peers = this.chosen();
    if (!peers.length) {
      this.setState({ error: 'Select a peer.' });
      return;
    }
    this.setState({ busy: true, error: null, notice: null });
    try {
      const response = await fetch('/documents/' + encodeURIComponent(this.props.folderId) + '/share', {
        method,
        headers: this.headers(),
        body: JSON.stringify({ peers })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Request failed.');
      this.setState({
        busy: false,
        notice: method === 'DELETE' ? 'Share revoked.' : 'Library shared.',
        selected: {}
      });
      await this.load();
    } catch (err) {
      this.setState({ busy: false, error: err.message || 'Request failed.' });
    }
  }

  share () {
    return this.post('POST');
  }

  revoke () {
    return this.post('DELETE');
  }

  render () {
    const library = this.state.library;
    const shared = (library && library.recipients) || [];
    return (
      <Segment>
        <Header as='h3'>Data library</Header>
        <p>Share this folder as a document list. Peers receive the catalog, not the file bytes, until they request a file.</p>
        {this.state.loading ? <Loader active inline size='small' /> : null}
        {this.state.error ? <Message negative content={this.state.error} /> : null}
        {this.state.notice ? <Message positive content={this.state.notice} /> : null}
        {library && library.shared ? (
          <p>{library.documents} documents shared with {shared.length} {shared.length === 1 ? 'peer' : 'peers'}.</p>
        ) : (
          <p>This folder is not shared.</p>
        )}
        {shared.length ? (
          <List>
            {shared.map((id) => (
              <List.Item key={id}>
                <Checkbox
                  label={id.slice(0, 16) + '…'}
                  checked={!!this.state.selected[id]}
                  onChange={() => this.toggle(id)}
                />
              </List.Item>
            ))}
          </List>
        ) : null}
        {this.state.peers.length ? (
          <List>
            {this.state.peers.filter((peer) => shared.indexOf(peer.id) < 0).map((peer) => (
              <List.Item key={peer.id}>
                <Checkbox
                  label={peer.title}
                  checked={!!this.state.selected[peer.id]}
                  onChange={() => this.toggle(peer.id)}
                />
              </List.Item>
            ))}
          </List>
        ) : (!this.state.loading ? <p>No connected peers with a public key.</p> : null)}
        <Button primary disabled={this.state.busy} onClick={this.share}>Share</Button>
        <Button disabled={this.state.busy} onClick={this.revoke}>Revoke</Button>
      </Segment>
    );
  }
}

module.exports = LibraryShare;
