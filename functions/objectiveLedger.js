'use strict';

const { draftPlanFromObjective, preimageSha256 } = require('./backgroundWork');

const GOAL_FIELDS = ['title', 'description', 'priority', 'status', 'target_date', 'category'];

/**
 * @param {object} data
 * @returns {object}
 */
function canonicalGoal (data) {
  const source = data || {};
  return {
    title: String(source.title || '').trim(),
    description: String(source.description || '').trim(),
    priority: source.priority || 'medium',
    status: source.status || 'active',
    target_date: source.target_date || null,
    category: source.category || 'general'
  };
}

/**
 * @param {object} row
 * @returns {object}
 */
function publicGoal (row) {
  if (!row) return null;
  return {
    id: row.preimage_sha256,
    db_id: row.id,
    preimage_sha256: row.preimage_sha256,
    user_id: row.user_id == null ? null : row.user_id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    target_date: row.target_date,
    category: row.category,
    progress_note: row.progress_note || null,
    last_progress_at: row.last_progress_at || null,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

/**
 * @param {object} db
 * @param {string} preimage
 * @param {number|null} userId
 * @returns {Promise<object|undefined>}
 */
async function findGoal (db, preimage, userId) {
  let query = db('objectives').where({ preimage_sha256: preimage });
  if (userId == null) query = query.whereNull('user_id');
  else query = query.where({ user_id: userId });
  return query.first();
}

/**
 * @param {object} db
 * @param {number|null} userId Null selects instance-wide objectives.
 * @returns {Promise<object[]>}
 */
async function getGoals (db, userId) {
  const query = (userId == null)
    ? db('objectives').whereNull('user_id')
    : db('objectives').where({ user_id: userId });
  const rows = await query;
  return rows.map(publicGoal);
}

/**
 * @param {object} db
 * @param {object} goalData
 * @param {number|null} userId
 * @returns {Promise<object>}
 */
async function createGoal (db, goalData, userId) {
  const body = canonicalGoal(goalData);
  if (!body.title || !body.description) {
    throw new Error('Title and description are required');
  }
  const owner = userId == null ? null : userId;
  const preimage = preimageSha256({ ...body, user_id: owner });
  const inserted = await db('objectives').insert({
    ...body,
    user_id: owner,
    preimage_sha256: preimage
  });
  const id = Array.isArray(inserted) ? inserted[0] : inserted;
  const row = await db('objectives').where({ id: id }).first();
  return publicGoal(row);
}

/**
 * @param {object} db
 * @param {string} preimage
 * @param {object} updates
 * @param {number|null} userId
 * @returns {Promise<object|null>}
 */
async function updateGoal (db, preimage, updates, userId) {
  const existing = await findGoal(db, preimage, userId);
  if (!existing) return null;
  const next = canonicalGoal(existing);
  GOAL_FIELDS.forEach((key) => {
    if (updates && updates[key] !== undefined) next[key] = updates[key];
  });
  const normalized = canonicalGoal(next);
  const owner = userId == null ? null : userId;
  const nextPreimage = preimageSha256({ ...normalized, user_id: owner });
  await db('objectives').where({ id: existing.id }).update({
    ...normalized,
    preimage_sha256: nextPreimage
  });
  const row = await db('objectives').where({ id: existing.id }).first();
  return publicGoal(row);
}

/**
 * @param {object} db
 * @param {string} preimage
 * @param {number|null} userId
 * @returns {Promise<boolean>}
 */
async function deleteGoal (db, preimage, userId) {
  const existing = await findGoal(db, preimage, userId);
  if (!existing) return false;
  const plans = await db('plans').where({ objective_id: existing.id });
  for (let i = 0; i < plans.length; i++) {
    await db('plan_steps').where({ plan_id: plans[i].id }).del();
  }
  await db('plans').where({ objective_id: existing.id }).del();
  await db('objectives').where({ id: existing.id }).del();
  return true;
}

/**
 * @param {object} db
 * @param {number} objectiveId
 * @returns {Promise<object|null>}
 */
async function loadPlan (db, objectiveId) {
  const plan = await db('plans').where({ objective_id: objectiveId }).whereNot('status', 'archived').orderBy('id', 'desc').first();
  if (!plan) return null;
  const steps = await db('plan_steps').where({ plan_id: plan.id });
  steps.sort((a, b) => (a.position - b.position) || (a.id - b.id));
  return {
    id: plan.id,
    objective_id: plan.objective_id,
    preimage_sha256: plan.preimage_sha256,
    title: plan.title,
    status: plan.status,
    summary: plan.summary,
    last_progress_at: plan.last_progress_at || null,
    steps: steps.map((step) => {
      return {
        id: step.id,
        position: step.position,
        title: step.title,
        detail: step.detail,
        status: step.status,
        task_id: step.task_id || null,
        evidence: step.evidence || null
      };
    })
  };
}

/**
 * Persist the deterministic plan for an objective when none is open.
 * @param {object} db
 * @param {object} objective Database row.
 * @param {string} [summary]
 * @returns {Promise<object|null>}
 */
async function ensurePlan (db, objective, summary) {
  if (!objective) return null;
  const open = await db('plans').where({ objective_id: objective.id }).whereNot('status', 'completed').first();
  if (open) return loadPlan(db, objective.id);
  const draft = draftPlanFromObjective(objective);
  const preimage = preimageSha256({
    objective: objective.preimage_sha256,
    title: draft.title,
    steps: draft.steps
  });
  const inserted = await db('plans').insert({
    objective_id: objective.id,
    preimage_sha256: preimage,
    title: draft.title,
    status: 'active',
    summary: summary || draft.summary
  });
  const planId = Array.isArray(inserted) ? inserted[0] : inserted;
  for (let i = 0; i < draft.steps.length; i++) {
    const step = draft.steps[i];
    await db('plan_steps').insert({
      plan_id: planId,
      position: step.position,
      title: step.title,
      detail: step.detail,
      status: 'pending'
    });
  }
  await db('objectives').where({ id: objective.id }).update({
    progress_note: summary || draft.summary
  });
  return loadPlan(db, objective.id);
}

/**
 * @param {object} step
 * @param {string} note
 * @returns {{ status: string, evidence: string }}
 */
function advanceStepRecord (step, note) {
  const evidence = String(note || '').trim().slice(0, 2000) || 'Recorded progress.';
  if (!step || step.status === 'done') {
    return { status: 'done', evidence: evidence };
  }
  if (step.status === 'in_progress') {
    return { status: 'done', evidence: evidence };
  }
  return { status: 'in_progress', evidence: evidence };
}

module.exports = {
  canonicalGoal,
  publicGoal,
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  findGoal,
  loadPlan,
  ensurePlan,
  advanceStepRecord
};
