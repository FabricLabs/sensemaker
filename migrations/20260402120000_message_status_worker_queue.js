'use strict';

const STATUSES = ['ready', 'computing', 'queued', 'processing', 'streaming', 'error'];
const ENUM_DEF = STATUSES.map(s => `'${s}'`).join(', ');

/**
 * Extend messages.status for work-queue lifecycle: queued → processing → computing → ready.
 * Uses raw ALTER TABLE so MySQL reliably updates the ENUM definition.
 */
exports.up = function (knex) {
  return knex('messages')
    .where(function () {
      this.whereNull('status')
        .orWhere('status', '')
        .orWhereNotIn('status', STATUSES);
    })
    .update({ status: 'ready' })
    .then(() => knex.raw(`ALTER TABLE messages MODIFY COLUMN status ENUM(${ENUM_DEF}) NOT NULL DEFAULT 'ready'`));
};

exports.down = function (knex) {
  return knex('messages')
    .whereIn('status', ['queued', 'processing', 'streaming', 'error'])
    .update({ status: 'ready' })
    .then(() => knex.raw(`ALTER TABLE messages MODIFY COLUMN status ENUM('ready', 'computing') NOT NULL DEFAULT 'ready'`));
};
