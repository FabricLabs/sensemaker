'use strict';

const assert = require('assert');
const Agent = require('../../types/agent');
const decideTaskEditRoute = require('../../routes/tasks/decide_task_edit');
const {
  DOCUMENT_CLIP,
  SELF_TOOL_NAMES,
  TASK_EDIT_FIELDS,
  checkToolArguments,
  decideTaskEdit,
  dispatchToolCall,
  listPendingTaskEdits,
  runSensemakerTool,
  sensemakerToolDefinitions,
  taskEditDelta
} = require('../../functions/sensemakerTools');

function createMemoryDb () {
  const tables = {};

  function table (name) {
    if (!tables[name]) tables[name] = [];
    const state = { filters: [], order: null, limit: null };
    const api = {
      insert (row) {
        const id = tables[name].reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;
        tables[name].push({
          ...row,
          id: id,
          created_at: row.created_at || new Date().toISOString(),
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
      orderBy (column, direction) {
        state.order = { column: column, direction: direction || 'asc' };
        return api;
      },
      limit (count) {
        state.limit = count;
        return api;
      },
      first () {
        return Promise.resolve(matched()[0]);
      },
      update (patch) {
        const rows = matched();
        rows.forEach((row) => {
          Object.assign(row, patch);
        });
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
          const left = a[column];
          const right = b[column];
          if (left === right) return 0;
          return left > right ? sign : -sign;
        });
      }
      if (state.limit != null) rows = rows.slice(0, state.limit);
      return rows;
    }

    return api;
  }

  table.dump = function (name) {
    return tables[name] || [];
  };

  return table;
}

function fakeRes () {
  return {
    statusCode: 200,
    body: null,
    status (code) {
      this.statusCode = code;
      return this;
    },
    json (body) {
      this.body = body;
      return this;
    },
    send (body) {
      this.body = body;
      return this;
    }
  };
}

describe('sensemaker self tools', function () {
  it('publishes the shared catalog and the task edit allowlist', function () {
    const tools = sensemakerToolDefinitions();
    assert.deepStrictEqual(tools.map((tool) => tool.function.name), SELF_TOOL_NAMES);
    tools.forEach((tool) => {
      assert.strictEqual(tool.type, 'function');
    });
    assert.ok(TASK_EDIT_FIELDS.indexOf('title') !== -1);
    assert.ok(TASK_EDIT_FIELDS.indexOf('description') !== -1);
    assert.ok(TASK_EDIT_FIELDS.indexOf('recommendation') !== -1);
    const delta = taskEditDelta({
      title: 'Retitle',
      ignored: 'nope',
      completed_at: '2026-10-30T15:00:00.000Z'
    });
    assert.strictEqual(delta.title, 'Retitle');
    assert.strictEqual(delta.ignored, undefined);
    assert.strictEqual(delta.completed_at, '2026-10-30 15:00:00');
    assert.strictEqual(checkToolArguments('propose_task_edit', { task_id: 't1' }).ok, false);
    assert.strictEqual(checkToolArguments('get_task', {}).ok, false);
  });

  it('keeps a proposal pending until the owner applies it', async function () {
    const db = createMemoryDb();
    await db('tasks').insert({
      fabric_id: 'task-1',
      owner: 1,
      creator: 1,
      title: 'Oil the winch',
      description: 'Before the tide turns.',
      created_at: '2026-10-01T00:00:00.000Z'
    });
    await db('tasks').insert({
      fabric_id: 'task-2',
      owner: 2,
      creator: 2,
      title: 'Someone else',
      description: 'Private.',
      created_at: '2026-10-02T00:00:00.000Z'
    });

    const listed = await runSensemakerTool(db, 'list_tasks', {}, 1);
    assert.strictEqual(listed.length, 1);
    assert.strictEqual(listed[0].id, 'task-1');
    assert.deepStrictEqual(await runSensemakerTool(db, 'list_tasks', {}, null), []);
    assert.deepStrictEqual(await runSensemakerTool(db, 'get_task', { task_id: 'task-1' }, 2), { error: 'not_found' });

    const proposed = await runSensemakerTool(db, 'propose_task_edit', {
      task_id: 'task-1',
      changes: { title: 'Oil the winch and check the line' }
    }, 1);
    assert.strictEqual(proposed.status, 'pending');
    assert.strictEqual(db.dump('tasks')[0].title, 'Oil the winch');
    const pending = await listPendingTaskEdits(db, 'task-1');
    assert.strictEqual(pending.length, 1);
    assert.strictEqual(pending[0].changes.title, 'Oil the winch and check the line');

    const denied = await decideTaskEdit(db, {
      userId: 2,
      taskId: 'task-1',
      editId: proposed.id,
      decision: 'approve'
    });
    assert.strictEqual(denied.status, 403);
    assert.strictEqual(db.dump('tasks')[0].title, 'Oil the winch');

    const res = fakeRes();
    await decideTaskEditRoute('approve').call({ db: db }, {
      user: { id: 2 },
      params: { id: 'task-1', editId: String(proposed.id) }
    }, res);
    assert.strictEqual(res.statusCode, 403);
    assert.strictEqual(db.dump('tasks')[0].title, 'Oil the winch');

    const rejected = await decideTaskEdit(db, {
      userId: 1,
      taskId: 'task-1',
      editId: proposed.id,
      decision: 'reject'
    });
    assert.strictEqual(rejected.status, 'rejected');
    assert.strictEqual(db.dump('tasks')[0].title, 'Oil the winch');

    const again = await runSensemakerTool(db, 'propose_task_edit', {
      task_id: 'task-1',
      changes: { description: 'Check the line too.' }
    }, 1);
    const applied = await decideTaskEdit(db, {
      userId: 1,
      taskId: 'task-1',
      editId: again.id,
      decision: 'approve'
    });
    assert.strictEqual(applied.status, 'applied');
    assert.strictEqual(db.dump('tasks')[0].description, 'Check the line too.');
    assert.strictEqual(db.dump('tasks')[0].title, 'Oil the winch');
    assert.deepStrictEqual(await runSensemakerTool(db, 'propose_task_edit', {
      task_id: 'task-1',
      changes: { title: 'Nope' }
    }, null), { error: 'forbidden' });
  });

  it('returns only the caller\'s conversations and documents', async function () {
    const db = createMemoryDb();
    const chat = await db('conversations').insert({
      fabric_id: 'chat-1',
      creator_id: 1,
      title: 'Dock notes',
      summary: 'Tide times',
      help_chat: 0,
      created_at: '2026-10-03T00:00:00.000Z'
    });
    await db('conversations').insert({
      fabric_id: 'chat-2',
      creator_id: 2,
      title: 'Other',
      summary: 'Hidden',
      help_chat: 0
    });
    await db('messages').insert({
      conversation_id: chat[0],
      user_id: 7,
      content: 'When is the next tide?'
    });
    await db('messages').insert({
      conversation_id: chat[0],
      user_id: 1,
      content: 'Just after dusk.'
    });

    const conversations = await runSensemakerTool(db, 'list_conversations', {}, 1);
    assert.strictEqual(conversations.length, 1);
    assert.strictEqual(conversations[0].id, 'chat-1');
    const conversation = await runSensemakerTool(db, 'get_conversation', { conversation_id: 'chat-1' }, 1);
    assert.strictEqual(conversation.messages.length, 2);
    assert.strictEqual(conversation.messages[1].content, 'Just after dusk.');
    assert.deepStrictEqual(await runSensemakerTool(db, 'get_conversation', { conversation_id: 'chat-2' }, 1), { error: 'not_found' });

    const long = 'x'.repeat(DOCUMENT_CLIP + 50);
    await db('documents').insert({
      fabric_id: 'doc-1',
      creator: 1,
      owner: 1,
      title: 'Chart',
      summary: 'Harbor chart',
      content: long,
      status: 'published',
      created_at: '2026-10-04T00:00:00.000Z'
    });
    await db('documents').insert({
      fabric_id: 'doc-2',
      creator: 2,
      owner: 2,
      title: 'Private log',
      content: 'secret',
      status: 'published'
    });

    const documents = await runSensemakerTool(db, 'list_documents', { query: 'harbor' }, 1);
    assert.strictEqual(documents.length, 1);
    assert.strictEqual(documents[0].id, 'doc-1');
    const document = await runSensemakerTool(db, 'get_document', { document_id: 'doc-1' }, 1);
    assert.strictEqual(document.content.length, DOCUMENT_CLIP);
    assert.deepStrictEqual(await runSensemakerTool(db, 'get_document', { document_id: 'doc-2' }, 1), { error: 'not_found' });
    assert.deepStrictEqual(await runSensemakerTool(db, 'list_documents', {}, null), []);
  });

  it('dispatches a registered tool and rejects an unknown one', async function () {
    const handlers = {
      list_tasks: async function () {
        return [{ id: 'task-1', title: 'Oil the winch' }];
      }
    };
    const listed = await dispatchToolCall(handlers, {
      function: { name: 'list_tasks', arguments: '{}' }
    }, { userId: 1 });
    assert.strictEqual(JSON.parse(listed)[0].title, 'Oil the winch');
    const unknown = await dispatchToolCall(handlers, {
      function: { name: 'http_get', arguments: '{"url":"https://example.com"}' }
    }, {});
    assert.strictEqual(JSON.parse(unknown).error, 'unknown_tool');
    const broken = await dispatchToolCall(handlers, {
      function: { name: 'list_tasks', arguments: '{not json' }
    }, {});
    assert.strictEqual(JSON.parse(broken).error, 'invalid_arguments');
  });

  it('gives an attached worker the shared catalog and keeps http_get off it', function () {
    const catalog = sensemakerToolDefinitions();
    const agent = new Agent({
      name: 'WORKER',
      tools: true,
      toolCatalog: catalog,
      peer: { on () {}, emit () {} }
    });
    assert.deepStrictEqual(agent.tools.map((tool) => tool.function.name), SELF_TOOL_NAMES);
    agent.settings.includeHttpGet = true;
    assert.strictEqual(agent.tools[agent.tools.length - 1].function.name, 'http_get');
    assert.strictEqual(agent.tools.length, SELF_TOOL_NAMES.length + 1);
  });
});
