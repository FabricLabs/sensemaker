'use strict';

module.exports = async function (req, res, next) {
  try {
    // Get models from Pool members
    const poolModels = [];
    const poolHealth = this.pool.getPoolHealth();

    // Collect models from top-level model tracking with providers
    for (const modelName in this.pool._state.models) {
      const providers = this.pool._state.models[modelName] || [];
      for (const provider of providers) {
        if (provider.status === 'ready') {
          poolModels.push({
            name: modelName,
            source: 'pool',
            memberId: provider.provider,
            status: provider.status,
            providers: providers.map(p => ({
              provider: p.provider,
              status: p.status
            }))
          });
        }
      }
    }

    // Get models directly from Ollama
    const ollamaModels = [];
    try {
      const ollamaResponse = await fetch(`${this.settings.ollama.host || 'http://localhost'}:${this.settings.ollama.port || 11434}/api/tags`);
      if (ollamaResponse.ok) {
        const ollamaData = await ollamaResponse.json();
        for (const model of ollamaData.models || []) {
          ollamaModels.push({
            name: model.name,
            source: 'ollama',
            size: model.size,
            modified_at: model.modified_at,
            status: 'available'
          });
        }
      }
    } catch (error) {
      console.warn('[BENCHMARK] Could not fetch Ollama models:', error.message);
    }

    // Group models by name and aggregate providers (Ollama API format with provider annotation)
    const modelMap = new Map();

    // Add pool models
    for (const model of poolModels) {
      if (!modelMap.has(model.name)) {
        modelMap.set(model.name, {
          name: model.name,
          providers: []
        });
      }
      const modelEntry = modelMap.get(model.name);
      if (!modelEntry.providers.find(p => p.provider === model.memberId)) {
        modelEntry.providers.push({
          provider: model.memberId,
          status: model.status
        });
      }
    }

    // Add Ollama models
    for (const model of ollamaModels) {
      if (!modelMap.has(model.name)) {
        modelMap.set(model.name, {
          name: model.name,
          size: model.size,
          modified_at: model.modified_at
        });
      }
      const modelEntry = modelMap.get(model.name);
      // Ollama models don't have explicit providers, but we can mark them
      if (!modelEntry.providers) {
        modelEntry.providers = [];
      }
      if (!modelEntry.providers.find(p => p.provider === 'ollama')) {
        modelEntry.providers.push({
          provider: 'ollama',
          status: 'available'
        });
      }
    }

    // Convert to array matching Ollama format
    const allModels = Array.from(modelMap.values());

    // Return in Ollama API format: { models: [...] }
    res.json({
      models: allModels
    });

  } catch (error) {
    console.error('[BENCHMARK] Error listing models:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to list models',
      error: error.message
    });
  }
};
