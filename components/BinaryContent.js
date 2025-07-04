'use strict';

const React = require('react');
const merge = require('lodash.merge');

const {
  Button,
  Icon,
  Message,
  Segment,
  Header,
  Dropdown
} = require('semantic-ui-react');

class BinaryContent extends React.Component {
  constructor (props = {}) {
    super(props);

    this.settings = merge({
      state: {
        status: 'INITIALIZED',
        bytesPerRow: 16,
        showOffsets: true,
        offsetFormat: 'hex', // hex, decimal
        currentContent: '',
        viewMode: 'hex', // hex, text, mixed
        error: null,
        loading: false
      }
    }, props);

    this.state = this.settings.state;

    return this;
  }

  componentDidMount () {
    this.fetchBlobContent();
  }

  componentDidUpdate (prevProps) {
    // Fetch blob content if latest_blob_id changes
    if (prevProps.latest_blob_id !== this.props.latest_blob_id) {
      this.fetchBlobContent();
    }
  }

  fetchBlobContent = async () => {
    const { latest_blob_id, content } = this.props;
    console.debug('[BinaryContent] fetchBlobContent called with:', { latest_blob_id, contentLength: content?.length });

    // If we have content directly, use it
    if (content) {
      console.debug('[BinaryContent] Using direct content');
      this.setState({ currentContent: content, status: 'READY' });
      return;
    }

    // If we have a blob ID, fetch the blob content
    if (latest_blob_id) {
      console.debug('[BinaryContent] Fetching blob:', latest_blob_id);
      this.setState({ loading: true, error: null });
      try {
        const response = await fetch(`/blobs/${latest_blob_id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
        }

        // Get the content as array buffer for binary data
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        console.debug('[BinaryContent] Fetched blob data:', { 
          arrayBufferSize: arrayBuffer.byteLength,
          firstBytes: Array.from(uint8Array.slice(0, 16))
        });

        // Convert to base64 for our component to handle
        const base64 = btoa(String.fromCharCode.apply(null, uint8Array));

        this.setState({
          currentContent: base64,
          status: 'READY',
          loading: false
        });
      } catch (error) {
        console.error('[BinaryContent] Error fetching blob:', error);
        this.setState({ 
          error: { message: error.message },
          loading: false,
          status: 'ERROR'
        });
      }
    } else {
      console.debug('[BinaryContent] No blob_id or content provided');
      this.setState({ status: 'READY' });
    }
  };

  // Convert content string to byte array
  getBytes = () => {
    const content = this.state.currentContent;
    if (!content) return [];
    
    // Handle both text content and base64 encoded binary data
    try {
      // Since we're now fetching as base64, decode it
      const decoded = atob(content);
      return Array.from(decoded).map(char => char.charCodeAt(0));
    } catch (e) {
      // If base64 decoding fails, try treating as UTF-8 text
      try {
        return Array.from(content).map(char => char.charCodeAt(0));
      } catch (e2) {
        console.error('Failed to parse content as both base64 and text:', e, e2);
        return [];
      }
    }
  };

  // Convert byte to hex string
  toHex = (byte) => {
    return byte.toString(16).padStart(2, '0').toUpperCase();
  };

  // Convert byte to ASCII character or placeholder
  toAscii = (byte) => {
    // Printable ASCII range (32-126)
    if (byte >= 32 && byte <= 126) {
      return String.fromCharCode(byte);
    }
    return '.';
  };

  // Format offset/address
  formatOffset = (offset) => {
    if (this.state.offsetFormat === 'hex') {
      return offset.toString(16).padStart(8, '0').toUpperCase();
    }
    return offset.toString().padStart(8, '0');
  };

  renderHexView = () => {
    const bytes = this.getBytes();
    const { bytesPerRow, showOffsets } = this.state;

    if (bytes.length === 0) {
      return (
        <Message info>
          <Message.Header>No Binary Data</Message.Header>
          <p>This document contains no binary data to display.</p>
        </Message>
      );
    }

    const rows = [];
    for (let i = 0; i < bytes.length; i += bytesPerRow) {
      const rowBytes = bytes.slice(i, i + bytesPerRow);
      rows.push({ offset: i, bytes: rowBytes });
    }

    return (
      <div style={{
        fontFamily: 'monospace',
        fontSize: '14px',
        lineHeight: '1.4',
        backgroundColor: '#f8f9fa',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        padding: '1em',
        overflow: 'auto',
        maxHeight: '70vh'
      }}>
        <div style={{ display: 'flex', marginBottom: '0.5em', fontWeight: 'bold', color: '#666' }}>
          {showOffsets && (
            <div style={{ width: '80px', marginRight: '1em' }}>
              Offset
            </div>
          )}
          <div style={{ flex: 1, marginRight: '1em' }}>
            Hex View
          </div>
          <div style={{ width: `${bytesPerRow}ch` }}>
            ASCII
          </div>
        </div>

        {rows.map((row, index) => (
          <div key={index} style={{ display: 'flex', marginBottom: '2px' }}>
            {showOffsets && (
              <div style={{
                width: '80px',
                marginRight: '1em',
                color: '#888',
                userSelect: 'none'
              }}>
                {this.formatOffset(row.offset)}:
              </div>
            )}

            <div style={{
              flex: 1,
              marginRight: '1em',
              display: 'flex',
              flexWrap: 'wrap'
            }}>
              {Array.from({ length: bytesPerRow }, (_, i) => {
                const byte = row.bytes[i];
                return (
                  <span
                    key={i}
                    style={{
                      display: 'inline-block',
                      width: '24px',
                      marginRight: i === 7 ? '8px' : '0px', // Extra space in middle
                      color: byte !== undefined ? '#333' : '#ccc',
                      backgroundColor: byte !== undefined ? 'transparent' : '#f0f0f0'
                    }}
                  >
                    {byte !== undefined ? this.toHex(byte) : '  '}
                  </span>
                );
              })}
            </div>
            <div style={{
              width: `${bytesPerRow +1}ch`,
              color: '#666',
              backgroundColor: '#fff',
              padding: '0 4px',
              border: '1px solid #e0e0e0',
              borderRadius: '2px',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              overflow: 'hidden'
            }}>
              {row.bytes.map((byte, i) => (
                <span key={i}>{this.toAscii(byte)}</span>
              ))}
              {/* Pad remaining space if row is incomplete */}
              {Array.from({ length: bytesPerRow - row.bytes.length }, (_, i) => (
                <span key={`pad-${i}`}>&nbsp;</span>
              ))}
            </div>
          </div>
        ))}
        <div style={{
          marginTop: '1em',
          padding: '0.5em',
          backgroundColor: '#e9ecef',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#666'
        }}>
          Total bytes: {bytes.length.toLocaleString()}
        </div>
      </div>
    );
  };

  renderControls = () => {
    const bytesPerRowOptions = [
      { key: 8, text: '8 bytes', value: 8 },
      { key: 16, text: '16 bytes', value: 16 },
      { key: 32, text: '32 bytes', value: 32 }
    ];

    const offsetFormatOptions = [
      { key: 'hex', text: 'Hexadecimal', value: 'hex' },
      { key: 'decimal', text: 'Decimal', value: 'decimal' }
    ];

    return (
      <div style={{ 
        marginBottom: '1em', 
        padding: '0.5em',
        backgroundColor: '#f8f9fa',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '1em',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Bytes per row:</label>
          <Dropdown
            selection
            value={this.state.bytesPerRow}
            options={bytesPerRowOptions}
            onChange={(e, { value }) => this.setState({ bytesPerRow: value })}
            style={{ minWidth: '120px' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Offset format:</label>
          <Dropdown
            selection
            value={this.state.offsetFormat}
            options={offsetFormatOptions}
            onChange={(e, { value }) => this.setState({ offsetFormat: value })}
            style={{ minWidth: '120px' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
          <Button
            size='tiny'
            active={this.state.showOffsets}
            onClick={() => this.setState(prev => ({ showOffsets: !prev.showOffsets }))}
          >
            <Icon name={this.state.showOffsets ? 'eye' : 'eye slash'} />
            Offsets
          </Button>
        </div>
      </div>
    );
  };

  render () {
    const { error, loading, status } = this.state;
    return (
      <fabric-binary-content>
        <div style={{ marginBottom: '1em' }}>
          <Header as='h3' style={{ margin: 0, display: 'inline-block' }}>
            <Icon name='code' />
            Binary Content Viewer
          </Header>
        </div>
        {error && (
          <Message negative>
            <Message.Header>Error</Message.Header>
            <p>{error.content || error.message || 'An error occurred while displaying the binary content.'}</p>
          </Message>
        )}
        {loading && (
          <Message icon>
            <Icon name='circle notched' loading />
            <Message.Content>
              <Message.Header>Loading Binary Content</Message.Header>
              <p>Fetching blob data...</p>
            </Message.Content>
          </Message>
        )}
        {!loading && !error && (
          <>
            {this.renderControls()}
            {this.renderHexView()}
          </>
        )}
      </fabric-binary-content>
    );
  }

  toHTML () {
    return require('react-dom/server').renderToString(this.render());
  }
}

module.exports = BinaryContent;
