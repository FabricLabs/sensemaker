'use strict';

const assert = require('assert');
const {
  actorLabel,
  appendThought,
  exchangeRequestText,
  exchangeResultText,
  mergeScope,
  mergeThoughts,
  presentThought,
  selectThoughts,
  shapeThought,
  thoughtScopeFromRequest,
  workNote
} = require('../../functions/thoughtLog');

describe('thought log', function () {
  it('shapes a coordinator request to the worker', function () {
    const row = shapeThought({
      seq: 1,
      from_actor: 'coordinator',
      to_actor: 'worker',
      role: 'request',
      content: 'Draft the next step.',
      subject_type: 'task',
      subject_id: 'fabric-task',
      task_id: 9,
      owner: 4,
      kind: 'progress_task'
    }, new Date('2026-10-03T12:00:00Z'));
    assert.strictEqual(row.from_actor, 'coordinator');
    assert.strictEqual(row.to_actor, 'worker');
    assert.strictEqual(row.agent_name, 'worker');
    assert.strictEqual(row.task_id, 9);
    assert.strictEqual(row.role, 'request');
    assert.ok(row.local_key);
  });

  it('keeps the prompt the coordinator sent, clipped', function () {
    const text = exchangeRequestText({
      query: 'What should we do next?',
      messages: [
        { role: 'system', content: 'Be concrete.' },
        { role: 'user', content: 'Ship the release.' }
      ]
    });
    assert.ok(text.indexOf('What should we do next?') === 0);
    assert.ok(text.indexOf('system: Be concrete.') !== -1);
    assert.ok(text.indexOf('user: Ship the release.') !== -1);

    const huge = exchangeRequestText('x'.repeat(13000));
    assert.strictEqual(huge.length, 12000);
  });

  it('reads the agent reply, including errors', function () {
    assert.strictEqual(exchangeResultText({ content: 'Call the client.' }), 'Call the client.');
    assert.strictEqual(exchangeResultText(new Error('runner died')), 'runner died');
  });

  it('names a pool member by model', function () {
    assert.strictEqual(actorLabel('pool', { model: 'llama3.2' }), 'pool:llama3.2');
    assert.strictEqual(actorLabel('SENSEMAKER', { model: 'llama3.2' }), 'SENSEMAKER');
  });

  it('lets the exchange override the open scope', function () {
    const merged = mergeScope({
      subject_type: 'task',
      task_id: 9,
      parent: { kind: 'outer' },
      userNoted: true
    }, {
      from_actor: 'worker',
      to_actor: 'coordinator',
      role: 'reply',
      content: 'Done.'
    });
    assert.strictEqual(merged.task_id, 9);
    assert.strictEqual(merged.content, 'Done.');
    assert.strictEqual(merged.parent, undefined);
    assert.strictEqual(merged.userNoted, undefined);
  });

  it('selects the task, its step, and its goal', function () {
    const rows = [
      shapeThought({ seq: 1, task_id: 9, from_actor: 'coordinator', to_actor: 'worker', role: 'note', content: 'task' }),
      shapeThought({ seq: 2, step_id: 8, from_actor: 'worker', to_actor: 'coordinator', role: 'reply', content: 'step' }),
      shapeThought({ seq: 3, objective_id: 3, from_actor: 'coordinator', to_actor: 'worker', role: 'request', content: 'goal' }),
      shapeThought({ seq: 4, task_id: 10, from_actor: 'coordinator', to_actor: 'worker', role: 'note', content: 'other' })
    ];
    const visible = selectThoughts(rows, { task_id: 9, step_id: 8, objective_id: 3 });
    assert.deepStrictEqual(visible.map((row) => row.content), ['task', 'step', 'goal']);
  });

  it('keeps an agent transcript to that user', function () {
    const rows = [
      shapeThought({ seq: 1, agent_name: 'SENSEMAKER', from_actor: 'SENSEMAKER', to_actor: 'coordinator', owner: 4, role: 'reply', content: 'mine' }),
      shapeThought({ seq: 2, agent_name: 'SENSEMAKER', from_actor: 'SENSEMAKER', to_actor: 'coordinator', owner: 5, role: 'reply', content: 'theirs' }),
      shapeThought({ seq: 3, agent_name: 'SENSEMAKER', from_actor: 'SENSEMAKER', to_actor: 'coordinator', owner: null, role: 'reply', content: 'health' })
    ];
    const mine = selectThoughts(rows, { mode: 'agent', agent_name: 'SENSEMAKER', owner: 4 });
    assert.deepStrictEqual(mine.map((row) => row.content), ['mine']);
    const admin = selectThoughts(rows, { mode: 'agent', agent_name: 'SENSEMAKER', owner: 4, includeUnowned: true });
    assert.deepStrictEqual(admin.map((row) => row.content), ['mine', 'health']);
  });

  it('merges the database copy over the memory copy of the same exchange', function () {
    const memory = [shapeThought({ seq: 1, local_key: 'abc', content: 'live', from_actor: 'worker', to_actor: 'coordinator', role: 'reply' })];
    const stored = [{ id: 7, seq: 1, local_key: 'abc', content: 'live', from_actor: 'worker', to_actor: 'coordinator', role: 'reply', created_at: '2026-10-03T12:00:00.000Z' }];
    const extra = shapeThought({ seq: 2, local_key: 'def', content: 'only memory', from_actor: 'coordinator', to_actor: 'worker', role: 'request', created_at: '2026-10-03T12:00:01.000Z' });
    const merged = mergeThoughts(stored, memory.concat([extra]));
    assert.strictEqual(merged.length, 2);
    assert.strictEqual(merged[0].id, 7);
    assert.strictEqual(merged[1].content, 'only memory');
    assert.strictEqual(presentThought(merged[0]).from_actor, 'worker');
  });

  it('drops the oldest exchanges once the memory log is full', function () {
    let log = [];
    for (let i = 0; i < 2002; i++) {
      log = appendThought(log, shapeThought({ seq: i, content: String(i), from_actor: 'coordinator', to_actor: 'worker', role: 'note' }));
    }
    assert.strictEqual(log.length, 2000);
    assert.strictEqual(log[0].content, '2');
  });

  it('describes each kind of background pass', function () {
    assert.strictEqual(workNote({ kind: 'progress_task' }, 'Call the client'), 'Coordinator is working on this task "Call the client".');
    assert.strictEqual(workNote({ kind: 'advance_step' }), 'Coordinator is advancing a goal step.');
    assert.strictEqual(workNote({ kind: 'draft_plan' }, 'Ship'), 'Coordinator is drafting a plan "Ship".');
    assert.strictEqual(workNote({ kind: 'gather_source' }), 'Coordinator is syncing a source.');
  });

  it('binds a chat turn to the conversation', function () {
    const scope = thoughtScopeFromRequest({ conversation_id: 'fabric-chat', user_id: 4, query: 'Hello' });
    assert.strictEqual(scope.subject_type, 'conversation');
    assert.strictEqual(scope.subject_id, 'fabric-chat');
    assert.strictEqual(scope.owner, 4);
    const loose = thoughtScopeFromRequest({ query: 'Hello' });
    assert.strictEqual(loose.subject_type, 'request');
    assert.strictEqual(loose.subject_id, null);
  });
});
