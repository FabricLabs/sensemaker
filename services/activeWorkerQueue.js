'use strict';

/**
 * Single active worker per Sensemaker node: one job at a time, FIFO queue.
 *
 * - **Redis** (when `hub.redis` is connected): list key `sensemaker:active_worker_queue:v1` — RPUSH enqueue, LPOP dequeue.
 * - **Fallback**: in-memory array when Redis is unavailable.
 *
 * When the worker has been **idle** for {@link IDLE_MS}, the hub may run one **background task**
 * (oldest incomplete row in `tasks`) via {@link Sensemaker#_processBackgroundTaskJob}.
 */

const REDIS_KEY = 'sensemaker:active_worker_queue:v1';
const IDLE_MS = 60 * 1000;
const TICK_MS = 350;

class ActiveWorkerQueue {
  /**
   * @param {import('./sensemaker')} hub
   */
  constructor (hub) {
    this.hub = hub;
    /** @type {object[]} */
    this._memory = [];
    this.busy = false;
    this.lastFinishedAt = Date.now();
    /** @type {ReturnType<typeof setInterval>|null} */
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
      if (depth === 0 && Date.now() - this.lastFinishedAt >= IDLE_MS) {
        const bg = await this.hub._pickOldestBackgroundTask();
        if (bg) {
          this.busy = true;
          try {
            await this.hub._processBackgroundTaskJob(bg);
          } catch (e) {
            console.error('[SENSEMAKER:CORE]', '[WORKER]', 'Background task failed:', e);
          } finally {
            this.busy = false;
            this.lastFinishedAt = Date.now();
          }
        }
      }
      return;
    }

    this.busy = true;
    try {
      if (job.type === 'conversation_turn') {
        await this.hub._processConversationTurnJob(job);
      } else {
        console.warn('[SENSEMAKER:CORE]', '[WORKER]', 'Unknown job type:', job.type);
      }
    } catch (e) {
      console.error('[SENSEMAKER:CORE]', '[WORKER]', 'Job failed:', e);
      if (job.response_message_id != null) {
        await this.hub.db('messages').where({ id: job.response_message_id }).update({
          status: 'error',
          content: `Error: ${e.message || String(e)}`,
          updated_at: this.hub.db.fn.now()
        }).catch(() => {});
      }
    } finally {
      this.busy = false;
      this.lastFinishedAt = Date.now();
    }
  }
}

module.exports = ActiveWorkerQueue;
