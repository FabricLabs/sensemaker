'use strict';

const crypto = require('crypto');

/** Pause before the idle worker touches the same item again. */
const COOLDOWN_MS = 30 * 1000;

/**
 * SHA-256 of a canonical JSON document. Goal routes address rows by this value.
 * @param {object} document
 * @returns {string}
 */
function preimageSha256 (document) {
  const body = JSON.stringify(document);
  return crypto.createHash('sha256').update(body).digest('hex');
}

/**
 * @param {object} source
 * @param {number} now
 * @returns {boolean}
 */
function sourceIsDue (source, now) {
  if (!source || (source.status && source.status !== 'active')) return false;
  if (!source.last_retrieved) return true;
  const last = new Date(source.last_retrieved).getTime();
  if (!Number.isFinite(last)) return true;
  const windows = {
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000,
    yearly: 365 * 24 * 60 * 60 * 1000
  };
  const windowMs = windows[source.recurrence] || windows.daily;
  return (now - last) >= windowMs;
}

/**
 * @param {object} map
 * @param {string} key
 * @param {number} now
 * @param {number} cooldownMs
 * @returns {boolean}
 */
function isCooling (map, key, now, cooldownMs) {
  if (!map || map[key] == null) return false;
  return (now - map[key]) < cooldownMs;
}

/**
 * Deterministic plan skeleton for an objective. The model may rewrite the
 * summary later; the steps exist even when the model is down.
 * @param {object} objective
 * @returns {{ title: string, summary: string, steps: object[] }}
 */
function draftPlanFromObjective (objective) {
  const title = String((objective && objective.title) || 'Untitled objective').trim().slice(0, 180);
  const description = String((objective && objective.description) || '').trim().slice(0, 2000);
  return {
    title: `Plan: ${title}`,
    summary: description
      ? `Work toward “${title}”. ${description}`
      : `Work toward “${title}”.`,
    steps: [
      {
        position: 1,
        title: `Clarify what “done” means for ${title}`,
        detail: description || 'State the observable outcome for this objective.',
        status: 'pending'
      },
      {
        position: 2,
        title: `Gather information for ${title}`,
        detail: 'Sync due sources and note what they add to this objective.',
        status: 'pending'
      },
      {
        position: 3,
        title: `Take the next action for ${title}`,
        detail: 'Record one concrete action and leave a task if work remains.',
        status: 'pending'
      }
    ]
  };
}

/**
 * High before medium before every other priority, then older rows first.
 * @param {object} a
 * @param {object} b
 * @returns {number}
 */
function compareObjectives (a, b) {
  const rank = priorityRank(a && a.priority) - priorityRank(b && b.priority);
  if (rank !== 0) return rank;
  const aTime = createdAtMillis(a);
  const bTime = createdAtMillis(b);
  if (aTime !== bTime) return aTime - bTime;
  return (a && a.id ? a.id : 0) - (b && b.id ? b.id : 0);
}

/**
 * @param {string} priority
 * @returns {number}
 * @private
 */
function priorityRank (priority) {
  const value = String(priority || 'medium').trim().toLowerCase();
  if (value === 'high') return 0;
  if (value === 'medium') return 1;
  return 2;
}

/**
 * @param {object} row
 * @returns {number}
 * @private
 */
function createdAtMillis (row) {
  if (!row || row.created_at == null) return 0;
  const millis = new Date(row.created_at).getTime();
  return Number.isFinite(millis) ? millis : 0;
}

/**
 * Queue key so a failed step is not retried on the next tick.
 * @param {object} work
 * @returns {string|null}
 */
function progressKey (work) {
  if (!work || !work.kind) return null;
  if (work.kind === 'gather_source') return `source:${work.sourceId}`;
  if (work.kind === 'draft_plan') return `objective:${work.objectiveId}`;
  if (work.kind === 'advance_step') return `step:${work.stepId}`;
  if (work.kind === 'progress_task') return `task:${work.taskId}`;
  return null;
}

/**
 * Choose one unit of background progress.
 * Conversation jobs are not selected here; the active worker drains those first.
 *
 * Order: a due intelligence source (when gathering is on), an unplanned
 * objective (high, then medium, then any other priority, then oldest), the
 * oldest open plan step, then the oldest open task.
 * @param {object} state
 * @returns {object|null}
 */
function selectNextBackgroundWork (state) {
  const now = state && state.now ? state.now : Date.now();
  const cooldownMs = state && state.cooldownMs != null ? state.cooldownMs : COOLDOWN_MS;
  const cooled = (state && state.lastProgressAt) || {};

  if (state && state.gather) {
    const sources = state.sources || [];
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      if (!sourceIsDue(source, now)) continue;
      if (isCooling(cooled, `source:${source.id}`, now, cooldownMs)) continue;
      return { kind: 'gather_source', sourceId: source.id };
    }
  }

  const objectives = ((state && state.objectives) || []).slice().sort(compareObjectives);
  const plans = (state && state.plans) || [];
  for (let i = 0; i < objectives.length; i++) {
    const objective = objectives[i];
    if (objective.status && objective.status !== 'active') continue;
    const hasPlan = plans.some((plan) => {
      return plan.objective_id === objective.id && plan.status !== 'archived';
    });
    if (hasPlan) continue;
    if (isCooling(cooled, `objective:${objective.id}`, now, cooldownMs)) continue;
    return { kind: 'draft_plan', objectiveId: objective.id };
  }

  const steps = ((state && state.steps) || []).filter((step) => {
    return step.status === 'pending' || step.status === 'in_progress';
  }).slice().sort((a, b) => {
    return (a.position - b.position) || (a.id - b.id);
  });
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (isCooling(cooled, `step:${step.id}`, now, cooldownMs)) continue;
    return { kind: 'advance_step', planId: step.plan_id, stepId: step.id };
  }

  const tasks = (state && state.tasks) || [];
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (task.completed_at) continue;
    if (isCooling(cooled, `task:${task.id}`, now, cooldownMs)) continue;
    return { kind: 'progress_task', taskId: task.id };
  }

  return null;
}

module.exports = {
  COOLDOWN_MS,
  preimageSha256,
  sourceIsDue,
  draftPlanFromObjective,
  progressKey,
  selectNextBackgroundWork
};
