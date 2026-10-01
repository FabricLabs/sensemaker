'use strict';

const React = require('react');
const { Link, useParams } = require('react-router-dom');

// Main component
const {
  Header,
  Segment,
  Icon,
  Button,
  Table,
  Label,
  Message,
  Loader,
  Card,
  Statistic,
  StatisticGroup
} = require('semantic-ui-react');

class BenchmarkView extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      benchmark: null,
      loading: true,
      error: null
    };
  }

  componentDidMount () {
    this.fetchBenchmark();
  }

  componentDidUpdate (prevProps) {
    if (prevProps.fabricID !== this.props.fabricID) {
      this.fetchBenchmark();
    }
  }

  fetchBenchmark () {
    const { fabricID } = this.props;
    if (!fabricID) return;

    // Without persistence, benchmarks are only available in BenchmarkManager's state
    // For now, just show an error - benchmarks should be accessed from BenchmarkManager
    this.setState({
      loading: false,
      error: 'Benchmark not found. Benchmarks are only available in the Benchmark Manager while the page is open (no persistence).'
    });
  }

  formatDuration = (ms) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  render () {
    const { benchmark, loading, error } = this.state;

    if (loading) {
      return (
        <Segment>
          <Loader active inline='centered'>Loading benchmark...</Loader>
        </Segment>
      );
    }

    if (error) {
      return (
        <Segment>
          <Message negative>
            <Message.Header>Error Loading Benchmark</Message.Header>
            <p>{error}</p>
          </Message>
        </Segment>
      );
    }

    if (!benchmark) {
      return (
        <Segment>
          <Message warning>
            <Message.Header>Benchmark Not Found</Message.Header>
            <p>The benchmark you're looking for doesn't exist.</p>
          </Message>
        </Segment>
      );
    }

    const summary = benchmark.summary || {};
    // Support both old format (results array) and new format (queries array)
    const results = benchmark.results || (benchmark.queries ? benchmark.queries.map(q => q.result).filter(Boolean) : []);
    const queries = benchmark.queries || [];
    const modelName = benchmark.model_name || 'Unknown Model';
    const serverId = benchmark.server_id;

    return (
      <div className='fade-in' style={{ padding: '2em' }}>
        <Header as='h1' dividing>
          <Icon name='chart line' />
          <Header.Content>
            Benchmark Results
            <Header.Subheader>
              {modelName}
              {serverId && ` on ${serverId}`}
              {' - '}
              {new Date(benchmark.created_at).toLocaleString()}
            </Header.Subheader>
          </Header.Content>
          <Button
            as={Link}
            to='/admin?tab=benchmark'
            floated='right'
            icon
            labelPosition='left'
          >
            <Icon name='arrow left' />
            Back to Benchmarks
          </Button>
        </Header>

        <Segment>
          <Header as='h3'>Model & Server</Header>
          <div style={{ marginBottom: '1em' }}>
            <Label size='large' style={{ margin: '0.25em' }}>
              {modelName}
            </Label>
            {serverId && (
              <Label size='large' style={{ margin: '0.25em' }}>
                Server: {serverId}
              </Label>
            )}
          </div>
        </Segment>

        <Segment>
          <Header as='h3'>Summary Statistics</Header>
          <StatisticGroup>
            <Statistic>
              <Statistic.Value>{summary.successfulTests || 0}/{summary.totalTests || 0}</Statistic.Value>
              <Statistic.Label>Tests Passed</Statistic.Label>
            </Statistic>
            <Statistic>
              <Statistic.Value>{this.formatDuration(summary.averageDuration || 0)}</Statistic.Value>
              <Statistic.Label>Average Duration</Statistic.Label>
            </Statistic>
            <Statistic>
              <Statistic.Value>{this.formatDuration(summary.totalDuration || 0)}</Statistic.Value>
              <Statistic.Label>Total Duration</Statistic.Label>
            </Statistic>
          </StatisticGroup>
        </Segment>

        <Segment>
          <Header as='h3'>Query History</Header>
          {queries.length > 0 ? (
            <Table celled>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Test</Table.HeaderCell>
                  <Table.HeaderCell>Duration</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell>Response</Table.HeaderCell>
                  <Table.HeaderCell>Blobs</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {queries.map((query, index) => {
                  const result = query.result || {};
                  return (
                    <Table.Row key={index} positive={result.success} negative={!result.success}>
                      <Table.Cell>{query.test_type ? query.test_type.replace(/_/g, ' ') : 'Unknown'}</Table.Cell>
                      <Table.Cell>{this.formatDuration(result.duration || 0)}</Table.Cell>
                      <Table.Cell>
                        {result.success ? (
                          <Label color='green'>
                            <Icon name='check circle' />
                            Success
                          </Label>
                        ) : (
                          <Label color='red'>
                            <Icon name='times circle' />
                            Failed
                          </Label>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <div style={{ maxWidth: '400px', maxHeight: '200px', overflow: 'auto' }}>
                          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.9em' }}>
                            {result.response || result.error || 'No response'}
                          </pre>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        {result.message_blob_ids && result.message_blob_ids.length > 0 && (
                          <div>
                            {result.message_blob_ids.map((blobId, idx) => (
                              <a key={idx} href={`/blobs/${blobId}`} target="_blank" rel="noopener noreferrer" style={{ marginRight: '0.5em' }}>
                                <Label size='small'>Message {idx + 1}</Label>
                              </a>
                            ))}
                          </div>
                        )}
                        {result.content_blob_ids && result.content_blob_ids.length > 0 && (
                          <div>
                            {result.content_blob_ids.map((blobId, idx) => (
                              <a key={idx} href={`/blobs/${blobId}`} target="_blank" rel="noopener noreferrer" style={{ marginRight: '0.5em' }}>
                                <Label size='small'>Content {idx + 1}</Label>
                              </a>
                            ))}
                          </div>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          ) : results.length > 0 ? (
            <Table celled>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Test</Table.HeaderCell>
                  <Table.HeaderCell>Duration</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell>Response</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {results.map((result, index) => (
                  <Table.Row key={index} positive={result.success} negative={!result.success}>
                    <Table.Cell>{result.test ? result.test.replace(/_/g, ' ') : 'Unknown'}</Table.Cell>
                    <Table.Cell>{this.formatDuration(result.duration || 0)}</Table.Cell>
                    <Table.Cell>
                      {result.success ? (
                        <Label color='green'>
                          <Icon name='check circle' />
                          Success
                        </Label>
                      ) : (
                        <Label color='red'>
                          <Icon name='times circle' />
                          Failed
                        </Label>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <div style={{ maxWidth: '400px', maxHeight: '200px', overflow: 'auto' }}>
                        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.9em' }}>
                          {result.response || result.error || 'No response'}
                        </pre>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          ) : (
            <Message info>
              <Message.Header>No Results</Message.Header>
              <p>This benchmark has no test results.</p>
            </Message>
          )}
        </Segment>
      </div>
    );
  }
}

// Wrapper component to extract fabricID from route params
function BenchmarkViewWrapper (props) {
  const { fabricID } = useParams();
  return <BenchmarkView fabricID={fabricID} {...props} />;
}

module.exports = BenchmarkViewWrapper;

