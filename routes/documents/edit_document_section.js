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
  if (!existing) {
    return res.status(404).json({ status: 'error', message: 'Document not found.' });
  }

  // TODO: handle errors
  const updated = await this.db('document_sections').where({
    document_id: document.id,
    section_number: target
  }).update({
    title: req.body.title || `Section ${target}`,
    content: req.body.content, //null by default
    updated_at: new Date(),
  });

  const sections = await this.db.select('*').from('document_sections').where('document_id', document.id).whereNot('status','deleted').orderBy('section_number', 'asc');

  return res.send(sections);
};
