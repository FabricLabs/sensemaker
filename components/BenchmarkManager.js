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
      benchmarkResults: [],
      currentRequests: {},
      requestHistory: {},
      error: null
    };
  }

  componentDidMount () {
    this.loadModels();
  }

  loadModels = async () => {
    try {
      this.setState({ isLoading: true, error: null });

      const response = await fetch('/models');
      if (!response.ok) {
        throw new Error(`Failed to load models: ${response.status}`);
      }

      const data = await response.json();
      this.setState({ models: data.data.models || [] });
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

    try {
      this.setState({ 
        isRunningBenchmark: true, 
        error: null, 
        benchmarkResults: [],
        currentRequests: {},
        requestHistory: {}
      });

      const results = [];
      
      for (const modelName of this.state.selectedModels) {
        console.log(`Running benchmark for model: ${modelName}`);
        
        // Initialize request tracking for this model
        this.setState(prevState => ({
          currentRequests: {
            ...prevState.currentRequests,
            [modelName]: {
              text_generation: { status: 'pending', startTime: Date.now() },
              mathematical_reasoning: { status: 'pending', startTime: Date.now() },
              code_generation: { status: 'pending', startTime: Date.now() }
            }
          },
          requestHistory: {
            ...prevState.requestHistory,
            [modelName]: []
          }
        }));
        
        // Test 1: Simple text generation
        await this.runTest(modelName, 'text_generation', 'Write a short paragraph about artificial intelligence.');
        
        // Test 2: Mathematical reasoning
        await this.runTest(modelName, 'mathematical_reasoning', 'What is 15 * 23? Please show your work.');
        
        // Test 3: Code generation
        await this.runTest(modelName, 'code_generation', 'Write a JavaScript function that calculates the factorial of a number.');
        
        // Mark all tests as completed for this model
        this.setState(prevState => ({
          currentRequests: {
            ...prevState.currentRequests,
            [modelName]: {
              text_generation: { status: 'completed', startTime: Date.now() },
              mathematical_reasoning: { status: 'completed', startTime: Date.now() },
              code_generation: { status: 'completed', startTime: Date.now() }
            }
          }
        }));
      }

      // Generate final summary
      const allResults = Object.values(this.state.requestHistory).flat();
      this.setState({ benchmarkResults: allResults });
      
      // Save benchmark results
      const benchmark = {
        id: Date.now().toString(),
        models: this.state.selectedModels,
        results: allResults,
        summary: this.generateSummary(allResults),
        timestamp: new Date().toISOString()
      };
      
      this.setState(prevState => ({
        benchmarks: [benchmark, ...prevState.benchmarks]
      }));
      
    } catch (err) {
      console.error('Error running benchmark:', err);
      this.setState({ error: err.message });
    } finally {
      this.setState({ isRunningBenchmark: false });
    }
  };

  runTest = async (modelName, testType, prompt) => {
    const startTime = Date.now();
    
    // Update status to running
    this.setState(prevState => ({
      currentRequests: {
        ...prevState.currentRequests,
        [modelName]: {
          ...prevState.currentRequests[modelName],
          [testType]: { status: 'running', startTime }
        }
      }
    }));

    try {
      const response = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 500
        })
      });
      
      const data = await response.json();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const result = {
        model: modelName,
        test: testType,
        duration: duration,
        success: data.choices && data.choices.length > 0,
        response: data.choices?.[0]?.message?.content || 'No response content',
        timestamp: new Date().toISOString(),
        prompt: prompt
      };

      // Add to history
      this.setState(prevState => ({
        requestHistory: {
          ...prevState.requestHistory,
          [modelName]: [...(prevState.requestHistory[modelName] || []), result]
        },
        currentRequests: {
          ...prevState.currentRequests,
          [modelName]: {
            ...prevState.currentRequests[modelName],
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
          [modelName]: [...(prevState.requestHistory[modelName] || []), result]
        },
        currentRequests: {
          ...prevState.currentRequests,
          [modelName]: {
            ...prevState.currentRequests[modelName],
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
    this.setState({ selectedModels: this.state.models.map(model => model.name) });
  };

  handleSelectNone = () => {
    this.setState({ selectedModels: [] });
  };

  formatDuration = (ms) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  getModelSource = (model) => {
    if (model.source === 'pool') return 'Pool';
    if (model.source === 'ollama') return 'Ollama';
    return 'Unknown';
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

  renderModelProgress = (modelName) => {
    const { currentRequests, requestHistory } = this.state;
    const modelRequests = currentRequests[modelName] || {};
    const modelHistory = requestHistory[modelName] || [];
    
    const tests = [
      { key: 'text_generation', label: 'Text Generation' },
      { key: 'mathematical_reasoning', label: 'Mathematical Reasoning' },
      { key: 'code_generation', label: 'Code Generation' }
    ];

    return (
      <div className="ui segment" key={modelName}>
        <h4 className="ui header">
          <i className="server icon"></i>
          <div className="content">
            {modelName}
            <div className="sub header">
              {modelHistory.length} of 3 tests completed
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
                  {models.map((model, index) => (
                    <div key={index} className="item">
                      <div className="ui checkbox">
                        <input
                          type="checkbox"
                          checked={selectedModels.includes(model.name)}
                          onChange={(e) => this.handleModelSelection(model.name, e.target.checked)}
                        />
                        <label>
                          <strong>{model.name}</strong>
                          <span className="ui label mini">
                            {this.getModelSource(model)}
                          </span>
                          {model.size && (
                            <span className="ui label mini">
                              {(model.size / 1024 / 1024 / 1024).toFixed(1)}GB
                            </span>
                          )}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="ui divider"></div>
                <button
                  className={`ui primary button ${isRunningBenchmark ? 'loading' : ''}`}
                  onClick={this.runBenchmark}
                  disabled={selectedModels.length === 0 || isRunningBenchmark}
                >
                  <i className="play icon"></i>
                  Run Benchmark ({selectedModels.length} models)
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
              
              {selectedModels.map(modelName => this.renderModelProgress(modelName))}
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
                {benchmarks.map((benchmark) => (
                  <div key={benchmark.id} className="item">
                    <div className="content">
                      <div className="header">
                        Benchmark {benchmark.id} - {new Date(benchmark.timestamp).toLocaleString()}
                      </div>
                      <div className="description">
                        Models: {benchmark.models.join(', ')}
                      </div>
                      <div className="extra">
                        {Object.entries(benchmark.summary).map(([model, stats]) => (
                          <span key={model} className="ui label">
                            {model}: {stats.successfulTests}/{stats.totalTests} tests
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

module.exports = BenchmarkManager;
