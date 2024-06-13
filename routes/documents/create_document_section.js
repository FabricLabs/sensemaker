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
  const { title, content } = req.body;
  const existing = await this.db('document_sections').where({ document_id: document.id, section_number: target }).whereNot({status: 'deleted'}).first();
  //HERE IF THE USER WANTS TO CREATE A SECTION BETWEEN OTHER THAT ALREADY EXIST, WE NEED TO UPDATE THE NEXT SECTIONS "section_number"
  //we will need to make the next sections with the section_number +1
  if (existing) {
    if (existing.title == title) {
      return res.status(409).json({ status: 'error', message: 'Section already exists.' });
    }
    // Update the section numbers for existing sections
    await this.db('document_sections')
      .where('document_id', document.id)
      .andWhere('section_number', '>=', target)
      .whereNot('status','deleted')
      .increment('section_number', 1)
      .update({ updated_at: new Date() });
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
    section_number: target,
    content: obj.content,
    status: 'draft'
  });

  const sections = await this.db.select('*').from('document_sections').where('document_id', document.id).whereNot('status','deleted').orderBy('section_number', 'asc');

  return res.send(sections);
};
