'use strict';

const merge = require('lodash.merge');
const Actor = require('@fabric/core/types/actor');

module.exports = async function (req, res, next) {
  // TODO: make error messages nicer, use both HTML and JSON depending on header
  if (!req.user || !req.user.id) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }

  const document = await this.db('documents').where({ fabric_id: req.params.fabricID }).first();

  if (!document) {
    return res.status(404).json({ status: 'error', message: 'Document not found.' });
  }

  const target = req.params.id;
  const existing = await this.db('document_sections').where({ document_id: document.id, section_number: target }).first();

  if (existing) {
    return res.status(409).json({ status: 'error', message: 'Section already exists.' });
  }

  const obj = merge({}, req.body, { created: (new Date()).toISOString() });
  console.debug('[NOVO]', '[HTTP]', 'Creating document section:', obj);

  // TODO: parse JSON, return to object before creating Actor
  const actor = new Actor(obj);
  const type = obj.type || 'document';

  // TODO: handle errors
  const created = await this.db('document_sections').insert({
    creator: req.user.id,
    fabric_id: actor.id,
    document_id: document.id,
    title: obj.title || `Section ${target}`,
    content: obj.content,
    status: 'draft'
  });

  return res.redirect(`/documents/${req.params.fabricID}/sections/${target}`);
};
