'use strict';

/** How many exchanges the process keeps when the database is behind. */
const THOUGHT_MEMORY_LIMIT = 2000;

/** Stored text cap so one prompt cannot fill the log. */
const CONTENT_LIMIT = 12000;

const ROLES = {
  request: true,
  reply: true,
  note: true,
  error: true
};

/**
 * @param {*} value
 * @param {number} max
 * @returns {string}
 */
function clip (value, max) {
  const text = String(value == null ? '' : value);
  if (text.length <= max) return text;
  return text.slice(0, max);
}

/**
 * @param {*} value
 * @returns {number|null}
 */
function intOrNull (value) {
  if (value == null || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return number;
}

/**
 * Actor shown on an agent page for this exchange.
 * @param {string} from
 * @param {string} to
 * @returns {string}
 */
function counterpart (from, to) {
  if (from && from !== 'coordinator' && from !== 'user') return from;
  return to || from || 'agent';
}

/**
 * @param {string} label
 * @param {object|string} [request]
 * @returns {string}
 */
function actorLabel (label, request) {
  const name = label || 'agent';
  if (name === 'pool' && request && typeof request === 'object' && request.model) {
    return `pool:${request.model}`;
  }
  return name;
}

/**
 * Text the coordinator handed an agent.
 * @param {object|string} request
 * @returns {string}
 */
function exchangeRequestText (request) {
  if (request == null) return '';
  if (typeof request === 'string') return clip(request, CONTENT_LIMIT);
  const parts = [];
  if (request.query) parts.push(String(request.query));
  if (Array.isArray(request.messages) && request.messages.length) {
    const lines = request.messages.slice(-8).map((message) => {
      const role = message && message.role ? message.role : 'message';
      const content = message && message.content != null ? String(message.content) : '';
      return `${role}: ${content}`;
    });
    parts.push(lines.join('\n'));
  }
  return clip(parts.join('\n\n'), CONTENT_LIMIT);
}

/**
 * Text an agent handed back.
 * @param {object|string|Error} result
 * @returns {string}
 */
function exchangeResultText (result) {
  if (result == null) return '';
  if (typeof result === 'string') return clip(result, CONTENT_LIMIT);
  if (result instanceof Error) return clip(result.message || String(result), CONTENT_LIMIT);
  if (typeof result.content === 'string') return clip(result.content, CONTENT_LIMIT);
  if (typeof result.response === 'string') return clip(result.response, CONTENT_LIMIT);
  if (result.message && typeof result.message === 'string') return clip(result.message, CONTENT_LIMIT);
  if (result.content != null) return clip(result.content, CONTENT_LIMIT);
  return '';
}

/**
 * One stored exchange. Unknown roles become notes.
 * @param {object} input
 * @param {Date} [now]
 * @returns {object}
 */
function shapeThought (input, now) {
  const source = input || {};
  const role = ROLES[source.role] ? source.role : 'note';
  const from = clip(source.from_actor || source.from || 'coordinator', 64);
  const to = clip(source.to_actor || source.to || 'agent', 64);
  const stamp = source.created_at || (now || new Date()).toISOString();
  const seq = Number(source.seq) || 0;
  return {
    seq: seq,
    local_key: source.local_key || `${Date.now().toString(36)}-${seq}`,
    owner: intOrNull(source.owner),
    subject_type: clip(source.subject_type || 'system', 32),
    subject_id: source.subject_id == null || source.subject_id === '' ? null : clip(source.subject_id, 128),
    task_id: intOrNull(source.task_id),
    step_id: intOrNull(source.step_id),
    objective_id: intOrNull(source.objective_id),
    conversation_id: intOrNull(source.conversation_id),
    agent_name: clip(source.agent_name || counterpart(from, to), 64),
    kind: source.kind ? clip(source.kind, 40) : null,
    from_actor: from,
    to_actor: to,
    role: role,
    content: clip(source.content, CONTENT_LIMIT),
    created_at: stamp instanceof Date ? stamp.toISOString() : String(stamp)
  };
}

/**
 * Scope fields plus the exchange, with the exchange winning when it sets a field.
 * @param {object} scope
 * @param {object} partial
 * @returns {object}
 */
function mergeScope (scope, partial) {
  const base = Object.assign({}, scope || {});
  const extra = partial || {};
  Object.keys(extra).forEach((key) => {
    if (extra[key] !== undefined) base[key] = extra[key];
  });
  delete base.parent;
  delete base.userNoted;
  return base;
}

/**
 * Public row for the thought-process panel.
 * @param {object} row
 * @returns {object}
 */
function presentThought (row) {
  const source = row || {};
  let created = source.created_at;
  if (created instanceof Date) created = created.toISOString();
  return {
    id: source.id == null ? null : source.id,
    seq: Number(source.seq) || 0,
    local_key: source.local_key || null,
    created_at: created || null,
    subject_type: source.subject_type || null,
    subject_id: source.subject_id || null,
    kind: source.kind || null,
    from_actor: source.from_actor || null,
    to_actor: source.to_actor || null,
    role: source.role || 'note',
    content: source.content == null ? '' : String(source.content),
    agent_name: source.agent_name || null
  };
}

/**
 * @param {object} row
 * @param {object} filter
 * @returns {boolean}
 */
function thoughtVisible (row, filter) {
  if (!row || !filter) return false;
  if (filter.mode === 'agent') {
    const name = String(filter.agent_name || '');
    if (!name) return false;
    const named = row.agent_name === name || row.from_actor === name || row.to_actor === name;
    if (!named) return false;
    if (filter.includeUnowned && (row.owner == null)) return true;
    return filter.owner != null && String(row.owner) === String(filter.owner);
  }
  if (filter.mode === 'exact') {
    return row.subject_type === filter.subject_type && String(row.subject_id) === String(filter.subject_id);
  }
  if (filter.mode === 'conversation') {
    if (filter.conversation_id != null && Number(row.conversation_id) === Number(filter.conversation_id)) return true;
    if (filter.subject_id && row.subject_type === 'conversation' && String(row.subject_id) === String(filter.subject_id)) return true;
    return false;
  }
  const checks = [];
  if (filter.task_id != null) checks.push(Number(row.task_id) === Number(filter.task_id));
  if (filter.step_id != null) checks.push(Number(row.step_id) === Number(filter.step_id));
  if (filter.objective_id != null) checks.push(Number(row.objective_id) === Number(filter.objective_id));
  if (filter.subject_id) {
    checks.push(row.subject_type === (filter.subject_type || 'task') && String(row.subject_id) === String(filter.subject_id));
  }
  if (!checks.length) return false;
  return checks.some(Boolean);
}

/**
 * @param {object[]} rows
 * @param {object} filter
 * @returns {object[]}
 */
function selectThoughts (rows, filter) {
  const source = Array.isArray(rows) ? rows : [];
  const matched = source.filter((row) => thoughtVisible(row, filter));
  const limit = filter && filter.limit ? Number(filter.limit) : 300;
  if (matched.length <= limit) return matched;
  return matched.slice(matched.length - limit);
}

/**
 * @param {object} row
 * @returns {string}
 */
function thoughtKey (row) {
  if (row && row.local_key) return String(row.local_key);
  return `${row && row.seq}-${row && row.role}-${row && row.created_at}`;
}

/**
 * Database rows win when the same exchange is still in memory.
 * @param {object[]} stored
 * @param {object[]} memory
 * @returns {object[]}
 */
function mergeThoughts (stored, memory) {
  const byKey = new Map();
  (stored || []).forEach((row) => {
    const presented = presentThought(row);
    byKey.set(thoughtKey(presented), presented);
  });
  (memory || []).forEach((row) => {
    const presented = presentThought(row);
    const key = thoughtKey(presented);
    if (!byKey.has(key)) byKey.set(key, presented);
  });
  return Array.from(byKey.values()).sort((a, b) => {
    const at = Date.parse(a.created_at) || 0;
    const bt = Date.parse(b.created_at) || 0;
    if (at !== bt) return at - bt;
    return (a.seq || 0) - (b.seq || 0);
  });
}

/**
 * Keep the newest exchanges.
 * @param {object[]} log
 * @param {object} entry
 * @returns {object[]}
 */
function appendThought (log, entry) {
  const next = (Array.isArray(log) ? log : []).concat([entry]);
  if (next.length <= THOUGHT_MEMORY_LIMIT) return next;
  return next.slice(next.length - THOUGHT_MEMORY_LIMIT);
}

/**
 * Opening line for one unit of background work.
 * @param {object} work
 * @param {string} [title]
 * @returns {string}
 */
function workNote (work, title) {
  const kind = work && work.kind;
  const name = title ? ` "${clip(title, 180)}"` : '';
  if (kind === 'draft_plan') return `Coordinator is drafting a plan${name}.`;
  if (kind === 'advance_step') return `Coordinator is advancing a goal step${name}.`;
  if (kind === 'progress_task') return `Coordinator is working on this task${name}.`;
  if (kind === 'gather_source') return `Coordinator is syncing a source${name}.`;
  if (kind === 'conversation') return `Coordinator is answering in this conversation${name}.`;
  return `Coordinator is running background work${name}.`;
}

/**
 * Bind a chat turn to the conversation the user is reading.
 * @param {object} request
 * @returns {object}
 */
function thoughtScopeFromRequest (request) {
  const source = request || {};
  return {
    subject_type: source.conversation_id ? 'conversation' : 'request',
    subject_id: source.conversation_id ? String(source.conversation_id) : null,
    owner: source.user_id == null ? null : source.user_id,
    kind: 'conversation'
  };
}

module.exports = {
  THOUGHT_MEMORY_LIMIT,
  CONTENT_LIMIT,
  actorLabel,
  appendThought,
  counterpart,
  exchangeRequestText,
  exchangeResultText,
  mergeScope,
  mergeThoughts,
  presentThought,
  selectThoughts,
  shapeThought,
  thoughtScopeFromRequest,
  thoughtVisible,
  workNote
};
