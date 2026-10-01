'use strict';

/**
 * Parallel LLM fan-out for {@link Sensemaker#handleTextRequest}.
 *
 * Steps (same user template each time):
 *  1. Pool — one Ollama call per entry in `parallelModels` (different `model` tag).
 *  2. Trainer — optional RAG / retrieval QA (can be slow; disable in lean profile).
 *  3. Sensemaker — primary chat agent (same stack as final streamed summary).
 *
 * Results are combined downstream via Promise.allSettled + filtering; the final
 * answer is produced by a separate streamed `sensemaker.query` summarization pass.
 */
function buildPipelineFanOut (hub, template, pipelineSettings = {}) {
  const defaults = ['qwen3:0.6b', 'llama3.2:latest'];
  const models = (Array.isArray(pipelineSettings.parallelModels) && pipelineSettings.parallelModels.length > 0)
    ? pipelineSettings.parallelModels
    : defaults;
  const includeTrainer = pipelineSettings.includeTrainerInFanOut !== false;

  const tasks = [];
  for (let i = 0; i < models.length; i++) {
    tasks.push(hub.pool.query({ ...template, model: models[i] }));
  }
  if (includeTrainer) {
    tasks.push(hub.trainer.query(template));
  }
  tasks.push(hub.sensemaker.query(template));
  return tasks;
}

module.exports = {
  buildPipelineFanOut
};
