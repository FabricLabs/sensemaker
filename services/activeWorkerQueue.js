'use strict';

/**
 * Single active worker per Sensemaker node: one job at a time, FIFO queue.
 *
 * - **Redis** (when `hub.redis` is connected): list key `sensemaker:active_worker_queue:v1` — RPUSH enqueue, LPOP dequeue.
 * - **Fallback**: in-memory array when Redis is unavailable.
 *
 * When the worker has been **idle** for {@link IDLE_MS}, the hub runs one unit of
 * background progress (a due source, an objective plan, a plan step, or a task)
 * via {@link Sensemaker#_runBackgroundWork}. Conversation turns always dequeue first.
 */

const REDIS_KEY = 'sensemaker:active_worker_queue:v1';
const IDLE_MS = 2 * 1000;
const TICK_MS = 350;

class ActiveWorkerQueue {
  /**
   * @param {Sensemaker} hub
   */
  constructor (hub) {
    this.hub = hub;
    /** @type {object[]} */
    this._memory = [];
    this.busy = false;
    this.lastFinishedAt = Date.now();
    /** @type {*|null} */
    this._timer = null;
  }

  _redis () {
    const r = this.hub.redis;
    return r && r.isOpen ? r : null;
  }

  /**
   * @returns {Promise<number>}
   */
  async queueDepth () {
    const client = this._redis();
    if (client) {
      const n = await client.lLen(REDIS_KEY);
      return Number(n) || 0;
    }
    return this._memory.length;
  }

  /**
   * @param {object} job
   */
  async enqueue (job) {
    const payload = { ...job, enqueuedAt: Date.now() };
    const wire = JSON.stringify(payload);
    const client = this._redis();
    if (client) {
      await client.rPush(REDIS_KEY, wire);
    } else {
      this._memory.push(payload);
    }
    if (this.hub.settings && this.hub.settings.debug) {
      console.debug('[SENSEMAKER:CORE]', '[WORKER]', 'Enqueued', job.type, job.response_message_id || '');
    }
  }

  /**
   * @returns {Promise<object|null>}
   */
  async _dequeue () {
    const client = this._redis();
    if (client) {
      const raw = await client.lPop(REDIS_KEY);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('[SENSEMAKER:CORE]', '[WORKER]', 'Bad queue payload:', e.message);
        return null;
      }
    }
    if (this._memory.length) return this._memory.shift();
    return null;
  }

  start () {
    if (this._timer) return;
    this._timer = setInterval(() => {
      this._tick().catch((err) => console.error('[SENSEMAKER:CORE]', '[WORKER]', err));
    }, TICK_MS);
  }

  stop () {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  snapshotSync () {
    return {
      busy: this.busy,
      lastFinishedAt: this.lastFinishedAt,
      idleMs: Date.now() - this.lastFinishedAt,
      mode: this._redis() ? 'redis' : 'memory'
    };
  }

  async _tick () {
    if (this.busy) return;

    const job = await this._dequeue();
    if (!job) {
      const depth = await this.queueDepth();
      if (depth !== 0) return;
      if (Date.now() - this.lastFinishedAt < IDLE_MS) return;
      await this._runBackground();
      return;
    }

    this.busy = true;
    try {
      if (job.type === 'conversation_turn') {
        await this.hub._processConversationTurnJob(job);
      } else if (job.type === 'gather_due_sources') {
        if (typeof this.hub._gatherNextDueSource === 'function') {
          await this.hub._gatherNextDueSource();
        }
      } else {
        console.warn('[SENSEMAKER:CORE]', '[WORKER]', 'Unknown job type:', job.type);
      }
    } catch (e) {
      console.error('[SENSEMAKER:CORE]', '[WORKER]', 'Job failed:', e);
      if (job.response_message_id != null && this.hub.db) {
        const stamp = (this.hub.db.fn && this.hub.db.fn.now) ? this.hub.db.fn.now() : new Date();
        await this.hub.db('messages').where({ id: job.response_message_id }).update({
          status: 'error',
          content: `Error: ${e.message || String(e)}`,
          updated_at: stamp
        }).catch(() => {});
      }
    } finally {
      this.busy = false;
      this.lastFinishedAt = Date.now();
    }
  }

  async _runBackground () {
    this.busy = true;
    try {
      if (typeof this.hub._pickNextBackgroundWork === 'function') {
        const work = await this.hub._pickNextBackgroundWork();
        if (work && typeof this.hub._runBackgroundWork === 'function') {
          await this.hub._runBackgroundWork(work);
        }
        return;
      }
      if (typeof this.hub._pickOldestBackgroundTask === 'function') {
        const task = await this.hub._pickOldestBackgroundTask();
        if (task) await this.hub._processBackgroundTaskJob(task);
      }
    } catch (e) {
      console.error('[SENSEMAKER:CORE]', '[WORKER]', 'Background task failed:', e);
    } finally {
      this.busy = false;
      this.lastFinishedAt = Date.now();
    }
  }
}

ActiveWorkerQueue.IDLE_MS = IDLE_MS;

module.exports = ActiveWorkerQueue;
