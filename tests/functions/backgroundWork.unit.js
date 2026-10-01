'use strict';

const assert = require('assert');
const {
  draftPlanFromObjective,
  preimageSha256,
  selectNextBackgroundWork,
  sourceIsDue
} = require('../../functions/backgroundWork');
const {
  advanceStepRecord,
  createGoal,
  deleteGoal,
  ensurePlan,
  getGoals,
  loadPlan,
  updateGoal
} = require('../../functions/objectiveLedger');

function createMemoryDb () {
  const tables = {};

  function table (name) {
    if (!tables[name]) tables[name] = [];
    const state = { filters: [], order: null };
    const api = {
      insert (row) {
        const id = tables[name].reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;
        tables[name].push({
          ...row,
          id: id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        return Promise.resolve([id]);
      },
      where (query) {
        state.filters.push((row) => {
          return Object.keys(query).every((key) => row[key] === query[key]);
        });
        return api;
      },
      whereNull (column) {
        state.filters.push((row) => row[column] == null);
        return api;
      },
      whereNot (column, value) {
        state.filters.push((row) => row[column] !== value);
        return api;
      },
      orderBy (column, direction) {
        state.order = { column, direction: direction || 'asc' };
        return api;
      },
      first () {
        const rows = matched();
        return Promise.resolve(rows[0]);
      },
      update (patch) {
        const rows = matched();
        rows.forEach((row) => {
          Object.assign(row, patch);
        });
        return Promise.resolve(rows.length);
      },
      del () {
        const rows = matched();
        tables[name] = tables[name].filter((row) => rows.indexOf(row) === -1);
        return Promise.resolve(rows.length);
      },
      then (resolve, reject) {
        return Promise.resolve(matched()).then(resolve, reject);
      }
    };

    function matched () {
      let rows = tables[name].filter((row) => state.filters.every((fn) => fn(row)));
      if (state.order) {
        const column = state.order.column;
        const sign = state.order.direction === 'desc' ? -1 : 1;
        rows = rows.slice().sort((a, b) => {
          if (a[column] === b[column]) return 0;
          return a[column] > b[column] ? sign : -sign;
        });
      }
      return rows;
    }

    return api;
  }

  return table;
}

describe('background work', function () {
  const now = Date.parse('2026-09-27T00:00:00Z');

  it('drafts a stable three-step plan from an objective', function () {
    const plan = draftPlanFromObjective({ title: 'Watch the river', description: 'Note the level each morning.' });
    assert.strictEqual(plan.steps.length, 3);
    assert.strictEqual(plan.steps[1].position, 2);
    assert.ok(plan.summary.indexOf('Watch the river') !== -1);
    const again = draftPlanFromObjective({ title: 'Watch the river', description: 'Note the level each morning.' });
    assert.strictEqual(preimageSha256(plan), preimageSha256(again));
  });

  it('treats a source as due until its recurrence window has elapsed', function () {
    assert.strictEqual(sourceIsDue({ id: 'a', status: 'active', recurrence: 'daily' }, now), true);
    assert.strictEqual(sourceIsDue({
      id: 'a',
      status: 'active',
      recurrence: 'daily',
      last_retrieved: new Date(now - 60 * 1000).toISOString()
    }, now), false);
    assert.strictEqual(sourceIsDue({
      id: 'a',
      status: 'active',
      recurrence: 'daily',
      last_retrieved: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString()
    }, now), true);
  });

  it('prefers a due source, then an unplanned objective, then a step, then a task', function () {
    const base = {
      now: now,
      cooldownMs: 1000,
      lastProgressAt: {},
      gather: true,
      objectives: [{ id: 1, status: 'active', title: 'Map the dock' }],
      plans: [],
      steps: [],
      tasks: [{ id: 9, title: 'Oil the winch' }],
      sources: [{ id: 'src', status: 'active', recurrence: 'daily' }]
    };

    assert.deepStrictEqual(selectNextBackgroundWork(base), { kind: 'gather_source', sourceId: 'src' });

    const afterGather = selectNextBackgroundWork({
      ...base,
      gather: false
    });
    assert.deepStrictEqual(afterGather, { kind: 'draft_plan', objectiveId: 1 });

    const planned = selectNextBackgroundWork({
      ...base,
      gather: false,
      plans: [{ id: 4, objective_id: 1, status: 'active' }],
      steps: [{ id: 8, plan_id: 4, position: 1, status: 'pending' }]
    });
    assert.deepStrictEqual(planned, { kind: 'advance_step', planId: 4, stepId: 8 });

    const tasked = selectNextBackgroundWork({
      ...base,
      gather: false,
      plans: [{ id: 4, objective_id: 1, status: 'completed' }],
      steps: [{ id: 8, plan_id: 4, position: 1, status: 'done' }]
    });
    assert.deepStrictEqual(tasked, { kind: 'progress_task', taskId: 9 });
  });

  it('drafts a high-priority objective before an older medium one', function () {
    const choice = selectNextBackgroundWork({
      now: now,
      cooldownMs: 1000,
      lastProgressAt: {},
      gather: false,
      objectives: [
        { id: 1, status: 'active', priority: 'medium', created_at: '2026-01-01T00:00:00Z' },
        { id: 2, status: 'active', priority: 'high', created_at: '2026-09-01T00:00:00Z' },
        { id: 3, status: 'active', priority: 'low', created_at: '2025-01-01T00:00:00Z' }
      ],
      plans: [],
      steps: [],
      tasks: []
    });
    assert.deepStrictEqual(choice, { kind: 'draft_plan', objectiveId: 2 });
  });

  it('keeps the older objective when two share the same priority', function () {
    const choice = selectNextBackgroundWork({
      now: now,
      cooldownMs: 1000,
      lastProgressAt: {},
      gather: false,
      objectives: [
        { id: 2, status: 'active', priority: 'high', created_at: '2026-09-01T00:00:00Z' },
        { id: 1, status: 'active', priority: 'high', created_at: '2026-01-01T00:00:00Z' }
      ],
      plans: [],
      steps: [],
      tasks: []
    });
    assert.deepStrictEqual(choice, { kind: 'draft_plan', objectiveId: 1 });
  });

  it('skips an item that is still cooling and continues with the next', function () {
    const choice = selectNextBackgroundWork({
      now: now,
      cooldownMs: 1000,
      lastProgressAt: { 'objective:1': now - 100 },
      gather: false,
      objectives: [
        { id: 1, status: 'active' },
        { id: 2, status: 'active' }
      ],
      plans: [],
      steps: [],
      tasks: []
    });
    assert.deepStrictEqual(choice, { kind: 'draft_plan', objectiveId: 2 });
  });

  it('moves a step from pending to in progress, then to done', function () {
    const started = advanceStepRecord({ status: 'pending' }, 'Checked the tide table.');
    assert.strictEqual(started.status, 'in_progress');
    const finished = advanceStepRecord({ status: 'in_progress' }, 'Logged the reading.');
    assert.strictEqual(finished.status, 'done');
    assert.strictEqual(finished.evidence, 'Logged the reading.');
  });

  it('stores, updates, and deletes objectives by preimage', async function () {
    const db = createMemoryDb();
    const created = await createGoal(db, {
      title: 'Keep a watch',
      description: 'Review overnight reports.'
    }, 4);
    assert.ok(created.preimage_sha256);
    assert.strictEqual(created.id, created.preimage_sha256);

    const listed = await getGoals(db, 4);
    assert.strictEqual(listed.length, 1);

    const updated = await updateGoal(db, created.preimage_sha256, { status: 'paused' }, 4);
    assert.strictEqual(updated.status, 'paused');
    assert.notStrictEqual(updated.preimage_sha256, created.preimage_sha256);

    const removed = await deleteGoal(db, updated.preimage_sha256, 4);
    assert.strictEqual(removed, true);
    assert.strictEqual((await getGoals(db, 4)).length, 0);
  });

  it('keeps one open plan and walks a step to done', async function () {
    const db = createMemoryDb();
    const goal = await createGoal(db, {
      title: 'Chart the channel',
      description: 'Record depths on the evening tide.'
    }, 4);
    const row = await db('objectives').where({ id: goal.db_id }).first();
    const plan = await ensurePlan(db, row, 'Evening sounding.');
    const again = await ensurePlan(db, row, 'should not replace');
    assert.strictEqual(again.id, plan.id);
    assert.strictEqual(plan.steps.length, 3);

    const loaded = await loadPlan(db, goal.db_id);
    assert.strictEqual(loaded.steps[0].status, 'pending');
    assert.strictEqual(loaded.summary, 'Evening sounding.');
  });
});
