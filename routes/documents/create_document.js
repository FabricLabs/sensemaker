'use strict';

const merge = require('lodash.merge');
const Actor = require('@fabric/core/types/actor');

module.exports = async function (req, res, next) {
  const { type, content } = req.body;
  // TODO: make error messages nicer, use both HTML and JSON depending on header
  if (!req.user || !req.user.id) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
  // ATTENTION: this allows the user to set any fields on the document, including 'status' and 'owner'
  const obj = merge({}, content, { created: (new Date()).toISOString() });
  console.debug('[NOVO]', '[HTTP]', 'Creating new document:', obj);

  this.generateDocumentOutline({
    type: type, // TODO: allow configuration of document type
    parameters: obj
  }).catch((exception) => {
    console.error('[NOVO]', '[HTTP]', 'Error generating document outline:', exception);
    return res.status(500).json({ status: 'error', message: 'Error generating document outline.' });
  }).then(async (output) => {
    console.debug('[NOVO]', '[HTTP]', 'Generated document outline:', output);
    if (!output || !output.content) {
      return res.status(500).json({ status: 'error', message: 'Error retrieving document outline.' });
    }

    const outline = output.content;
    console.debug('[NOVO]', '[HTTP]', 'Parsed document outline:', outline);

    // TODO: parse JSON, return to object before creating Actor
    const actor = new Actor(obj);
    const type = obj.type || 'document';

    // TODO: handle errors
    const created = await this.db('documents').insert({
      creator: req.user.id,
      fabric_id: actor.id,
      title: obj.title || req.body.type + ' title',
      content: obj.content,
      status: 'draft'
    });

    const documentId = created[0];  // Assuming created returns an array with the new document ID

    // Insert each section into the 'document_sections' table
    for (let section of outline) {
      const sectionActor = new Actor({ name: section.content, content: actor.id });
      const insertedSection = await this.db('document_sections').insert({
        document_id: documentId,
        section_number: section.number,
        title: section.content,
        fabric_id: sectionActor.id,
        creator: req.user.id,
      });

      // This is async, may be generated out of order
      // TODO: re-summarize at end, and/or ensure each generator is passed the previous output
      this.generateDocumentSection({
        object: {
          heading: section.content,
          outline: outline
        }
      }).catch((exception) => {
        console.error('[NOVO]', '[HTTP]', `Could not generate content for section ${section.number} of document ID ${documentId}:`, exception);
      }).then(async (generated) => {
        console.debug('[NOVO]', '[HTTP]', 'Generated document section:', generated);

        try {
          await this.db('document_sections').where({ id: insertedSection[0] }).update({ content: generated.content });
        } catch (exception) {
          console.error('[NOVO]', '[HTTP]', `Could not update content for section ${section.number} of document ID ${documentId}:`, exception);
        }
      });
    }

    return res.redirect(`/documents/${actor.id}`);
  });
};
