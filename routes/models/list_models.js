'use strict';

module.exports = async function (req, res, next) {
  try {
    // Get models from Pool members
    const poolModels = [];
    const poolHealth = this.pool.getPoolHealth();

    // Collect models from all pool members
    for (const memberId in this.pool._state.members) {
      const member = this.pool._state.members[memberId];
      const memberStatus = this.pool._state.memberStatus[memberId];
      const memberModels = this.pool._state.models[memberId] || [];

      if (memberStatus === 'ready') {
        for (const modelName of memberModels) {
          poolModels.push({
            name: modelName,
            source: 'pool',
            memberId: memberId,
            status: memberStatus
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

    // Combine and deduplicate models
    const allModels = [...poolModels, ...ollamaModels];
    const uniqueModels = [];
    const seenNames = new Set();

    for (const model of allModels) {
      if (!seenNames.has(model.name)) {
        seenNames.add(model.name);
        uniqueModels.push(model);
      }
    }

    res.json({
      status: 'success',
      data: {
        models: uniqueModels,
        pool: {
          health: poolHealth,
          memberCount: Object.keys(this.pool._state.members).length,
          readyMembers: Object.values(this.pool._state.memberStatus).filter(status => status === 'ready').length
        },
        ollama: {
          available: ollamaModels.length > 0,
          modelCount: ollamaModels.length
        }
      }
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