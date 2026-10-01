'use strict';

const assert = require('assert');
const ActiveWorkerQueue = require('../services/activeWorkerQueue');

describe('ActiveWorkerQueue', function () {
  function harness () {
    const order = [];
    const hub = {
      redis: null,
      settings: {},
      _processConversationTurnJob: async function (job) {
        order.push('chat:' + job.id);
      },
      _pickNextBackgroundWork: async function () {
        return { kind: 'draft_plan', objectiveId: 3 };
      },
      _runBackgroundWork: async function (work) {
        order.push(work.kind);
      }
    };
    const queue = new ActiveWorkerQueue(hub);
    return { order, hub, queue };
  }

  it('runs a conversation turn before background progress', async function () {
    const { order, queue } = harness();
    queue.lastFinishedAt = Date.now() - ActiveWorkerQueue.IDLE_MS - 50;
    await queue.enqueue({ type: 'conversation_turn', id: 7 });
    await queue._tick();
    assert.deepStrictEqual(order, ['chat:7']);
    assert.strictEqual(queue.busy, false);

    queue.lastFinishedAt = Date.now() - ActiveWorkerQueue.IDLE_MS - 50;
    await queue._tick();
    assert.deepStrictEqual(order, ['chat:7', 'draft_plan']);
    assert.strictEqual(queue.busy, false);
  });

  it('releases the worker when a conversation job throws', async function () {
    const { queue, hub } = harness();
    hub._processConversationTurnJob = async function () {
      throw new Error('model down');
    };
    let marked = null;
    hub.db = function () {
      return {
        where () { return this; },
        update (patch) {
          marked = patch.status;
          return Promise.resolve(1);
        }
      };
    };
    await queue.enqueue({ type: 'conversation_turn', id: 1, response_message_id: 99 });
    await queue._tick();
    assert.strictEqual(queue.busy, false);
    assert.strictEqual(marked, 'error');
  });

  it('runs a source gather on the same worker as conversation', async function () {
    const order = [];
    const hub = {
      redis: null,
      settings: {},
      _processConversationTurnJob: async function (job) {
        order.push('chat:' + job.id);
      },
      _gatherNextDueSource: async function () {
        order.push('gather');
      },
      _pickNextBackgroundWork: async function () {
        return null;
      }
    };
    const queue = new ActiveWorkerQueue(hub);
    await queue.enqueue({ type: 'conversation_turn', id: 4 });
    await queue.enqueue({ type: 'gather_due_sources' });
    await queue._tick();
    await queue._tick();
    assert.deepStrictEqual(order, ['chat:4', 'gather']);
    assert.strictEqual(queue.busy, false);
  });

  it('does not start background work while a conversation is still queued', async function () {
    const { order, queue } = harness();
    queue.lastFinishedAt = 0;
    await queue.enqueue({ type: 'conversation_turn', id: 1 });
    await queue.enqueue({ type: 'conversation_turn', id: 2 });
    await queue._tick();
    assert.deepStrictEqual(order, ['chat:1']);
  });
});
