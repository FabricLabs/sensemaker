'use strict';

/**
 * Whether the active worker is currently on this task.
 * @param {object|null} focus
 * @param {object} task
 * @returns {boolean}
 */
function focusMatchesTask (focus, task) {
  if (!focus || !task) return false;
  if (focus.taskFabricId && task.id && focus.taskFabricId === task.id) return true;
  if (focus.taskFabricId && task.fabric_id && focus.taskFabricId === task.fabric_id) return true;
  if (focus.taskId != null && task.db_id != null && Number(focus.taskId) === Number(task.db_id)) return true;
  if (focus.stepId != null && task.plan_step_id != null && Number(focus.stepId) === Number(task.plan_step_id)) return true;
  return false;
}

/**
 * Label for the background worker on one task.
 * @param {object} task
 * @param {object|null} focus
 * @param {boolean} busy
 * @returns {{ state: string, label: string, kind: string|null, since: string|null, lastProgressAt: string|null, progressNote: string|null, paused: boolean, goalTitle: string|null }}
 */
function describeTaskWorker (task, focus, busy) {
  const note = task && task.progress_note ? String(task.progress_note) : null;
  const goalTitle = task && task.goal_title ? String(task.goal_title) : null;
  const lastProgressAt = task && task.last_progress_at ? task.last_progress_at : null;
  const paused = !!(task && (task.background_paused || task.paused));
  const base = {
    state: 'idle',
    label: 'Idle',
    kind: null,
    since: null,
    lastProgressAt: lastProgressAt,
    progressNote: note,
    paused: paused,
    goalTitle: goalTitle
  };

  if (!task) return base;
  if (task.completed_at) {
    return { ...base, state: 'complete', label: 'Complete', paused: false };
  }

  const working = !!busy && focusMatchesTask(focus, task);
  if (working) {
    const kind = focus.kind || null;
    let label = 'Working';
    if (kind === 'advance_step') label = 'Working on the goal step';
    else if (kind === 'progress_task') label = 'Working on this task';
    else if (kind === 'draft_plan') label = 'Drafting the plan';
    if (paused) label = `${label}, then paused`;
    return {
      ...base,
      state: 'working',
      label: label,
      kind: kind,
      since: focus.startedAt || null
    };
  }

  if (paused) {
    return { ...base, state: 'paused', label: 'Paused' };
  }
  if (task.queued) {
    return { ...base, state: 'queued', label: 'Queued' };
  }
  if (lastProgressAt) {
    return { ...base, state: 'waiting', label: 'Waiting' };
  }
  return base;
}

module.exports = {
  describeTaskWorker,
  focusMatchesTask
};
