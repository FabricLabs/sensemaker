'use strict';

const toMySQLDatetime = require('./toMySQLDatetime');

/** How many model rounds may call tools before the next turn must answer. */
const MAX_SELF_TOOL_ROUNDS = 4;

const SELF_TOOL_NAMES = [
  'list_tasks',
  'get_task',
  'propose_task_edit',
  'list_conversations',
  'get_conversation',
  'list_documents',
  'get_document'
];

/** Fields a proposal may change. Same allowlist as PATCH /tasks/:id. */
const TASK_EDIT_FIELDS = [
  'title',
  'description',
  'due_date',
  'status',
  'priority',
  'assigned_to',
  'assigned_by',
  'tags',
  'notes',
  'completed_by',
  'recommendation'
];

const LIST_DEFAULT = 12;
const LIST_MAX = 20;
const TEXT_CLIP = 1500;
const NOTE_CLIP = 500;
const MESSAGE_CLIP = 400;
const DOCUMENT_CLIP = 2000;
const MESSAGE_LIMIT = 8;

/**
 * @param {string} name
 * @param {string} description
 * @param {object} properties
 * @param {string[]} required
 * @returns {object}
 */
function functionTool (name, description, properties, required) {
  return {
    type: 'function',
    function: {
      name: name,
      description: description,
      parameters: {
        type: 'object',
        properties: properties,
        required: required || []
      }
    }
  };
}

/**
 * OpenAI-style tools every Sensemaker worker receives.
 * @returns {object[]}
 */
function sensemakerToolDefinitions () {
  const limit = {
    type: 'integer',
    description: 'How many rows to return. Defaults to 12, at most 20.'
  };
  const query = {
    type: 'string',
    description: 'Optional text matched against titles and descriptions.'
  };
  const taskChanges = {
    type: 'object',
    description: 'Fields to change. The task is not updated until its owner applies this proposal.',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      due_date: { type: 'string', description: 'ISO date or MySQL datetime.' },
      status: { type: 'string' },
      priority: { type: 'string' },
      assigned_to: { type: 'string' },
      assigned_by: { type: 'string' },
      tags: { type: 'string' },
      notes: { type: 'string' },
      recommendation: { type: 'string' },
      completed_at: { type: 'string', description: 'When the task was completed.' },
      completed_by: { type: 'string' }
    }
  };

  return [
    functionTool('list_tasks', 'List the current user\'s tasks. Returns ids, titles, descriptions, due dates, completion, and progress notes.', { limit: limit, query: query }, []),
    functionTool('get_task', 'Read one of the current user\'s tasks by its id.', {
      task_id: { type: 'string', description: 'Task id (fabric id).' }
    }, ['task_id']),
    functionTool('propose_task_edit', 'Propose an edit to one of the current user\'s tasks. Stores a pending proposal and does not change the task. The owner applies or discards it.', {
      task_id: { type: 'string', description: 'Task id (fabric id).' },
      changes: taskChanges
    }, ['task_id', 'changes']),
    functionTool('list_conversations', 'List the current user\'s conversations. Returns ids, titles, and summaries.', { limit: limit, query: query }, []),
    functionTool('get_conversation', 'Read one of the current user\'s conversations, including a short slice of recent messages.', {
      conversation_id: { type: 'string', description: 'Conversation id (fabric id).' }
    }, ['conversation_id']),
    functionTool('list_documents', 'List documents the current user created or owns. Returns ids, titles, and summaries, not full text.', { limit: limit, query: query }, []),
    functionTool('get_document', 'Read one document the current user created or owns, with truncated content.', {
      document_id: { type: 'string', description: 'Document id (fabric id).' }
    }, ['document_id'])
  ];
}

/**
 * Copy of a task edit limited to the allowlist. Falsy values are omitted.
 * @param {object} body
 * @returns {object}
 */
function taskEditDelta (body) {
  const delta = {};
  const source = body && typeof body === 'object' ? body : {};
  for (let i = 0; i < TASK_EDIT_FIELDS.length; i++) {
    const key = TASK_EDIT_FIELDS[i];
    if (source[key]) delta[key] = source[key];
  }
  if (source.completed_at) {
    const date = new Date(source.completed_at);
    if (!Number.isNaN(date.getTime())) delta.completed_at = toMySQLDatetime(date);
  }
  return delta;
}

/**
 * @param {*} value
 * @param {number} [fallback]
 * @returns {number}
 */
function clampLimit (value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback || LIST_DEFAULT;
  return Math.min(LIST_MAX, Math.floor(n));
}

/**
 * @param {string} name
 * @param {object} args
 * @returns {{ ok: boolean, args?: object, error?: string }}
 */
function checkToolArguments (name, args) {
  const input = args && typeof args === 'object' ? args : {};
  if (SELF_TOOL_NAMES.indexOf(name) === -1) return { ok: false, error: 'unknown_tool' };

  if (name === 'list_tasks' || name === 'list_conversations' || name === 'list_documents') {
    return {
      ok: true,
      args: {
        limit: clampLimit(input.limit),
        query: input.query ? String(input.query).slice(0, 200) : ''
      }
    };
  }

  if (name === 'get_task' || name === 'get_conversation' || name === 'get_document') {
    const key = name === 'get_task' ? 'task_id' : (name === 'get_conversation' ? 'conversation_id' : 'document_id');
    const id = input[key];
    if (!id || typeof id !== 'string') return { ok: false, error: 'missing_id' };
    return { ok: true, args: { id: String(id).slice(0, 128) } };
  }

  if (!input.task_id || typeof input.task_id !== 'string') return { ok: false, error: 'missing_id' };
  if (!input.changes || typeof input.changes !== 'object' || Array.isArray(input.changes)) {
    return { ok: false, error: 'missing_changes' };
  }
  const changes = taskEditDelta(input.changes);
  if (!Object.keys(changes).length) return { ok: false, error: 'empty_patch' };
  return {
    ok: true,
    args: {
      task_id: String(input.task_id).slice(0, 128),
      changes: changes
    }
  };
}

/**
 * @param {*} value
 * @param {number} limit
 * @returns {string|null}
 */
function clip (value, limit) {
  if (value == null || value === '') return null;
  const text = String(value);
  if (text.length <= limit) return text;
  return text.slice(0, limit);
}

/**
 * @param {object} row
 * @param {string} query
 * @param {string[]} fields
 * @returns {boolean}
 */
function matchesQuery (row, query, fields) {
  if (!query) return true;
  const needle = String(query).toLowerCase();
  const hay = fields.map((field) => String((row && row[field]) || '')).join('\n').toLowerCase();
  return hay.indexOf(needle) !== -1;
}

/**
 * @param {object} row
 * @returns {object}
 */
function presentTask (row) {
  return {
    id: row.fabric_id,
    title: row.title,
    description: clip(row.description, TEXT_CLIP),
    due_date: row.due_date || null,
    completed_at: row.completed_at || null,
    progress_note: clip(row.progress_note, NOTE_CLIP),
    recommendation: clip(row.recommendation, NOTE_CLIP)
  };
}

/**
 * @param {object} row
 * @returns {object}
 */
function presentEdit (row) {
  let changes = row.patch;
  if (typeof changes === 'string') {
    try {
      changes = JSON.parse(changes);
    } catch (error) {
      changes = {};
    }
  }
  return {
    id: row.id,
    status: row.status,
    changes: changes || {},
    created_at: row.created_at || null
  };
}

/**
 * @param {object} row
 * @returns {boolean}
 */
function documentVisible (row) {
  if (!row) return false;
  if (row.status === 'deleted') return false;
  if (row.deleted === true || row.deleted === 1) return false;
  return true;
}

/**
 * @param {object} db
 * @param {number|string} userId
 * @param {number} limit
 * @param {string} query
 * @returns {Promise<object[]>}
 */
async function listTasksForUser (db, userId, limit, query) {
  const rows = await db('tasks').where({ owner: userId }).orderBy('created_at', 'desc').limit(LIST_MAX);
  return (rows || [])
    .filter((row) => matchesQuery(row, query, ['title', 'description', 'progress_note']))
    .slice(0, limit)
    .map(presentTask);
}

/**
 * @param {object} db
 * @param {number|string} userId
 * @param {string} taskId
 * @returns {Promise<object|null>}
 */
async function taskForUser (db, userId, taskId) {
  const row = await db('tasks').where({ fabric_id: taskId, owner: userId }).first();
  return row || null;
}

/**
 * @param {object} db
 * @param {string} fabricId
 * @returns {Promise<object[]>}
 */
async function listPendingTaskEdits (db, fabricId) {
  const rows = await db('task_edits').where({ fabric_id: fabricId, status: 'pending' }).orderBy('created_at', 'asc');
  return (rows || []).map(presentEdit);
}

/**
 * @param {object} db
 * @param {number|string} userId
 * @param {number} limit
 * @param {string} query
 * @returns {Promise<object[]>}
 */
async function listConversationsForUser (db, userId, limit, query) {
  const rows = await db('conversations').where({ creator_id: userId }).orderBy('created_at', 'desc').limit(LIST_MAX);
  return (rows || [])
    .filter((row) => Number(row.help_chat) !== 1)
    .filter((row) => matchesQuery(row, query, ['title', 'summary']))
    .slice(0, limit)
    .map((row) => {
      return {
        id: row.fabric_id,
        title: row.title || null,
        summary: clip(row.summary, NOTE_CLIP),
        created_at: row.created_at || null
      };
    });
}

/**
 * @param {object} db
 * @param {number|string} userId
 * @param {number} limit
 * @param {string} query
 * @returns {Promise<object[]>}
 */
async function listDocumentsForUser (db, userId, limit, query) {
  const created = await db('documents').where({ creator: userId }).orderBy('created_at', 'desc').limit(LIST_MAX);
  const owned = await db('documents').where({ owner: userId }).orderBy('created_at', 'desc').limit(LIST_MAX);
  const byId = new Map();
  const combined = (created || []).concat(owned || []);
  for (let i = 0; i < combined.length; i++) {
    const row = combined[i];
    if (!documentVisible(row) || row.id == null) continue;
    byId.set(row.id, row);
  }
  return Array.from(byId.values())
    .filter((row) => matchesQuery(row, query, ['title', 'description', 'summary']))
    .sort((a, b) => {
      const left = String(a.created_at || '');
      const right = String(b.created_at || '');
      if (left === right) return 0;
      return left > right ? -1 : 1;
    })
    .slice(0, limit)
    .map((row) => {
      return {
        id: row.fabric_id,
        title: row.title || null,
        summary: clip(row.summary || row.description, NOTE_CLIP),
        created_at: row.created_at || null
      };
    });
}

/**
 * @param {object} db
 * @param {number|string|null} userId
 * @param {string} name
 * @param {object} args
 * @returns {Promise<object|object[]>}
 */
/**
 * Accept either the model's raw arguments or the normalized shape from
 * {@link checkToolArguments} (`id` for reads).
 * @param {string} name
 * @param {object} args
 * @returns {object}
 */
function normalizeToolArguments (name, args) {
  if (!args || typeof args !== 'object') return args;
  if (name !== 'get_task' && name !== 'get_conversation' && name !== 'get_document') return args;
  if (!args.id) return args;
  const key = name === 'get_task' ? 'task_id' : (name === 'get_conversation' ? 'conversation_id' : 'document_id');
  if (args[key]) return args;
  const copy = Object.assign({}, args);
  copy[key] = args.id;
  return copy;
}

async function runSensemakerTool (db, name, args, userId) {
  const checked = checkToolArguments(name, normalizeToolArguments(name, args));
  if (!checked.ok) return { error: checked.error };
  const input = checked.args;

  if (userId == null || userId === '') {
    if (name === 'list_tasks' || name === 'list_conversations' || name === 'list_documents') return [];
    if (name === 'propose_task_edit') return { error: 'forbidden' };
    return { error: 'not_found' };
  }

  if (name === 'list_tasks') return listTasksForUser(db, userId, input.limit, input.query);
  if (name === 'get_task') {
    const task = await taskForUser(db, userId, input.id);
    if (!task) return { error: 'not_found' };
    return presentTask(task);
  }
  if (name === 'propose_task_edit') {
    const task = await taskForUser(db, userId, input.task_id);
    if (!task) return { error: 'not_found' };
    const inserted = await db('task_edits').insert({
      fabric_id: task.fabric_id,
      owner: userId,
      patch: JSON.stringify(input.changes),
      status: 'pending'
    });
    const id = Array.isArray(inserted) ? inserted[0] : inserted;
    return {
      id: id,
      task_id: task.fabric_id,
      status: 'pending',
      changes: input.changes
    };
  }
  if (name === 'list_conversations') return listConversationsForUser(db, userId, input.limit, input.query);
  if (name === 'get_conversation') {
    const conversation = await db('conversations').where({ fabric_id: input.id, creator_id: userId }).first();
    if (!conversation || Number(conversation.help_chat) === 1) return { error: 'not_found' };
    const recent = await db('messages').where({ conversation_id: conversation.id }).orderBy('id', 'desc').limit(MESSAGE_LIMIT);
    const messages = (recent || []).slice().reverse().map((message) => {
      return {
        role: Number(message.user_id) === 1 ? 'assistant' : 'user',
        content: clip(message.content, MESSAGE_CLIP)
      };
    });
    return {
      id: conversation.fabric_id,
      title: conversation.title || null,
      summary: clip(conversation.summary, NOTE_CLIP),
      messages: messages
    };
  }
  if (name === 'list_documents') return listDocumentsForUser(db, userId, input.limit, input.query);

  const created = await db('documents').where({ fabric_id: input.id, creator: userId }).first();
  const owned = created || await db('documents').where({ fabric_id: input.id, owner: userId }).first();
  if (!documentVisible(owned)) return { error: 'not_found' };
  return {
    id: owned.fabric_id,
    title: owned.title || null,
    summary: clip(owned.summary || owned.description, NOTE_CLIP),
    content: clip(owned.content, DOCUMENT_CLIP)
  };
}

/**
 * Apply or discard a pending task edit. Does not write the task on reject.
 * @param {object} db
 * @param {object} request
 * @param {number|string} request.userId
 * @param {string} request.taskId
 * @param {number|string} request.editId
 * @param {string} request.decision
 * @returns {Promise<object>}
 */
async function decideTaskEdit (db, request) {
  const userId = request && request.userId;
  const taskId = request && request.taskId;
  const editId = request && request.editId;
  const decision = request && request.decision;
  if (userId == null || userId === '') return { error: 'forbidden', status: 403 };

  const edit = await db('task_edits').where({ id: Number(editId), fabric_id: taskId }).first();
  if (!edit) return { error: 'not_found', status: 404 };
  if (String(edit.owner) !== String(userId)) return { error: 'forbidden', status: 403 };
  if (edit.status !== 'pending') return { error: 'not_pending', status: 409 };

  if (decision === 'reject') {
    await db('task_edits').where({ id: edit.id }).update({ status: 'rejected' });
    return { id: edit.id, task_id: taskId, status: 'rejected' };
  }

  const task = await taskForUser(db, userId, taskId);
  if (!task) return { error: 'not_found', status: 404 };
  let stored = edit.patch;
  if (typeof stored === 'string') {
    try {
      stored = JSON.parse(stored);
    } catch (error) {
      stored = {};
    }
  }
  const delta = taskEditDelta(stored);
  if (!Object.keys(delta).length) return { error: 'empty_patch', status: 400 };
  await db('tasks').where({ fabric_id: taskId, owner: userId }).update(delta);
  await db('task_edits').where({ id: edit.id }).update({ status: 'applied' });
  return { id: edit.id, task_id: taskId, status: 'applied', changes: delta };
}

/**
 * Run one model tool call against a handler map. Unknown names and bad
 * arguments become a JSON error string the model can read.
 * @param {object} handlers
 * @param {object} tool
 * @param {object} [context]
 * @returns {Promise<string>}
 */
async function dispatchToolCall (handlers, tool, context) {
  const name = tool && tool.function && tool.function.name;
  const raw = tool && tool.function && tool.function.arguments;
  let args;
  if (raw == null || raw === '') {
    args = {};
  } else if (typeof raw === 'object') {
    args = raw;
  } else {
    try {
      args = JSON.parse(raw);
    } catch (error) {
      return JSON.stringify({ error: 'invalid_arguments' });
    }
  }
  if (!name || SELF_TOOL_NAMES.indexOf(name) === -1) {
    return JSON.stringify({ error: 'unknown_tool', name: name || null });
  }
  const checked = checkToolArguments(name, args);
  if (!checked.ok) return JSON.stringify({ error: checked.error });
  const handler = handlers && handlers[name];
  if (typeof handler !== 'function') return JSON.stringify({ error: 'unknown_tool', name: name });
  try {
    const result = await handler(checked.args, context || {});
    return typeof result === 'string' ? result : JSON.stringify(result);
  } catch (error) {
    return JSON.stringify({
      error: 'tool_failed',
      message: error && error.message ? error.message : 'tool failed'
    });
  }
}

module.exports = {
  DOCUMENT_CLIP,
  MAX_SELF_TOOL_ROUNDS,
  MESSAGE_LIMIT,
  SELF_TOOL_NAMES,
  TASK_EDIT_FIELDS,
  checkToolArguments,
  decideTaskEdit,
  dispatchToolCall,
  listPendingTaskEdits,
  runSensemakerTool,
  sensemakerToolDefinitions,
  taskEditDelta
};
