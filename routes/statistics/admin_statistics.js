'use strict';

module.exports = async function (req, res, next) {
  const current = await this._getState();
  const waiting = await this.db('invitations').count('id as count').where({ status: 'waiting' }).first();
  current.inquiries.waiting = waiting.count;
  res.send(current);
};
