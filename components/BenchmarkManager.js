'use strict';

const React = require('react');

class BenchmarkManager extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      models: [],
      benchmarks: [],
      isLoading: false,
      isRunningBenchmark: false,
      selectedModels: [],
      selectedTests: {
        text_generation: true,
        mathematical_reasoning: true,
        code_generation: true
      },
      availableTests: [
        {
          key: 'text_generation',
          label: 'Text Generation',
          prompt: 'Write a short paragraph about artificial intelligence.',
          description: 'Tests basic text generation capabilities'
        },
        {
          key: 'mathematical_reasoning',
          label: 'Mathematical Reasoning',
          prompt: 'What is 15 * 23? Please show your work.',
          description: 'Tests mathematical problem-solving abilities'
        },
        {
          key: 'code_generation',
          label: 'Code Generation',
          prompt: 'Write a JavaScript function that calculates the factorial of a number.',
          description: 'Tests code generation and programming knowledge'
        }
      ],
      benchmarkResults: [],
      currentRequests: {},
      requestHistory: {},
      error: null,
      activeBenchmarks: {}, // Track active benchmarks by model/server pair
      selectedBenchmark: null // Track which benchmark is being viewed
    };
  }

  componentDidMount () {
    this.loadModels();
    this.loadBenchmarks();
  }

  loadBenchmarks = () => {
    // Benchmarks are stored in component state only (no persistence)
    // This method is kept for consistency but doesn't need to do anything
  };

  loadModels = async () => {
    try {
      this.setState({ isLoading: true, error: null });

      const response = await fetch('/models');
      if (!response.ok) {
        throw new Error(`Failed to load models: ${response.status}`);
      }

      const data = await response.json();
      // API returns { models: [...] } in Ollama format
      // Expand grouped models back into individual model/server pairs for UI
      const expandedModels = [];
      for (const model of data.models || []) {
        if (model.providers && model.providers.length > 0) {
          // Expand each provider as a separate entry
          for (const provider of model.providers) {
            expandedModels.push({
              name: model.name,
              source: provider.provider === 'ollama' ? 'ollama' : 'pool',
              memberId: provider.provider,
              status: provider.status,
              size: model.size,
              modified_at: model.modified_at,
              providers: model.providers
            });
          }
        } else {
          // Fallback for models without providers
          expandedModels.push({
            name: model.name,
            source: 'unknown',
            status: 'unknown',
            size: model.size,
            modified_at: model.modified_at
          });
        }
      }
      this.setState({ models: expandedModels });
    } catch (err) {
      console.error('Error loading models:', err);
      this.setState({ error: err.message });
    } finally {
      this.setState({ isLoading: false });
    }
  };

  runBenchmark = async () => {
    if (this.state.selectedModels.length === 0) {
      this.setState({ error: 'Please select at least one model to benchmark' });
      return;
    }

    // Check if at least one test is selected
    const selectedTestKeys = Object.keys(this.state.selectedTests).filter(key => this.state.selectedTests[key]);
    if (selectedTestKeys.length === 0) {
      this.setState({ error: 'Please select at least one test to run' });
      return;
    }

    try {
      this.setState({
        isRunningBenchmark: true,
        error: null,
        benchmarkResults: [],
        currentRequests: {},
        requestHistory: {}
      });

      // Group models by name and find all servers for each selected model
      const modelServerPairs = [];
      for (const modelName of this.state.selectedModels) {
        const matchingModels = this.state.models.filter(m => m.name === modelName);
        for (const model of matchingModels) {
          const serverId = model.memberId || model.source || 'unknown';
          modelServerPairs.push({ modelName, serverId, model });
        }
        // If no matching models found, still create a benchmark (server will be determined by pool)
        if (matchingModels.length === 0) {
          modelServerPairs.push({ modelName, serverId: null, model: null });
        }
      }

      // Run benchmarks for each model/server pair
      for (const { modelName, serverId } of modelServerPairs) {
        const pairKey = `${modelName}:${serverId || 'default'}`;
        console.log(`Running benchmark for model: ${modelName}, server: ${serverId || 'default'}`);

        // Create a new benchmark in state
        const benchmarkId = `benchmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const benchmark = {
          id: benchmarkId,
          model_name: modelName,
          server_id: serverId,
          queries: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'running'
        };

        // Initialize currentRequests with only selected tests
        const initialRequests = {};
        const selectedTestKeys = Object.keys(this.state.selectedTests).filter(key => this.state.selectedTests[key]);
        for (const testKey of selectedTestKeys) {
          initialRequests[testKey] = { status: 'pending', startTime: Date.now() };
        }

        this.setState(prevState => ({
          benchmarks: [benchmark, ...prevState.benchmarks],
          activeBenchmarks: {
            ...prevState.activeBenchmarks,
            [pairKey]: benchmarkId
          },
          currentRequests: {
            ...prevState.currentRequests,
            [pairKey]: initialRequests
          },
          requestHistory: {
            ...prevState.requestHistory,
            [pairKey]: []
          }
        }));

        // Run only selected tests
        const testResults = [];
        for (const test of this.state.availableTests) {
          if (this.state.selectedTests[test.key]) {
            const result = await this.runTest(modelName, serverId, test.key, test.prompt, pairKey, benchmarkId);
            if (result) {
              testResults.push(result);
            }
          }
        }

        // Mark all selected tests as completed for this model/server pair
        const completedRequests = {};
        for (const testKey of selectedTestKeys) {
          completedRequests[testKey] = { status: 'completed', startTime: Date.now() };
        }
        this.setState(prevState => ({
          currentRequests: {
            ...prevState.currentRequests,
            [pairKey]: completedRequests
          }
        }));

        // Collect results for this model/server pair
        const pairResults = testResults.filter(r => r !== undefined);

        // Generate summary for this model/server pair
        const summary = this.generateSummaryForModel(pairResults, modelName);

        // Update benchmark with final results in state
        this.setState(prevState => ({
          benchmarks: prevState.benchmarks.map(b => {
            if (b.id === benchmarkId) {
              return {
                ...b,
                results: pairResults,
                summary: summary,
                status: 'completed',
                updated_at: new Date().toISOString()
              };
            }
            return b;
          })
        }));
      }

    } catch (err) {
      console.error('Error running benchmark:', err);
      this.setState({ error: err.message });
    } finally {
      this.setState({ isRunningBenchmark: false });
    }
  };

  runTest = async (modelName, serverId, testType, prompt, pairKey, benchmarkId) => {
    const startTime = Date.now();

    // Update status to running
    this.setState(prevState => ({
      currentRequests: {
        ...prevState.currentRequests,
        [pairKey]: {
          ...prevState.currentRequests[pairKey],
          [testType]: { status: 'running', startTime }
        }
      }
    }));

    try {
      const requestBody = {
        model: modelName,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      };

      // If server_id is available, include it in the request (backend may use it to route to specific server)
      if (serverId) {
        requestBody.server_id = serverId;
      }

      const response = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      const endTime = Date.now();
      const duration = endTime - startTime;

      const result = {
        model: modelName,
        server_id: serverId,
        test: testType,
        duration: duration,
        success: data.choices && data.choices.length > 0,
        response: data.choices?.[0]?.message?.content || 'No response content',
        timestamp: new Date().toISOString(),
        prompt: prompt,
        // Store blob references if available
        message_blob_ids: data.message_blob_ids || [],
        content_blob_ids: data.content_blob_ids || []
      };

      // Add query result to benchmark in state
      if (benchmarkId) {
        this.setState(prevState => ({
          benchmarks: prevState.benchmarks.map(b => {
            if (b.id === benchmarkId) {
              return {
                ...b,
                queries: [...(b.queries || []), {
                  test_type: testType,
                  prompt: prompt,
                  result: result,
                  completion_data: data,
                  timestamp: new Date().toISOString()
                }],
                updated_at: new Date().toISOString()
              };
            }
            return b;
          })
        }));
      }

      // Add to history
      this.setState(prevState => ({
        requestHistory: {
          ...prevState.requestHistory,
          [pairKey]: [...(prevState.requestHistory[pairKey] || []), result]
        },
        currentRequests: {
          ...prevState.currentRequests,
          [pairKey]: {
            ...prevState.currentRequests[pairKey],
            [testType]: { status: 'completed', startTime, endTime: endTime }
          }
        }
      }));

      return result;

    } catch (err) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      const result = {
        model: modelName,
        server_id: serverId,
        test: testType,
        duration: duration,
        success: false,
        error: err.message,
        timestamp: new Date().toISOString(),
        prompt: prompt
      };

      // Add to history
      this.setState(prevState => ({
        requestHistory: {
          ...prevState.requestHistory,
          [pairKey]: [...(prevState.requestHistory[pairKey] || []), result]
        },
        currentRequests: {
          ...prevState.currentRequests,
          [pairKey]: {
            ...prevState.currentRequests[pairKey],
            [testType]: { status: 'failed', startTime, endTime: endTime, error: err.message }
          }
        }
      }));

      return result;
    }
  };

  generateSummary = (results) => {
    const modelResults = {};

    for (const result of results) {
      if (!modelResults[result.model]) {
        modelResults[result.model] = {
          totalTests: 0,
          successfulTests: 0,
          totalDuration: 0,
          averageDuration: 0
        };
      }

      modelResults[result.model].totalTests++;
      modelResults[result.model].totalDuration += result.duration;

      if (result.success) {
        modelResults[result.model].successfulTests++;
      }
    }

    // Calculate averages
    for (const model in modelResults) {
      const stats = modelResults[model];
      stats.averageDuration = stats.totalDuration / stats.totalTests;
    }

    return modelResults;
  };

  generateSummaryForModel = (results, modelName) => {
    let totalTests = 0;
    let successfulTests = 0;
    let totalDuration = 0;

    for (const result of results) {
      totalTests++;
      totalDuration += result.duration;
      if (result.success) {
        successfulTests++;
      }
    }

    return {
      totalTests,
      successfulTests,
      totalDuration,
      averageDuration: totalTests > 0 ? totalDuration / totalTests : 0
    };
  };

  handleModelSelection = (modelName, checked) => {
    if (checked) {
      this.setState(prevState => ({
        selectedModels: [...prevState.selectedModels, modelName]
      }));
    } else {
      this.setState(prevState => ({
        selectedModels: prevState.selectedModels.filter(name => name !== modelName)
      }));
    }
  };

  handleSelectAll = () => {
    // Get unique model names
    const uniqueModelNames = [...new Set(this.state.models.map(model => model.name))];
    this.setState({ selectedModels: uniqueModelNames });
  };

  handleSelectNone = () => {
    this.setState({ selectedModels: [] });
  };

  formatDuration = (ms) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  getModelSource = (model) => {
    if (model.source === 'pool') {
      return model.memberId ? `Pool: ${model.memberId}` : 'Pool';
    }
    if (model.source === 'ollama') return 'Ollama';
    return 'Unknown';
  };

  // Group models by name to show all servers for each model
  getGroupedModels = () => {
    const grouped = {};
    for (const model of this.state.models) {
      if (!grouped[model.name]) {
        grouped[model.name] = [];
      }
      grouped[model.name].push(model);
    }
    return grouped;
  };

  getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <i className="clock outline icon"></i>;
      case 'running':
        return <i className="spinner loading icon"></i>;
      case 'completed':
        return <i className="check circle icon green"></i>;
      case 'failed':
        return <i className="times circle icon red"></i>;
      default:
        return <i className="question circle icon"></i>;
    }
  };

  getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'grey';
      case 'running':
        return 'blue';
      case 'completed':
        return 'green';
      case 'failed':
        return 'red';
      default:
        return 'grey';
    }
  };

  renderModelProgress = (pairKey) => {
    const { currentRequests, requestHistory, availableTests, selectedTests } = this.state;
    const modelRequests = currentRequests[pairKey] || {};
    const modelHistory = requestHistory[pairKey] || [];

    // Parse pairKey to get model name and server ID
    const [modelName, serverId] = pairKey.split(':');

    // Only show tests that are selected
    const tests = availableTests.filter(test => selectedTests[test.key]);

    return (
      <div className="ui segment" key={pairKey}>
        <h4 className="ui header">
          <i className="server icon"></i>
          <div className="content">
            {modelName}
            {serverId && serverId !== 'default' && (
              <span className="ui label mini" style={{ marginLeft: '0.5em' }}>
                {serverId}
              </span>
            )}
            <div className="sub header">
              {modelHistory.length} of {tests.length} tests completed
            </div>
          </div>
        </h4>

        <div className="ui list">
          {tests.map(test => {
            const request = modelRequests[test.key];
            const historyItem = modelHistory.find(h => h.test === test.key);

            return (
              <div key={test.key} className="item">
                <div className="content">
                  <div className="header">
                    {this.getStatusIcon(request?.status || 'pending')}
                    {test.label}
                    {test.description && (
                      <span className="ui label mini" style={{ marginLeft: '0.5em', fontWeight: 'normal' }}>
                        {test.description}
                      </span>
                    )}
                    {request?.status === 'running' && (
                      <span className="ui label mini blue">
                        Running... ({this.formatDuration(Date.now() - (request.startTime || 0))})
                      </span>
                    )}
                    {request?.status === 'completed' && historyItem && (
                      <span className={`ui label mini ${historyItem.success ? 'green' : 'red'}`}>
                        {this.formatDuration(historyItem.duration)}
                      </span>
                    )}
                    {request?.status === 'failed' && (
                      <span className="ui label mini red">
                        Failed
                      </span>
                    )}
                  </div>

                  {historyItem && (
                    <div className="description">
                      <div className="ui accordion">
                        <div className="title">
                          <i className="dropdown icon"></i>
                          View Details
                        </div>
                        <div className="content">
                          <div className="ui form">
                            <div className="field">
                              <label>Prompt:</label>
                              <div className="ui segment">
                                <code>{historyItem.prompt}</code>
                              </div>
                            </div>
                            <div className="field">
                              <label>Response:</label>
                              <div className="ui segment">
                                <pre style={{ maxHeight: '200px', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                                  {historyItem.response || historyItem.error || 'No response'}
                                </pre>
                              </div>
                            </div>
                            <div className="field">
                              <label>Duration:</label>
                              <span className="ui label">{this.formatDuration(historyItem.duration)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  render () {
    const {
      models,
      benchmarks,
      isLoading,
      isRunningBenchmark,
      selectedModels,
      benchmarkResults,
      currentRequests,
      error
    } = this.state;

    return (
      <div className="benchmark-manager">
        <div className="ui container">
          <h1 className="ui header">
            <i className="chart line icon"></i>
            <div className="content">
              Model Benchmark Manager
              <div className="sub header">Test and compare AI model performance</div>
            </div>
          </h1>
          {/* Model Selection */}
          <div className="ui segment">
            <h3 className="ui header">Available Models</h3>
            {isLoading && (
              <div className="ui active inverted dimmer">
                <div className="ui text loader">Loading models...</div>
              </div>
            )}
            {error && (
              <div className="ui negative message">
                <i className="close icon"></i>
                <div className="header">Error</div>
                <p>{error}</p>
              </div>
            )}
            {!isLoading && (
              <>
                <div className="ui buttons">
                  <button className="ui button" onClick={this.handleSelectAll}>
                    Select All
                  </button>
                  <button className="ui button" onClick={this.handleSelectNone}>
                    Select None
                  </button>
                </div>
                <div className="ui divided list" style={{ marginTop: '1rem' }}>
                  {Object.entries(this.getGroupedModels()).map(([modelName, modelInstances]) => (
                    <div key={modelName} className="item">
                      <div className="ui checkbox">
                        <input
                          type="checkbox"
                          checked={selectedModels.includes(modelName)}
                          onChange={(e) => this.handleModelSelection(modelName, e.target.checked)}
                        />
                        <label>
                          <strong>{modelName}</strong>
                          <div style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                            {modelInstances.map((model, idx) => (
                              <span key={idx} className="ui label mini" style={{ marginRight: '0.5rem' }}>
                                {this.getModelSource(model)}
                                {model.size && ` (${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB)`}
                              </span>
                            ))}
                          </div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="ui divider"></div>
                {/* Test Selection */}
                <h4 className="ui header">Select Tests to Run</h4>
                <div className="ui divided list" style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                  {this.state.availableTests.map(test => (
                    <div key={test.key} className="item">
                      <div className="ui checkbox">
                        <input
                          type="checkbox"
                          checked={this.state.selectedTests[test.key] || false}
                          onChange={(e) => {
                            this.setState(prevState => ({
                              selectedTests: {
                                ...prevState.selectedTests,
                                [test.key]: e.target.checked
                              }
                            }));
                          }}
                          disabled={isRunningBenchmark}
                        />
                        <label>
                          <strong>{test.label}</strong>
                          {test.description && (
                            <div style={{ marginTop: '0.25rem', marginLeft: '1.5rem', fontSize: '0.9em', color: '#666' }}>
                              {test.description}
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="ui buttons" style={{ marginBottom: '1rem' }}>
                  <button
                    className="ui button"
                    onClick={() => {
                      const allSelected = {};
                      this.state.availableTests.forEach(test => {
                        allSelected[test.key] = true;
                      });
                      this.setState({ selectedTests: allSelected });
                    }}
                    disabled={isRunningBenchmark}
                  >
                    Select All Tests
                  </button>
                  <button
                    className="ui button"
                    onClick={() => {
                      const noneSelected = {};
                      this.state.availableTests.forEach(test => {
                        noneSelected[test.key] = false;
                      });
                      this.setState({ selectedTests: noneSelected });
                    }}
                    disabled={isRunningBenchmark}
                  >
                    Deselect All Tests
                  </button>
                </div>
                <div className="ui divider"></div>
                <button
                  className={`ui primary button ${isRunningBenchmark ? 'loading' : ''}`}
                  onClick={this.runBenchmark}
                  disabled={selectedModels.length === 0 || isRunningBenchmark || Object.values(this.state.selectedTests).every(v => !v)}
                >
                  <i className="play icon"></i>
                  Run Benchmark ({selectedModels.length} models, {Object.values(this.state.selectedTests).filter(v => v).length} tests)
                </button>
              </>
            )}
          </div>
          {/* Real-time Progress */}
          {isRunningBenchmark && (
            <div className="ui segment">
              <h3 className="ui header">
                <i className="spinner loading icon"></i>
                Benchmark Progress
              </h3>

              {Object.keys(this.state.currentRequests).map(pairKey => this.renderModelProgress(pairKey))}
            </div>
          )}
          {/* Benchmark Results */}
          {benchmarkResults.length > 0 && !isRunningBenchmark && (
            <div className="ui segment">
              <h3 className="ui header">Benchmark Results</h3>

              <div className="ui statistics">
                {Object.entries(this.generateSummary(benchmarkResults)).map(([model, stats]) => (
                  <div key={model} className="statistic">
                    <div className="value">{stats.successfulTests}/{stats.totalTests}</div>
                    <div className="label">{model}</div>
                    <div className="description">
                      Avg: {this.formatDuration(stats.averageDuration)}
                    </div>
                  </div>
                ))}
              </div>

              <table className="ui celled table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Test</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Response</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarkResults.map((result, index) => (
                    <tr key={index} className={result.success ? 'positive' : 'negative'}>
                      <td>{result.model}</td>
                      <td>{result.test.replace('_', ' ')}</td>
                      <td>{this.formatDuration(result.duration)}</td>
                      <td>
                        {result.success ? (
                          <i className="check circle icon green"></i>
                        ) : (
                          <i className="times circle icon red"></i>
                        )}
                      </td>
                      <td>
                        <div className="ui accordion">
                          <div className="title">
                            <i className="dropdown icon"></i>
                            View Response
                          </div>
                          <div className="content">
                            <pre style={{ maxHeight: '200px', overflow: 'auto' }}>
                              {result.response || result.error || 'No response'}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Benchmark History */}
          {benchmarks.length > 0 && (
            <div className="ui segment">
              <h3 className="ui header">Benchmark History</h3>

              <div className="ui list">
                {benchmarks.map((benchmark) => {
                  const isExpanded = this.state.selectedBenchmark === benchmark.id;
                  const queries = benchmark.queries || [];
                  const results = benchmark.results || (queries.length > 0 ? queries.map(q => q.result).filter(Boolean) : []);
                  const summary = benchmark.summary || {};

                  return (
                    <div key={benchmark.id} className="item">
                      <div className="content">
                        <div className="header">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              this.setState(prevState => ({
                                selectedBenchmark: prevState.selectedBenchmark === benchmark.id ? null : benchmark.id
                              }));
                            }}
                            style={{ cursor: 'pointer', textDecoration: 'none' }}
                          >
                            <i className={`dropdown icon ${isExpanded ? 'open' : ''}`}></i>
                            {benchmark.model_name || 'Unknown Model'}
                            {benchmark.server_id && ` on ${benchmark.server_id}`}
                            {' - '}
                            {new Date(benchmark.created_at).toLocaleString()}
                          </a>
                          <button
                            className="ui button mini red"
                            style={{ marginLeft: '1em' }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (window.confirm('Delete this benchmark?')) {
                                this.setState(prevState => ({
                                  benchmarks: prevState.benchmarks.filter(b => b.id !== benchmark.id),
                                  selectedBenchmark: prevState.selectedBenchmark === benchmark.id ? null : prevState.selectedBenchmark
                                }));
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                        <div className="description">
                          {benchmark.summary && (
                            <span className="ui label">
                              {benchmark.summary.successfulTests || 0}/{benchmark.summary.totalTests || 0} tests passed
                              {benchmark.summary.averageDuration && ` (avg: ${this.formatDuration(benchmark.summary.averageDuration)})`}
                            </span>
                          )}
                          {benchmark.queries && (
                            <span className="ui label">
                              {benchmark.queries.length} queries
                            </span>
                          )}
                          <span className={`ui label ${benchmark.status === 'completed' ? 'green' : benchmark.status === 'running' ? 'blue' : 'gray'}`}>
                            {benchmark.status}
                          </span>
                        </div>
                        {isExpanded && (
                          <div className="ui segment" style={{ marginTop: '1em' }}>
                            <h4 className="ui header">Model & Server</h4>
                            <div style={{ marginBottom: '1em' }}>
                              <span className="ui label large">{benchmark.model_name || 'Unknown Model'}</span>
                              {benchmark.server_id && (
                                <span className="ui label large">Server: {benchmark.server_id}</span>
                              )}
                            </div>

                            <h4 className="ui header">Summary Statistics</h4>
                            <div className="ui statistics">
                              <div className="statistic">
                                <div className="value">{summary.successfulTests || 0}/{summary.totalTests || 0}</div>
                                <div className="label">Tests Passed</div>
                              </div>
                              <div className="statistic">
                                <div className="value">{this.formatDuration(summary.averageDuration || 0)}</div>
                                <div className="label">Average Duration</div>
                              </div>
                              <div className="statistic">
                                <div className="value">{this.formatDuration(summary.totalDuration || 0)}</div>
                                <div className="label">Total Duration</div>
                              </div>
                            </div>

                            <h4 className="ui header">Query History</h4>
                            {queries.length > 0 ? (
                              <table className="ui celled table">
                                <thead>
                                  <tr>
                                    <th>Test</th>
                                    <th>Duration</th>
                                    <th>Status</th>
                                    <th>Response</th>
                                    <th>Blobs</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {queries.map((query, index) => {
                                    const result = query.result || {};
                                    return (
                                      <tr key={index} className={result.success ? 'positive' : 'negative'}>
                                        <td>{query.test_type ? query.test_type.replace(/_/g, ' ') : 'Unknown'}</td>
                                        <td>{this.formatDuration(result.duration || 0)}</td>
                                        <td>
                                          {result.success ? (
                                            <span className="ui label green">
                                              <i className="check circle icon"></i>
                                              Success
                                            </span>
                                          ) : (
                                            <span className="ui label red">
                                              <i className="times circle icon"></i>
                                              Failed
                                            </span>
                                          )}
                                        </td>
                                        <td>
                                          <div style={{ maxWidth: '400px', maxHeight: '200px', overflow: 'auto' }}>
                                            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.9em' }}>
                                              {result.response || result.error || 'No response'}
                                            </pre>
                                          </div>
                                        </td>
                                        <td>
                                          {result.message_blob_ids && result.message_blob_ids.length > 0 && (
                                            <div>
                                              {result.message_blob_ids.map((blobId, idx) => (
                                                <a key={idx} href={`/blobs/${blobId}`} target="_blank" rel="noopener noreferrer" style={{ marginRight: '0.5em' }}>
                                                  <span className="ui label small">Message {idx + 1}</span>
                                                </a>
                                              ))}
                                            </div>
                                          )}
                                          {result.content_blob_ids && result.content_blob_ids.length > 0 && (
                                            <div>
                                              {result.content_blob_ids.map((blobId, idx) => (
                                                <a key={idx} href={`/blobs/${blobId}`} target="_blank" rel="noopener noreferrer" style={{ marginRight: '0.5em' }}>
                                                  <span className="ui label small">Content {idx + 1}</span>
                                                </a>
                                              ))}
                                            </div>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            ) : results.length > 0 ? (
                              <table className="ui celled table">
                                <thead>
                                  <tr>
                                    <th>Test</th>
                                    <th>Duration</th>
                                    <th>Status</th>
                                    <th>Response</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {results.map((result, index) => (
                                    <tr key={index} className={result.success ? 'positive' : 'negative'}>
                                      <td>{result.test ? result.test.replace(/_/g, ' ') : 'Unknown'}</td>
                                      <td>{this.formatDuration(result.duration || 0)}</td>
                                      <td>
                                        {result.success ? (
                                          <span className="ui label green">
                                            <i className="check circle icon"></i>
                                            Success
                                          </span>
                                        ) : (
                                          <span className="ui label red">
                                            <i className="times circle icon"></i>
                                            Failed
                                          </span>
                                        )}
                                      </td>
                                      <td>
                                        <div style={{ maxWidth: '400px', maxHeight: '200px', overflow: 'auto' }}>
                                          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.9em' }}>
                                            {result.response || result.error || 'No response'}
                                          </pre>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div className="ui message info">
                                <div className="header">No Results</div>
                                <p>This benchmark has no test results.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

module.exports = BenchmarkManager;
