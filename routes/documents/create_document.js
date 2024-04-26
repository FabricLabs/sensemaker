'use strict';

const merge = require('lodash.merge');
const Actor = require('@fabric/core/types/actor');

module.exports = async function (req, res, next) {
  const obj = merge({}, req.body, { created: (new Date()).toISOString() });
  console.debug('[NOVO]', '[HTTP]', 'Creating new document:', req.body);
  // TODO: parse JSON, return to object before creating Actor
  const actor = new Actor(obj);
  const type = obj.type || 'document';

  // TODO: handle errors
  const created = await this.db('documents').insert({
    creator: req.user.id,
    fabric_id: actor.id,
    title: obj.title || `Untitled ${type.charAt(0).toUpperCase() + type.slice(1)}`,
    content: obj.content,
    status: 'draft'
  });

  return res.redirect(`/documents/${actor.id}`);
};
