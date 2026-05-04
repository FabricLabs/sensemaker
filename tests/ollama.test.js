'use strict';

// Dependencies
const assert = require('assert');
const fetch = require('cross-fetch');

// Settings
const settings = require('../settings/local');
const { CORE_MODEL } = require('../constants');

// Ollama API base URL
const OLLAMA_HOST = settings.ollama?.host || '127.0.0.1';
const OLLAMA_PORT = settings.ollama?.port || 11434;
const OLLAMA_BASE_URL = `http://${OLLAMA_HOST}:${OLLAMA_PORT}`;
const OLLAMA_MODEL = settings.ollama?.model || CORE_MODEL;

describe('Ollama API', function () {
  this.timeout(30000); // 30 second timeout for API calls

  // Test helper to check if Ollama is available
  async function checkOllamaAvailable () {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      console.warn(`[OLLAMA:TEST] Ollama not available at ${OLLAMA_BASE_URL}:`, error.message);
      return false;
    }
  }

  // Test helper to get available models
  async function getAvailableModels () {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.models || [];
  }

  // Test helper to get a model that supports generate/chat (filters out embedding models)
  async function getChatModel () {
    const models = await getAvailableModels();
    // Filter out embedding models (they typically have "embed" in the name)
    const chatModels = models.filter(model => {
      const name = model.name.toLowerCase();
      return !name.includes('embed');
    }).filter(model => model.name === OLLAMA_MODEL);

    if (chatModels.length === 0) {
      throw new Error('No chat-compatible models available (all models appear to be embedding models)');
    }

    return chatModels[0];
  }

  // Test helper to get an embedding model
  async function getEmbeddingModel () {
    const models = await getAvailableModels();
    const embeddingModels = models.filter(model => {
      const name = model.name.toLowerCase();
      return name.includes('embed');
    });

    if (embeddingModels.length === 0) {
      throw new Error('No embedding models available');
    }

    return embeddingModels[0];
  }

  describe('API Availability', function () {
    it('should be able to connect to Ollama server', async function () {
      try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          this.skip(`Ollama server returned ${response.status} ${response.statusText} at ${OLLAMA_BASE_URL}`);
        }
        assert.strictEqual(response.ok, true, 'Ollama server should be accessible');
      } catch (error) {
        this.skip(`Ollama server is not available at ${OLLAMA_BASE_URL}: ${error.message}`);
      }
    });
  });

  describe('/api/tags endpoint', function () {
    it('should return a list of available models', async function () {
      const available = await checkOllamaAvailable();
      if (!available) {
        this.skip('Ollama server is not available');
      }

      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
      assert.strictEqual(response.ok, true, 'Response should be OK');
      assert.strictEqual(response.status, 200, 'Status should be 200');

      const data = await response.json();
      assert.ok(data, 'Response should have data');
      assert.ok(Array.isArray(data.models), 'Response should have models array');
    });

    it('should return models with required fields', async function () {
      const available = await checkOllamaAvailable();
      if (!available) {
        this.skip('Ollama server is not available');
      }

      const models = await getAvailableModels();
      if (models.length === 0) {
        this.skip('No models available for testing');
      }

      const model = models[0];
      assert.ok(model.name, 'Model should have a name');
      assert.ok(typeof model.name === 'string', 'Model name should be a string');
    });
  });

  describe('/api/generate endpoint', function () {
    it('should generate text from a prompt', async function () {
      const available = await checkOllamaAvailable();
      if (!available) {
        this.skip('Ollama server is not available');
      }

      let model;
      try {
        model = await getChatModel();
      } catch (error) {
        this.skip(error.message);
      }

      const modelName = model.name;
      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          prompt: 'Say "Hello, World!"',
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Generate request failed: ${response.status} ${response.statusText}. Response: ${errorText}`);
      }

      assert.strictEqual(response.ok, true, 'Response should be OK');
      const data = await response.json();
      assert.ok(data, 'Response should have data');
      assert.ok(data.response, 'Response should have response text');
      assert.ok(typeof data.response === 'string', 'Response should be a string');
      assert.ok(data.response.length > 0, 'Response should not be empty');
    });

    it('should handle streaming responses', async function () {
      const available = await checkOllamaAvailable();
      if (!available) {
        this.skip('Ollama server is not available');
      }

      let model;
      try {
        model = await getChatModel();
      } catch (error) {
        this.skip(error.message);
      }

      const modelName = model.name;
      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          prompt: 'Count to 3',
          stream: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Streaming request failed: ${response.status} ${response.statusText}. Response: ${errorText}`);
      }

      assert.strictEqual(response.ok, true, 'Response should be OK');

      // For streaming, read the response as text (cross-fetch handles streaming)
      const text = await response.text();
      assert.ok(text.length > 0, 'Should receive streaming data');

      // Streaming responses from Ollama are newline-delimited JSON
      const lines = text.trim().split('\n').filter(line => line.length > 0);
      assert.ok(lines.length > 0, 'Should receive at least one line of streaming data');
    });
  });

  describe('/api/chat endpoint', function () {
    it('should handle chat completion requests', async function () {
      const available = await checkOllamaAvailable();
      if (!available) {
        this.skip('Ollama server is not available');
      }

      let model;
      try {
        model = await getChatModel();
      } catch (error) {
        this.skip(error.message);
      }

      const modelName = model.name;
      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: 'user',
              content: 'What is 2+2?'
            }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chat request failed: ${response.status} ${response.statusText}. Response: ${errorText}`);
      }

      assert.strictEqual(response.ok, true, 'Response should be OK');
      const data = await response.json();
      assert.ok(data, 'Response should have data');
      assert.ok(data.message, 'Response should have message object');
      assert.ok(data.message.content, 'Message should have content');
      assert.ok(typeof data.message.content === 'string', 'Message content should be a string');
    });

    it('should handle multi-turn conversations', async function () {
      const available = await checkOllamaAvailable();
      if (!available) {
        this.skip('Ollama server is not available');
      }

      let model;
      try {
        model = await getChatModel();
      } catch (error) {
        this.skip(error.message);
      }

      const modelName = model.name;

      // First message
      const response1 = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: 'user',
              content: 'My name is Alice.'
            }
          ],
          stream: false
        })
      });

      if (!response1.ok) {
        const errorText = await response1.text();
        throw new Error(`First chat request failed: ${response1.status} ${response1.statusText}. Response: ${errorText}`);
      }

      assert.strictEqual(response1.ok, true, 'First response should be OK');
      const data1 = await response1.json();
      assert.ok(data1.message, 'First response should have message');

      // Second message with context
      const response2 = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: 'user',
              content: 'My name is Alice.'
            },
            {
              role: 'assistant',
              content: data1.message.content
            },
            {
              role: 'user',
              content: 'What is my name?'
            }
          ],
          stream: false
        })
      });

      if (!response2.ok) {
        const errorText = await response2.text();
        throw new Error(`Second chat request failed: ${response2.status} ${response2.statusText}. Response: ${errorText}`);
      }

      assert.strictEqual(response2.ok, true, 'Second response should be OK');
      const data2 = await response2.json();
      assert.ok(data2.message, 'Second response should have message');
      assert.ok(data2.message.content, 'Second message should have content');
    });

    it('should handle streaming chat responses', async function () {
      const available = await checkOllamaAvailable();
      if (!available) {
        this.skip('Ollama server is not available');
      }

      let model;
      try {
        model = await getChatModel();
      } catch (error) {
        this.skip(error.message);
      }

      const modelName = model.name;
      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: 'user',
              content: 'Say hello'
            }
          ],
          stream: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Streaming chat request failed: ${response.status} ${response.statusText}. Response: ${errorText}`);
      }

      assert.strictEqual(response.ok, true, 'Response should be OK');

      // For streaming, read the response as text
      const text = await response.text();
      assert.ok(text.length > 0, 'Should receive streaming data');

      // Streaming responses from Ollama are newline-delimited JSON
      const lines = text.trim().split('\n').filter(line => line.length > 0);
      assert.ok(lines.length > 0, 'Should receive at least one line of streaming data');
    });
  });

  describe('/api/embeddings endpoint', function () {
    it('should generate embeddings from text', async function () {
      const available = await checkOllamaAvailable();
      if (!available) {
        this.skip('Ollama server is not available');
      }

      let model;
      try {
        model = await getEmbeddingModel();
      } catch (error) {
        this.skip(error.message);
      }

      const modelName = model.name;
      const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          prompt: 'This is a test sentence for embeddings.'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Embeddings request failed: ${response.status} ${response.statusText}. Response: ${errorText}`);
      }

      assert.strictEqual(response.ok, true, 'Response should be OK');
      const data = await response.json();
      assert.ok(data, 'Response should have data');
      assert.ok(Array.isArray(data.embedding), 'Response should have embedding array');
      assert.ok(data.embedding.length > 0, 'Embedding should not be empty');
      assert.ok(typeof data.embedding[0] === 'number', 'Embedding values should be numbers');
    });
  });

  describe('/api/show endpoint', function () {
    it('should return model information', async function () {
      const available = await checkOllamaAvailable();
      if (!available) {
        this.skip('Ollama server is not available');
      }

      const models = await getAvailableModels();
      if (models.length === 0) {
        this.skip('No models available for testing');
      }

      const modelName = models[0].name;
      const response = await fetch(`${OLLAMA_BASE_URL}/api/show`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: modelName
        })
      });

      assert.strictEqual(response.ok, true, 'Response should be OK');
      const data = await response.json();
      assert.ok(data, 'Response should have data');
      assert.ok(data.modelfile, 'Response should have modelfile');
      assert.ok(data.parameters, 'Response should have parameters');
    });
  });

  describe('Error Handling', function () {
    it('should return appropriate error for non-existent model', async function () {
      const available = await checkOllamaAvailable();
      if (!available) {
        this.skip('Ollama server is not available');
      }

      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'non-existent-model-12345',
          prompt: 'Test',
          stream: false
        })
      });

      // Ollama typically returns 404 or 400 for non-existent models
      assert.ok(!response.ok, 'Response should not be OK for non-existent model');
      assert.ok([400, 404].includes(response.status), 'Should return 400 or 404');
    });

    it('should handle invalid request format', async function () {
      const available = await checkOllamaAvailable();
      if (!available) {
        this.skip('Ollama server is not available');
      }

      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Missing required 'model' and 'prompt' fields
          stream: false
        })
      });

      assert.ok(!response.ok, 'Response should not be OK for invalid request');
    });

    it('should handle missing required fields in chat request', async function () {
      const available = await checkOllamaAvailable();
      if (!available) {
        this.skip('Ollama server is not available');
      }

      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Missing required 'model' and 'messages' fields
          stream: false
        })
      });

      assert.ok(!response.ok, 'Response should not be OK for invalid request');
    });
  });

  describe('Performance', function () {
    it('should respond within reasonable time', async function () {
      const available = await checkOllamaAvailable();
      if (!available) {
        this.skip('Ollama server is not available');
      }

      let model;
      try {
        model = await getChatModel();
      } catch (error) {
        this.skip(error.message);
      }

      const modelName = model.name;
      const startTime = Date.now();

      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          prompt: 'Say hello',
          stream: false
        })
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Performance test request failed: ${response.status} ${response.statusText}. Response: ${errorText}`);
      }

      assert.strictEqual(response.ok, true, 'Response should be OK');
      assert.ok(duration < 10000, `Response should complete within 10 seconds, took ${duration}ms`);
    });
  });
});

