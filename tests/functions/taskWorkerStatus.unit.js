'use strict';

const assert = require('assert');
const { describeTaskWorker } = require('../../functions/taskWorkerStatus');

describe('task worker status', function () {
  const task = {
    id: 'fabric-task',
    fabric_id: 'fabric-task',
    db_id: 9,
    plan_step_id: 8,
    goal_title: 'Ship the release',
    progress_note: 'Called the client.',
    last_progress_at: '2026-10-03T12:00:00Z'
  };

  it('reports working when the focus is this task', function () {
    const status = describeTaskWorker(task, {
      kind: 'progress_task',
      taskFabricId: 'fabric-task',
      startedAt: '2026-10-03T12:01:00Z'
    }, true);
    assert.strictEqual(status.state, 'working');
    assert.strictEqual(status.label, 'Working on this task');
    assert.strictEqual(status.goalTitle, 'Ship the release');
  });

  it('reports a goal step while that step is in focus', function () {
    const status = describeTaskWorker(task, {
      kind: 'advance_step',
      stepId: 8,
      startedAt: '2026-10-03T12:01:00Z'
    }, true);
    assert.strictEqual(status.state, 'working');
    assert.strictEqual(status.label, 'Working on the goal step');
  });

  it('waits after the last progress note when the worker is idle', function () {
    const status = describeTaskWorker(task, null, false);
    assert.strictEqual(status.state, 'waiting');
    assert.strictEqual(status.progressNote, 'Called the client.');
  });

  it('stays paused until play, and complete tasks stay complete', function () {
    const paused = describeTaskWorker({ ...task, background_paused: true }, {
      kind: 'progress_task',
      taskFabricId: 'fabric-task'
    }, false);
    assert.strictEqual(paused.state, 'paused');

    const done = describeTaskWorker({ ...task, completed_at: '2026-10-03T13:00:00Z' }, null, false);
    assert.strictEqual(done.state, 'complete');
  });

  it('shows queued after play and before the worker starts', function () {
    const status = describeTaskWorker({ ...task, queued: true, last_progress_at: null }, null, false);
    assert.strictEqual(status.state, 'queued');
  });
});
